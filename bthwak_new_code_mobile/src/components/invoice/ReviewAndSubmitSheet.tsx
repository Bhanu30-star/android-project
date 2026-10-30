import React, { useState, useRef } from 'react';
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
  toPaise,
  toRupees,
} from '@/features/invoice/calc';
import { Colors, Shadows } from '@/theme/tokens';
import { AdditionalChargesSheet } from './AdditionalChargesSheet';
import { RemarkAndDeliverySheet } from './RemarkAndDeliverySheet';
import { SignatureCanvasModal } from './SignatureCanvasModal';
import { TermsConditionsSheet } from './TermsConditionsSheet';
import { PaymentDetailsSheet, PaymentDetailsData } from './PaymentDetailsSheet';

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
  const isSubmittingRef = useRef(false);

  // Child bottom sheets
  const [chargesOpen, setChargesOpen] = useState(false);
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [createdInvoiceInfo, setCreatedInvoiceInfo] = useState<{
    invoiceNo?: string;
    amount: number;
    partyName: string;
  } | null>(null);

  // Exact math summary from pure module
  const totalsSummary = calculateInvoiceTotals(
    cartLines.map((l) => ({
      baseAmount: l.total_amount,
      discountAmount: l.discount,
      taxableAmount: l.taxable_amount || (l.total_amount - l.discount),
      gstAmount: l.tax_amount,
      cessAmount: l.cess_amount,
      netAmount: l.net_amount,
    })),
    draft.charges
  );

  // Submit mutation with double-tap protection
  const submitMutation = useMutation({
    mutationFn: (payload: GenerateInvoicePayload) =>
      invoiceService.generateSaleInvoice(payload),
    onSuccess: async (res) => {
      isSubmittingRef.current = false;
      await invoiceStorage.clearDraft();
      queryClient.invalidateQueries({ queryKey: ['invoice-cart'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-product-catalog'] });

      const invoiceBillNo =
        res?.data?.bill_no ||
        res?.data?.invoice_no ||
        res?.message ||
        'Generated';

      setCreatedInvoiceInfo({
        invoiceNo: String(invoiceBillNo),
        amount: totalsSummary.roundedPayableAmount,
        partyName: draft.party?.partyName || 'Customer',
      });
      setSuccessModalVisible(true);
    },
    onError: (err: any) => {
      isSubmittingRef.current = false;
      const errData = err?.response?.data;
      let msg = 'Failed to generate invoice';
      if (errData?.message) {
        msg = Array.isArray(errData.message) ? errData.message.join('\n') : String(errData.message);
      } else if (err?.message) {
        msg = err.message;
      }
      Alert.alert('Submission Error', msg);
    },
  });

  const handlePaymentModeSelect = (mode: 'Cash' | 'Credit' | 'Online' | 'Cheque') => {
    onUpdateDraft({ paymentMode: mode });
    if (mode !== 'Cash') {
      setPaymentDetailsOpen(true);
    }
  };

  const handleSavePaymentDetails = (data: PaymentDetailsData) => {
    onUpdateDraft({
      paymentType: data.paymentType,
      bankName: data.bankName,
      chequeTxnNo: data.txnNo,
      chequeDate: data.chequeDate,
      depositBank: data.depositBank,
      chequeAmt: data.chequeAmt,
      creditDays: data.creditDays,
    });
  };

  const handleSubmit = () => {
    if (isSubmittingRef.current || submitMutation.isPending) {
      return;
    }

    if (!draft.party) {
      Alert.alert('Required', 'Please select a customer party');
      return;
    }
    if (cartLines.length === 0) {
      Alert.alert('Required', 'Please add at least one product line');
      return;
    }
    if (totalsSummary.roundedPayableAmount <= 0) {
      Alert.alert('Error', 'Net invoice amount must be greater than zero');
      return;
    }

    // Payment validation matching web
    if (draft.paymentMode === 'Cheque') {
      if (!draft.chequeTxnNo) {
        Alert.alert('Validation Error', 'Cheque number is required. Please tap "Edit" under Payment.');
        setPaymentDetailsOpen(true);
        return;
      }
      if (!draft.chequeDate) {
        Alert.alert('Validation Error', 'Cheque date is required.');
        setPaymentDetailsOpen(true);
        return;
      }
      if (!draft.bankName) {
        Alert.alert('Validation Error', 'Bank name is required for cheque payment.');
        setPaymentDetailsOpen(true);
        return;
      }
    }

    if (draft.paymentMode === 'Credit') {
      if (!draft.creditDays || draft.creditDays <= 0) {
        Alert.alert('Validation Error', 'Credit days are required. Please tap "Edit" under Payment.');
        setPaymentDetailsOpen(true);
        return;
      }
    }

    // Delivery mode validation: Courier requires shipping details from web
    if (draft.deliveryMode === 'Courier') {
      const missingCourierFields: string[] = [];
      if (!draft.courierAgency) missingCourierFields.push('Courier Agency');
      if (!draft.docketNo) missingCourierFields.push('Docket No');
      if (!draft.courierDate) missingCourierFields.push('Courier Date');
      if (!draft.shippingAddress) missingCourierFields.push('Shipping Address');

      if (missingCourierFields.length > 0) {
        Alert.alert(
          'Courier Shipping Details Required',
          `Courier delivery requires: ${missingCourierFields.join(', ')}. Please fill them in Delivery info.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Details',
              onPress: () => setRemarkOpen(true),
            },
          ]
        );
        return;
      }
    }

    isSubmittingRef.current = true;

    const now = new Date();
    const invDate = new Date(draft.invoiceDate);
    const validInvDate = !isNaN(invDate.getTime()) ? invDate : now;
    // Cap date at current moment to prevent future date rejection (422)
    const finalDate = validInvDate > now ? now : validInvDate;
    const pad = (n: number) => String(n).padStart(2, '0');
    const safeTxnDate = `${finalDate.getFullYear()}-${pad(finalDate.getMonth() + 1)}-${pad(finalDate.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const finalPayable = Math.max(1, totalsSummary.roundedPayableAmount);
    const baseAmt = Math.max(
      1,
      Number(totalsSummary.totalBaseAmount || cartTotals.total_amount || finalPayable)
    );

    const payload: GenerateInvoicePayload = {
      source: 'app',
      party_id: draft.party.partyId,
      searchSource_admin: String(draft.soldBy || 'admin'),
      credit_amt: Number(draft.creditAmount) || 0,
      advance_amt: Number(draft.advanceAmount) || 0,
      invoice_type: draft.invoiceType,
      invoice_txn_date: safeTxnDate,
      billtype: draft.taxPreference || 'Inclusive',
      reverse_charge: 'No', // Always 'No'
      service_type: draft.deliveryMode,
      total_crate: Number(cartTotals.total_crate) || 0,
      total_bottle: Number(cartTotals.total_bottle) || 0,
      purchase_orderno: draft.purchaseOrderNo || '',
      shipping_address: draft.shippingAddress || '',
      broker_no: draft.brokerNo || '',
      docket_no: draft.docketNo || '',
      courier_agency: draft.courierAgency || '',
      courier_date: draft.courierDate || '',
      remark: draft.remark || '', // Always string to prevent dto.remark.trim() TypeError
      tot_amt_val: baseAmt,
      labour_charges: String(draft.charges.labour || ''),
      freight_charges: String(draft.charges.freight || ''),
      other_expence_charges: String(draft.charges.other || ''),
      tcs_applicable: draft.charges.tcsApplicable ? 'Yes' : 'No',
      tcs_amount: draft.charges.tcsApplicable ? String(draft.charges.tcsAmount || '0') : '',
      total_discount: Number(draft.charges.overallDiscount) || 0,
      dist_dsr_require: 'No', // Required enum in NestJS DTO!
      distributor_place_supply: '',
      net_amount: finalPayable,
      calculate_final_amt: finalPayable,
      calculate_disc_amt: totalsSummary.totalProductDiscount,
      calculate_cess_amt: totalsSummary.totalCessAmount,
      signature: draft.signatureBase64 || '',
      payment_mode: draft.paymentMode,
      payment_type: draft.paymentMode === 'Online' ? (draft.paymentType || 'UPI') : '',
      bank_name: draft.paymentMode === 'Cheque' ? (draft.bankName || '') : '',
      cheque_txn_no: draft.paymentMode === 'Cheque' ? (draft.chequeTxnNo || '') : '',
      cheque_txn_date: draft.paymentMode === 'Cheque' ? (draft.chequeDate || '') : '',
      deposit_bank: draft.depositBank ? Number(draft.depositBank) : 0,
      cheque_amt: Number(draft.chequeAmt) || 0,
      credit_days: Number(draft.creditDays) || 0,
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

  // Helper text for payment summary
  const getPaymentSummaryText = () => {
    if (draft.paymentMode === 'Cash') {
      return 'Cash Payment';
    }
    if (draft.paymentMode === 'Credit') {
      const days = draft.creditDays || 30;
      const d = new Date();
      d.setDate(d.getDate() + days);
      const dueStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      return `Credit (${days} days · Due ${dueStr})`;
    }
    if (draft.paymentMode === 'Online') {
      const type = draft.paymentType || 'UPI';
      const ref = draft.chequeTxnNo ? ` · Ref #${draft.chequeTxnNo}` : '';
      return `Online (${type}${ref})`;
    }
    if (draft.paymentMode === 'Cheque') {
      const no = draft.chequeTxnNo ? `#${draft.chequeTxnNo}` : 'No. pending';
      const bnk = draft.bankName ? ` · ${draft.bankName}` : '';
      return `Cheque (${no}${bnk})`;
    }
    return draft.paymentMode;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          {/* Top Bar with accurate Subtitle (Requirement 9) */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={Colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Review & Submit</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {draft.party?.partyName
                  ? `${draft.party.partyName} ${draft.party.partyPhone ? `(${draft.party.partyPhone})` : ''}`
                  : 'Select Customer'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClearForm} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* 1. Items Summary Card (Requirement 3) */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  Items ({cartLines.length} item{cartLines.length === 1 ? '' : 's'})
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.cardActionText}>+ Add items</Text>
                </TouchableOpacity>
              </View>

              {cartLines.map((line, idx) => {
                const totalGstPaise = toPaise(line.tax_amount || 0);
                const halfGstPaise = Math.floor(totalGstPaise / 2);
                const otherHalfPaise = totalGstPaise - halfGstPaise;
                const cgst = toRupees(halfGstPaise);
                const sgst = toRupees(otherHalfPaise);
                const halfRate = (line.product_gst || 0) / 2;

                return (
                  <View key={line.cart_id || idx} style={styles.reviewItemCard}>
                    <View style={styles.reviewItemHeader}>
                      <Text style={styles.reviewItemName} numberOfLines={2}>
                        {line.product_name || line.item || 'Product'}
                      </Text>
                      <Text style={styles.reviewItemTotal}>
                        {formatIndianCurrency(line.net_amount)}
                      </Text>
                    </View>

                    {/* Clean item table row */}
                    <View style={styles.reviewItemMetricsTable}>
                      <View style={styles.reviewMetricCol}>
                        <Text style={styles.reviewMetricLabel}>QTY</Text>
                        <Text style={styles.reviewMetricValue}>{line.quantity}</Text>
                      </View>
                      <View style={styles.reviewMetricCol}>
                        <Text style={styles.reviewMetricLabel}>RATE</Text>
                        <Text style={styles.reviewMetricValue}>{formatIndianCurrency(line.price)}</Text>
                      </View>
                      {line.discount > 0 && (
                        <View style={styles.reviewMetricCol}>
                          <Text style={styles.reviewMetricLabel}>DISC</Text>
                          <Text style={[styles.reviewMetricValue, { color: '#0B7A4D' }]}>
                            -{formatIndianCurrency(line.discount)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.reviewMetricCol}>
                        <Text style={styles.reviewMetricLabel}>TAXABLE</Text>
                        <Text style={styles.reviewMetricValue}>{formatIndianCurrency(line.taxable_amount)}</Text>
                      </View>
                    </View>

                    {/* GST breakdown pills */}
                    <View style={styles.reviewGstRow}>
                      <View style={styles.reviewGstTag}>
                        <Text style={styles.reviewGstTagText}>
                          GST {line.product_gst}% · {formatIndianCurrency(line.tax_amount)}
                        </Text>
                      </View>
                      <Text style={styles.reviewGstSplitText}>
                        CGST {halfRate}%: {formatIndianCurrency(cgst)} · SGST {halfRate}%: {formatIndianCurrency(sgst)}
                      </Text>
                    </View>

                    {line.cess_amount > 0 || (line.total_crate || 0) > 0 || (line.total_bottle || 0) > 0 ? (
                      <View style={styles.reviewExtraTagsRow}>
                        {line.cess_amount > 0 && (
                          <Text style={styles.reviewExtraTag}>CESS: {formatIndianCurrency(line.cess_amount)}</Text>
                        )}
                        {(line.total_crate || 0) > 0 && (
                          <Text style={styles.reviewExtraTag}>Crate: {line.total_crate}</Text>
                        )}
                        {(line.total_bottle || 0) > 0 && (
                          <Text style={styles.reviewExtraTag}>Bottle: {line.total_bottle}</Text>
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {/* 2. Totals Breakdown Card */}
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

              {/* Dedicated GST Breakdown Card */}
              {totalsSummary.totalGstAmount > 0 && (
                <View style={styles.gstBreakdownBox}>
                  <View style={styles.gstBreakdownHeader}>
                    <Feather name="percent" size={13} color={Colors.primary} />
                    <Text style={styles.gstBreakdownTitle}>GST Tax Breakdown</Text>
                  </View>
                  <View style={styles.gstBreakdownRow}>
                    <Text style={styles.gstBreakdownLabel}>CGST (Central Tax)</Text>
                    <Text style={styles.gstBreakdownVal}>
                      {formatIndianCurrency(totalsSummary.totalCgstAmount)}
                    </Text>
                  </View>
                  <View style={styles.gstBreakdownRow}>
                    <Text style={styles.gstBreakdownLabel}>SGST (State Tax)</Text>
                    <Text style={styles.gstBreakdownVal}>
                      {formatIndianCurrency(totalsSummary.totalSgstAmount)}
                    </Text>
                  </View>
                  <View style={styles.gstBreakdownDivider} />
                  <View style={styles.gstBreakdownRow}>
                    <Text style={styles.gstBreakdownTotalLabel}>Total GST</Text>
                    <Text style={styles.gstBreakdownTotalVal}>
                      {formatIndianCurrency(totalsSummary.totalGstAmount)}
                    </Text>
                  </View>
                </View>
              )}

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

              {totalsSummary.roundOffDifference !== 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Round Off</Text>
                  <Text style={styles.totalVal}>
                    {totalsSummary.roundOffDifference > 0 ? '+' : ''}
                    {formatIndianCurrency(totalsSummary.roundOffDifference)}
                  </Text>
                </View>
              )}

              {/* Hero Net Payable Card matching dashboard styling */}
              <View style={styles.heroTotalCard}>
                <View style={styles.heroTotalTop}>
                  <Text style={styles.heroTotalLabel}>Total Payable Amount</Text>
                  <View style={styles.heroTotalBadge}>
                    <Text style={styles.heroTotalBadgeText}>{draft.taxPreference}</Text>
                  </View>
                </View>
                <Text style={styles.heroTotalAmount}>
                  {formatIndianCurrency(totalsSummary.roundedPayableAmount)}
                </Text>
                <Text style={styles.heroTotalSub}>
                  Includes all applicable taxes and additional charges
                </Text>
              </View>
            </View>

            {/* 3. Payment Mode & Delivery Mode (Requirement 7 & 8) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment & Delivery</Text>

              {/* Payment Mode Selector Chips */}
              <Text style={styles.fieldLabel}>Payment Mode</Text>
              <View style={styles.modeRow}>
                {(['Cash', 'Credit', 'Online', 'Cheque'] as const).map((mode) => {
                  const isSelected = draft.paymentMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.modeChip, isSelected && styles.modeChipActive]}
                      onPress={() => handlePaymentModeSelect(mode)}
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

              {/* Payment Summary Box with Edit Button (Requirement 7) */}
              <View style={styles.paymentSummaryBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentSummaryTitle}>Payment Details</Text>
                  <Text style={styles.paymentSummaryValue}>{getPaymentSummaryText()}</Text>
                </View>
                {draft.paymentMode !== 'Cash' && (
                  <TouchableOpacity
                    style={styles.paymentEditBtn}
                    onPress={() => setPaymentDetailsOpen(true)}
                  >
                    <Feather name="edit-2" size={13} color={Colors.primary} />
                    <Text style={styles.paymentEditText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Delivery Mode Selector */}
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Delivery Mode</Text>
              <View style={styles.modeRow}>
                {(['Manual', 'Courier'] as const).map((dm) => {
                  const isSelected = draft.deliveryMode === dm;
                  return (
                    <TouchableOpacity
                      key={dm}
                      style={[styles.modeChip, isSelected && styles.modeChipActive]}
                      onPress={() => {
                        onUpdateDraft({ deliveryMode: dm });
                        if (dm === 'Courier' && (!draft.docketNo || !draft.courierAgency)) {
                          setRemarkOpen(true);
                        }
                      }}
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

              {draft.deliveryMode === 'Courier' && (
                <View style={styles.courierNoticeBox}>
                  <Feather name="truck" size={14} color={Colors.primary} />
                  <Text style={styles.courierNoticeText}>
                    {draft.courierAgency && draft.docketNo
                      ? `${draft.courierAgency} · Docket #${draft.docketNo}`
                      : 'Courier info pending. Tap Delivery Info below to enter.'}
                  </Text>
                </View>
              )}
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
                  <Text style={styles.actionTileTitle}>Delivery info & remark</Text>
                  <Text style={styles.actionTileSubtitle} numberOfLines={1}>
                    {draft.courierAgency
                      ? `${draft.courierAgency} (${draft.docketNo || 'No docket'})`
                      : draft.remark || draft.shippingAddress || 'Tap to add shipping details'}
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
                  <Text style={styles.actionTileTitle}>Authorized signature</Text>
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
                  <Text style={styles.actionTileTitle}>Terms & conditions</Text>
                  <Text style={styles.actionTileSubtitle}>
                    For {draft.party?.partyName || 'Customer'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Sticky Bottom Bar with Double-Tap Protection */}
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.stickyPayableLabel}>Net Payable</Text>
              <Text style={styles.stickyPayableVal}>
                {formatIndianCurrency(totalsSummary.roundedPayableAmount)}
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
                  <Text style={styles.submitInvoiceText}>Submit invoice</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Payment Details Bottom Sheet */}
      <PaymentDetailsSheet
        visible={paymentDetailsOpen}
        onClose={() => setPaymentDetailsOpen(false)}
        mode={draft.paymentMode}
        party={draft.party}
        creditOverdues={draft.creditAmount}
        advanceAmt={draft.advanceAmount}
        netAmount={totalsSummary.roundedPayableAmount}
        initialData={{
          paymentType: draft.paymentType,
          bankName: draft.bankName,
          txnNo: draft.chequeTxnNo,
          chequeDate: draft.chequeDate,
          depositBank: draft.depositBank,
          chequeAmt: draft.chequeAmt,
          creditDays: draft.creditDays,
        }}
        onSave={handleSavePaymentDetails}
      />

      {/* Subsheets */}
      <AdditionalChargesSheet
        visible={chargesOpen}
        onClose={() => setChargesOpen(false)}
        charges={draft.charges}
        onSave={(c) => onUpdateDraft({ charges: c })}
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
        partyName={draft.party?.partyName || 'Customer'}
      />

      {/* Success Modal */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Feather name="check" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Invoice Generated!</Text>
            <Text style={styles.successSubtitle}>
              Invoice has been successfully submitted to server.
            </Text>

            <View style={styles.successInfoBox}>
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Customer</Text>
                <Text style={styles.successInfoVal}>{createdInvoiceInfo?.partyName}</Text>
              </View>
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Invoice No</Text>
                <Text style={styles.successInfoVal}>{createdInvoiceInfo?.invoiceNo}</Text>
              </View>
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Amount</Text>
                <Text style={[styles.successInfoVal, { color: Colors.primary, fontWeight: '800' }]}>
                  {formatIndianCurrency(createdInvoiceInfo?.amount || 0)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                onInvoiceCreated();
                onClose();
              }}
            >
              <Text style={styles.successDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '94%',
    ...Shadows.card,
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FDECEC',
    borderRadius: 8,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B01E25',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  reviewItemCard: {
    backgroundColor: '#F8F9FE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECECF8',
  },
  reviewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  reviewItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewItemTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  reviewItemMetricsTable: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECECF8',
    justifyContent: 'space-between',
  },
  reviewMetricCol: {
    alignItems: 'center',
    flex: 1,
  },
  reviewMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  reviewMetricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  reviewGstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewGstTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewGstTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  reviewGstSplitText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  reviewExtraTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  reviewExtraTag: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gstBreakdownBox: {
    backgroundColor: '#F8F9FE',
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  gstBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  gstBreakdownTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gstBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  gstBreakdownLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  gstBreakdownVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  gstBreakdownDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  gstBreakdownTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  gstBreakdownTotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  heroTotalCard: {
    backgroundColor: '#2A2470',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  heroTotalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CFCCF7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTotalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroTotalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTotalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroTotalSub: {
    fontSize: 11,
    color: '#AEA9ED',
  },
  addChargesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  addChargesText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  totalVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  modeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  paymentSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  paymentSummaryTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  paymentSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  paymentEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  paymentEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  courierNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  courierNoticeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  actionTilesGroup: {
    gap: 10,
    marginBottom: 20,
  },
  actionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    ...Shadows.card,
  },
  actionTileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  actionTileSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  stickyPayableLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  stickyPayableVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  submitInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    minWidth: 160,
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitInvoiceText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Shadows.card,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  successSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  successInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginVertical: 18,
    gap: 8,
  },
  successInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successInfoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  successInfoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  successDoneBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  successDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
