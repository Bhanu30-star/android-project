import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CartLineItem,
  GenerateInvoicePayload,
  invoiceService,
} from '@/api/invoiceService';
import {
  InvoiceDraftState,
  initialDraftState,
  invoiceStorage,
} from '@/features/invoice/invoiceStore';
import {
  calculateInvoiceTotals,
  formatIndianCurrency,
} from '@/features/invoice/calc';
import { Colors, Typography, Shapes, Shadows } from '@/theme/tokens';
import { AdditionalChargesSheet } from './AdditionalChargesSheet';
import { RemarkAndDeliverySheet } from './RemarkAndDeliverySheet';
import { SignatureCanvasModal } from './SignatureCanvasModal';
import { TermsConditionsSheet } from './TermsConditionsSheet';

interface ReviewAndSubmitSheetProps {
  visible: boolean;
  onClose: () => void;
  draft: InvoiceDraftState;
  cartLines: CartLineItem[];
  cartTotals: {
    total_amount: number;
    total_discount: number;
    total_tax_amount: number;
    total_cess_amount: number;
    total_net_amount: number;
    total_crate?: number;
    total_bottle?: number;
  };
  onInvoiceCreated: () => void;
  onUpdateDraft: (patch: Partial<InvoiceDraftState>) => void;
}

export const ReviewAndSubmitSheet: React.FC<ReviewAndSubmitSheetProps> = ({
  visible,
  onClose,
  draft,
  cartLines,
  cartTotals,
  onInvoiceCreated,
  onUpdateDraft,
}) => {
  const queryClient = useQueryClient();

  // Child bottom sheets
  const [chargesOpen, setChargesOpen] = useState(false);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Math summary
  const totalsSummary = calculateInvoiceTotals(
    cartLines.map((l) => ({
      baseAmount: l.total_amount,
      discountAmount: l.discount,
      taxableAmount: l.total_amount - l.discount,
      gstAmount: l.tax_amount,
      cessAmount: l.cess_amount,
      netAmount: l.net_amount,
    })),
    draft.charges
  );

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: (payload: GenerateInvoicePayload) =>
      invoiceService.generateSaleInvoice(payload),
    onSuccess: async () => {
      await invoiceStorage.clearDraft();
      queryClient.invalidateQueries({ queryKey: ['invoice-cart'] });
      Alert.alert(
        'Invoice Created',
        `Invoice for ${formatIndianCurrency(
          totalsSummary.finalPayableAmount
        )} has been generated successfully.`,
        [
          {
            text: 'Done',
            onPress: () => {
              onInvoiceCreated();
              onClose();
            },
          },
        ]
      );
    },
    onError: (err: any) => {
      Alert.alert('Submission Error', err?.response?.data?.message || 'Failed to generate invoice');
    },
  });

  const handleSubmit = () => {
    if (!draft.party) {
      Alert.alert('Required', 'Please select a customer party');
      return;
    }
    if (cartLines.length === 0) {
      Alert.alert('Required', 'Please add at least one product line');
      return;
    }
    if (totalsSummary.finalPayableAmount <= 0) {
      Alert.alert('Error', 'Net invoice amount must be greater than zero');
      return;
    }

    const payload: GenerateInvoicePayload = {
      source: 'app',
      party_id: draft.party.partyId,
      searchSource_admin: draft.soldBy,
      credit_amt: draft.creditAmount,
      advance_amt: draft.advanceAmount,
      invoice_type: draft.invoiceType,
      invoice_txn_date: draft.invoiceDate.replace('T', ' ').substring(0, 19),
      billtype: draft.taxPreference,
      reverse_charge: draft.reverseCharge,
      service_type: draft.deliveryMode,
      total_crate: cartTotals.total_crate || 0,
      total_bottle: cartTotals.total_bottle || 0,
      purchase_orderno: draft.purchaseOrderNo,
      shipping_address: draft.shippingAddress,
      broker_no: draft.brokerNo,
      docket_no: draft.docketNo,
      courier_agency: draft.courierAgency,
      courier_date: draft.courierDate,
      remark: draft.remark,
      tot_amt_val: totalsSummary.totalBaseAmount,
      labour_charges: draft.charges.labour || '',
      freight_charges: draft.charges.freight || '',
      other_expence_charges: draft.charges.other || '',
      tcs_applicable: draft.charges.tcsApplicable ? 'Yes' : 'No',
      tcs_amount: draft.charges.tcsApplicable ? draft.charges.tcsAmount : '',
      total_discount: draft.charges.overallDiscount || 0,
      net_amount: totalsSummary.finalPayableAmount,
      calculate_final_amt: totalsSummary.finalPayableAmount,
      calculate_disc_amt: totalsSummary.totalProductDiscount,
      calculate_cess_amt: totalsSummary.totalCessAmount,
      signature: draft.signatureBase64,
      payment_mode: draft.paymentMode,
      payment_type: draft.paymentType,
      bank_name: draft.bankName,
      cheque_txn_no: draft.chequeTxnNo,
      cheque_txn_date: draft.chequeDate,
      deposit_bank: draft.depositBank ? Number(draft.depositBank) : 0,
      cheque_amt: draft.chequeAmt,
      credit_days: draft.creditDays,
    };

    submitMutation.mutate(payload);
  };

  const handleClearForm = () => {
    Alert.alert('Reset Invoice', 'Clear all invoice fields and start over?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await invoiceStorage.clearDraft();
          onUpdateDraft(initialDraftState);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          {/* Top Bar */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={Colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Review & Submit</Text>
              <Text style={styles.subtitle}>
                {draft.party?.partyName || 'Select Customer'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClearForm} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. Items Summary Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Items ({cartLines.length})</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.cardActionText}>Edit items</Text>
                </TouchableOpacity>
              </View>

              {cartLines.map((line, idx) => (
                <View key={line.cart_id || idx} style={styles.lineItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineItemName}>{line.product_name}</Text>
                    <Text style={styles.lineItemMeta}>
                      {line.quantity} × {formatIndianCurrency(line.price)} · {line.bill_type}
                    </Text>
                  </View>
                  <Text style={styles.lineItemTotal}>
                    {formatIndianCurrency(line.net_amount)}
                  </Text>
                </View>
              ))}
            </View>

            {/* 2. Totals Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Totals Breakdown</Text>
                <TouchableOpacity onPress={() => setChargesOpen(true)}>
                  <View style={styles.addChargesBtn}>
                    <Feather name="plus" size={14} color={Colors.primary} />
                    <Text style={styles.addChargesText}>Charges & Disc.</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalVal}>
                  {formatIndianCurrency(totalsSummary.totalBaseAmount)}
                </Text>
              </View>

              {totalsSummary.totalProductDiscount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Product Discounts</Text>
                  <Text style={[styles.totalVal, { color: '#0B7A4D' }]}>
                    -{formatIndianCurrency(totalsSummary.totalProductDiscount)}
                  </Text>
                </View>
              )}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Taxable Amount</Text>
                <Text style={styles.totalVal}>
                  {formatIndianCurrency(totalsSummary.totalTaxableAmount)}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GST Amount</Text>
                <Text style={styles.totalVal}>
                  {formatIndianCurrency(totalsSummary.totalGstAmount)}
                </Text>
              </View>

              {totalsSummary.totalCessAmount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CESS</Text>
                  <Text style={styles.totalVal}>
                    {formatIndianCurrency(totalsSummary.totalCessAmount)}
                  </Text>
                </View>
              )}

              {totalsSummary.totalAdditionalCharges > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Additional Charges</Text>
                  <Text style={styles.totalVal}>
                    +{formatIndianCurrency(totalsSummary.totalAdditionalCharges)}
                  </Text>
                </View>
              )}

              {totalsSummary.overallDiscount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Overall Discount</Text>
                  <Text style={[styles.totalVal, { color: '#0B7A4D' }]}>
                    -{formatIndianCurrency(totalsSummary.overallDiscount)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.netAmountRow}>
                <View>
                  <Text style={styles.netAmountTitle}>Net Payable</Text>
                  <Text style={styles.netAmountSubtitle}>Inclusive of all taxes</Text>
                </View>
                <Text style={styles.netAmountValue}>
                  {formatIndianCurrency(totalsSummary.finalPayableAmount)}
                </Text>
              </View>
            </View>

            {/* 3. Payment Mode & Delivery Mode */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment & Delivery</Text>

              {/* Payment Mode Selector */}
              <Text style={styles.fieldLabel}>Payment Mode</Text>
              <View style={styles.modeRow}>
                {(['Cash', 'Credit', 'Online', 'Cheque'] as const).map((mode) => {
                  const isSelected = draft.paymentMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.modeChip, isSelected && styles.modeChipActive]}
                      onPress={() => onUpdateDraft({ paymentMode: mode })}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          isSelected && styles.modeChipTextActive,
                        ]}
                      >
                        {mode}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Delivery Mode Selector */}
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Delivery Mode</Text>
              <View style={styles.modeRow}>
                {(['Manual', 'Courier'] as const).map((dm) => {
                  const isSelected = draft.deliveryMode === dm;
                  return (
                    <TouchableOpacity
                      key={dm}
                      style={[styles.modeChip, isSelected && styles.modeChipActive]}
                      onPress={() => onUpdateDraft({ deliveryMode: dm })}
                    >
                      <Text
                        style={[
                          styles.modeChipText,
                          isSelected && styles.modeChipTextActive,
                        ]}
                      >
                        {dm}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Action Tiles: Delivery/Remark, Terms, Signature */}
            <View style={styles.actionTilesGroup}>
              {/* Delivery & Remark */}
              <TouchableOpacity
                style={styles.actionTile}
                onPress={() => setRemarkOpen(true)}
              >
                <View style={styles.actionTileIcon}>
                  <Feather name="truck" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTileTitle}>Delivery Info & Remark</Text>
                  <Text style={styles.actionTileSubtitle} numberOfLines={1}>
                    {draft.remark || draft.shippingAddress || 'Tap to add shipping details'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              {/* Authorized Signature */}
              <TouchableOpacity
                style={styles.actionTile}
                onPress={() => setSignatureOpen(true)}
              >
                <View style={styles.actionTileIcon}>
                  <Feather name="edit-3" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTileTitle}>Authorized Signature</Text>
                  <Text style={styles.actionTileSubtitle}>
                    {draft.signatureBase64 ? 'Signature captured' : 'Tap to sign'}
                  </Text>
                </View>
                {draft.signatureBase64 ? (
                  <Feather name="check-circle" size={18} color="#0B7A4D" />
                ) : (
                  <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>

              {/* Terms & Conditions */}
              <TouchableOpacity
                style={styles.actionTile}
                onPress={() => setTermsOpen(true)}
              >
                <View style={styles.actionTileIcon}>
                  <Feather name="shield" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTileTitle}>Terms & Conditions</Text>
                  <Text style={styles.actionTileSubtitle}>
                    For {draft.party?.partyName || 'Customer'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Sticky Bottom Bar */}
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.stickyPayableLabel}>Net Payable</Text>
              <Text style={styles.stickyPayableVal}>
                {formatIndianCurrency(totalsSummary.finalPayableAmount)}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitInvoiceBtn,
                submitMutation.isPending && styles.disabledBtn,
              ]}
              onPress={handleSubmit}
              disabled={submitMutation.isPending}
              activeOpacity={0.8}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitInvoiceText}>Submit Invoice</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Child Sheets */}
      <AdditionalChargesSheet
        visible={chargesOpen}
        onClose={() => setChargesOpen(false)}
        charges={draft.charges}
        onSave={(newCharges) => onUpdateDraft({ charges: newCharges })}
      />

      <RemarkAndDeliverySheet
        visible={remarkOpen}
        onClose={() => setRemarkOpen(false)}
        shippingAddress={draft.shippingAddress}
        purchaseOrderNo={draft.purchaseOrderNo}
        brokerNo={draft.brokerNo}
        docketNo={draft.docketNo}
        courierAgency={draft.courierAgency}
        courierDate={draft.courierDate}
        remark={draft.remark}
        onSave={(data) => onUpdateDraft(data)}
      />

      <SignatureCanvasModal
        visible={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onSave={(sig) => onUpdateDraft({ signatureBase64: sig })}
      />

      <TermsConditionsSheet
        visible={termsOpen}
        onClose={() => setTermsOpen(false)}
        partyName={draft.party?.partyName || ''}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 24, 64, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    ...Shadows.card,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tabBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clearBtn: {
    backgroundColor: '#FFE3E3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Shapes.radiusSmall,
  },
  clearBtnText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#B01E25',
  },
  body: {
    flex: 1,
    padding: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.radiusMedium,
    padding: 16,
    marginBottom: 14,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  cardActionText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  lineItemName: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  lineItemMeta: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  lineItemTotal: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  addChargesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  addChargesText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  totalVal: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginVertical: 10,
  },
  netAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  netAmountTitle: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  netAmountSubtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  netAmountValue: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  fieldLabel: {
    fontFamily: Typography.statLabel.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusSmall,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  modeChipActive: {
    backgroundColor: '#EEEDFF',
    borderColor: Colors.primary,
  },
  modeChipText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modeChipTextActive: {
    color: Colors.primaryDeep,
    fontWeight: '800',
  },
  actionTilesGroup: {
    marginBottom: 20,
    gap: 10,
  },
  actionTile: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.radiusMedium,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.card,
  },
  actionTileIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTileTitle: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  actionTileSubtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.card,
  },
  stickyPayableLabel: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  stickyPayableVal: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  submitInvoiceBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 24,
    borderRadius: Shapes.radiusMedium,
    ...Shadows.card,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitInvoiceText: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
