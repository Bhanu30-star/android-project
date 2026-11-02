import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { formatReadable, formatYmd } from '@/utils/dateUtils';
import { PartySearchSheet } from '@/components/invoice/PartySearchSheet';
import { CalendarPickerModal } from '@/components/common/CalendarPickerModal';
import { RetailerParty } from '@/api/invoiceService';
import {
  SaleReturnCartData,
  SaleReturnCartItem,
  fetchSaleReturnCartApi,
  clearSaleReturnCartApi,
  submitReturnStockCreditNoteApi,
  submitDirectCreditNoteApi,
} from '@/api/saleReturn';
import { AddSaleReturnItemsSheet } from './AddSaleReturnItemsSheet';

interface SaleReturnScreenProps {
  onBack?: () => void;
}

const FY_OPTIONS = [
  '2026-2027',
  '2025-2026',
  '2024-2025',
  '2023-2024',
];

const CREDIT_NOTE_TYPES = [
  'Return Stock',
  'Direct Credit Note',
];

const REVERSE_CHARGE_OPTIONS: Array<'No' | 'Yes'> = ['No', 'Yes'];

export const SaleReturnScreen: React.FC<SaleReturnScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();

  // Selected party
  const [selectedParty, setSelectedParty] = useState<RetailerParty | null>(null);
  const [partySheetVisible, setPartySheetVisible] = useState(false);

  // Form Fields
  const [creditNoteNo, setCreditNoteNo] = useState('');
  const [hiddenBillNo, setHiddenBillNo] = useState('');
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [creditNoteType, setCreditNoteType] = useState('Return Stock');
  const [reverseCharges, setReverseCharges] = useState<'No' | 'Yes'>('No');

  // Dates
  const todayStr = formatYmd(new Date());
  const [pickDate, setPickDate] = useState(todayStr);
  const [pickDateVisible, setPickDateVisible] = useState(false);

  const [origBillNo, setOrigBillNo] = useState('');
  const [origBillDate, setOrigBillDate] = useState(todayStr);
  const [origBillDateVisible, setOrigBillDateVisible] = useState(false);

  const [remark, setRemark] = useState('');

  // Cart & Pricing
  const [cartData, setCartData] = useState<SaleReturnCartData>({ items: [] });
  const [cartLoading, setCartLoading] = useState(false);
  const [addItemSheetOpen, setAddItemSheetOpen] = useState(false);

  // Summary
  const [directTotalAmount, setDirectTotalAmount] = useState('0');
  const [tcsApplicable, setTcsApplicable] = useState(false);
  const [tcsAmount, setTcsAmount] = useState('0');

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection Modals
  const [activePicker, setActivePicker] = useState<'fy' | 'type' | 'reverse' | null>(null);

  const isDirect = creditNoteType === 'Direct Credit Note';

  // Load Cart Data
  const loadCart = useCallback(async () => {
    if (!selectedParty || isDirect) return;
    try {
      setCartLoading(true);
      const data = await fetchSaleReturnCartApi({
        reverse_charge: reverseCharges,
        party_id: selectedParty.partyId,
      });
      setCartData(data);
      if (data.credit_note_no) {
        setCreditNoteNo(data.credit_note_no);
        setHiddenBillNo(data.credit_note_no);
        if (!origBillNo) {
          setOrigBillNo(data.credit_note_no);
        }
      }
    } catch (err: any) {
      console.warn('Error loading return cart:', err?.message);
    } finally {
      setCartLoading(false);
    }
  }, [selectedParty, reverseCharges, isDirect]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Handle party select
  const handleSelectParty = (party: RetailerParty) => {
    setSelectedParty(party);
    setPartySheetVisible(false);
  };

  // Calculations
  const calculatedTotal = useMemo(() => {
    if (isDirect) {
      return parseFloat(directTotalAmount) || 0;
    }
    const items = cartData.items || [];
    const sum = items.reduce((acc, it) => {
      const line = Number(it.total_amount ?? it.net_amount ?? 0);
      return acc + (isNaN(line) ? 0 : line);
    }, 0);
    return sum || cartData.totals?.item_amount || 0;
  }, [isDirect, directTotalAmount, cartData]);

  const totalQty = useMemo(() => {
    if (isDirect) return 1;
    const items = cartData.items || [];
    return items.reduce((acc, it) => acc + (it.quantity ?? it.actual_qty ?? 1), 0);
  }, [isDirect, cartData]);

  const netAmount = useMemo(() => {
    const tcs = tcsApplicable ? parseFloat(tcsAmount) || 0 : 0;
    const base = isDirect ? calculatedTotal : (cartData.final_amount ?? calculatedTotal);
    return Number((base + tcs).toFixed(2));
  }, [isDirect, calculatedTotal, cartData.final_amount, tcsApplicable, tcsAmount]);

  // Delete single cart item
  const handleDeleteCartItem = async (cartId: number) => {
    Alert.alert('Remove Item', 'Do you want to remove this item from the return cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearSaleReturnCartApi(cartId);
            loadCart();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Could not delete item.');
          }
        },
      },
    ]);
  };

  // Clear entire cart
  const handleClearCart = () => {
    if (!cartData.items || cartData.items.length === 0) return;
    Alert.alert('Clear Cart', 'Are you sure you want to remove all items from this return cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearSaleReturnCartApi(null);
            loadCart();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Could not clear cart.');
          }
        },
      },
    ]);
  };

  // Submit Credit Note
  const handleSubmit = async () => {
    if (!selectedParty) {
      Alert.alert('Validation Error', 'Please select a Party.');
      return;
    }
    if (!origBillNo.trim()) {
      Alert.alert('Validation Error', 'Original Bill No. is required.');
      return;
    }
    if (!origBillDate) {
      Alert.alert('Validation Error', 'Original Bill Date is required.');
      return;
    }

    if (!isDirect && (!cartData.items || cartData.items.length === 0)) {
      Alert.alert('Validation Error', 'Please add at least one item to the return cart.');
      return;
    }

    if (isDirect && calculatedTotal <= 0) {
      Alert.alert('Validation Error', 'Total Amount must be greater than 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isDirect) {
        const payload = {
          partyId: selectedParty.partyId,
          billNo: creditNoteNo || origBillNo,
          hiddenbillNo: hiddenBillNo || creditNoteNo || origBillNo,
          billDate: pickDate,
          orgBillNo: origBillNo,
          orgBillDate: origBillDate,
          billType: 'Inclusive',
          totalAmount: calculatedTotal,
          netAmount: netAmount,
          tcsAmount: tcsApplicable ? parseFloat(tcsAmount) || 0 : 0,
          remark: remark.trim(),
        };
        const res = await submitDirectCreditNoteApi(payload);
        Alert.alert('Success', res?.message || 'Direct Credit Note generated successfully!', [
          { text: 'OK', onPress: () => (onBack ? onBack() : router.back()) },
        ]);
      } else {
        const payload = {
          partyId: selectedParty.partyId,
          billNo: creditNoteNo || origBillNo,
          hiddenbillNo: hiddenBillNo || creditNoteNo || origBillNo,
          billDate: pickDate,
          orgBillNo: origBillNo,
          orgBillDate: origBillDate,
          billType: cartData.bill_type_notification || cartData.bill_type || 'Inclusive',
          netAmount: netAmount,
          tcsAmount: tcsApplicable ? parseFloat(tcsAmount) || 0 : 0,
          remark: remark.trim(),
        };
        const res = await submitReturnStockCreditNoteApi(payload);
        Alert.alert('Success', res?.message || 'Sale Return Credit Note submitted successfully!', [
          { text: 'OK', onPress: () => (onBack ? onBack() : router.back()) },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message || 'Could not submit credit note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (onBack ? onBack() : router.back())}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#0E204E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sale Return</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. FORM CARD */}
          <View style={styles.card}>
            <View style={styles.rowTwoCols}>
              {/* Select Party */}
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>
                  Select Party <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.pickerBox}
                  onPress={() => setPartySheetVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerText,
                      !selectedParty && styles.pickerPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedParty ? selectedParty.partyName : 'Cash'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              {/* Credit Note No. */}
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>
                  Credit Note No. <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.inputBox}
                  value={creditNoteNo}
                  onChangeText={setCreditNoteNo}
                  placeholder="CN0000X"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              {/* Financial Year */}
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>
                  Financial Year <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.pickerBox}
                  onPress={() => setActivePicker('fy')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerText} numberOfLines={1}>
                    {financialYear}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              {/* Credit Note type */}
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>
                  Credit Note type <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.pickerBox}
                  onPress={() => setActivePicker('type')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerText} numberOfLines={1}>
                    {creditNoteType}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#5A6B87" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rowTwoCols}>
              {/* Reverse Charges */}
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>
                  Reverse Charges <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.pickerBox}
                  onPress={() => setActivePicker('reverse')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerText} numberOfLines={1}>
                    {reverseCharges}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              {/* Pick Date */}
              <View style={styles.fieldCol}>
                <Text style={styles.fieldLabel}>
                  Pick Date <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.pickerBox}
                  onPress={() => setPickDateVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerText} numberOfLines={1}>
                    {formatReadable(pickDate)}
                  </Text>
                  <Feather name="calendar" size={16} color="#5A6B87" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 2. CART CARD (Shown only if Return Stock) */}
          {!isDirect ? (
            <View style={styles.card}>
              <View style={styles.cartCardHeader}>
                <Text style={styles.cartSectionTitle}>
                  CART • {cartData.items?.length || 0} ITEM
                  {(cartData.items?.length || 0) === 1 ? '' : 'S'}
                </Text>
                {(cartData.items?.length || 0) > 0 && (
                  <TouchableOpacity
                    style={styles.clearCartBtn}
                    onPress={handleClearCart}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={14} color="#DC2626" />
                    <Text style={styles.clearCartText}>Clear Cart</Text>
                  </TouchableOpacity>
                )}
              </View>

              {cartLoading ? (
                <View style={styles.cartLoadingContainer}>
                  <ActivityIndicator size="small" color="#0047AB" />
                  <Text style={styles.cartLoadingText}>Loading cart...</Text>
                </View>
              ) : !cartData.items || cartData.items.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <View style={styles.emptyCartIconOuter}>
                    <Feather name="shopping-bag" size={24} color="#5A6B87" />
                  </View>
                  <Text style={styles.emptyCartText}>
                    Cart empty — tap add item below
                  </Text>
                </View>
              ) : (
                <View style={styles.cartList}>
                  {cartData.items.map((item: SaleReturnCartItem, idx: number) => {
                    const priceVal = parseFloat(String(item.price)) || 0;
                    const qtyVal = item.quantity ?? item.actual_qty ?? 1;
                    const taxVal = item.gst_percent ?? 0;
                    const totalVal =
                      Number(item.total_amount ?? item.net_amount) || priceVal * qtyVal;

                    return (
                      <View key={item.cart_detail_id || idx} style={styles.cartItemRow}>
                        <View style={styles.cartItemHeader}>
                          <Text style={styles.cartItemTitle}>{item.product_name}</Text>
                          <TouchableOpacity
                            onPress={() => handleDeleteCartItem(item.cart_detail_id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Feather name="trash-2" size={16} color="#DC2626" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.cartItemMetrics}>
                          <View style={styles.metricCol}>
                            <Text style={styles.metricLabel}>Price</Text>
                            <Text style={styles.metricValue}>{priceVal.toFixed(1)}</Text>
                          </View>
                          <View style={styles.metricCol}>
                            <Text style={styles.metricLabel}>Qty</Text>
                            <Text style={styles.metricValue}>{qtyVal}</Text>
                          </View>
                          <View style={styles.metricCol}>
                            <Text style={styles.metricLabel}>Tax</Text>
                            <Text style={styles.metricValue}>{taxVal}</Text>
                          </View>
                          <View style={[styles.metricCol, { alignItems: 'flex-end' }]}>
                            <Text style={styles.metricLabel}>Total</Text>
                            <Text style={styles.metricTotalValue}>₹{totalVal.toFixed(0)}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* Total Line inside cart */}
                  <View style={styles.cartSummaryRow}>
                    <Text style={styles.cartSummaryTotalLabel}>Total</Text>
                    <View style={styles.cartSummaryValues}>
                      <Text style={styles.cartSummaryQty}>Qty: {totalQty}</Text>
                      <Text style={styles.cartSummaryAmount}>
                        ₹{calculatedTotal.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Add Item Dashed Button */}
              <TouchableOpacity
                style={styles.addItemDashedBtn}
                onPress={() => {
                  if (!selectedParty) {
                    Alert.alert('Select Party', 'Please select a Party before adding items.');
                    return;
                  }
                  setAddItemSheetOpen(true);
                }}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={16} color="#0047AB" />
                <Text style={styles.addItemDashedText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Direct Credit Note Total Input */
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>
                Credit Note Amount (₹) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={[styles.inputBox, { height: 46, fontSize: 16 }]}
                keyboardType="numeric"
                value={directTotalAmount}
                onChangeText={setDirectTotalAmount}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}

          {/* 3. TERMS & CONDITIONS CARD */}
          <View style={styles.card}>
            <Text style={styles.termsTitle}>TERMS & CONDITIONS</Text>
            <View style={styles.termsList}>
              <Text style={styles.termsItem}>
                1. Credit Note is valid for the financial year in which it is issued, as per GST law.
              </Text>
              <Text style={styles.termsItem}>
                2. Credit Note is issued only for adjustment against invoices due to returns or price adjustments.
              </Text>
              <Text style={styles.termsItem}>
                3. GST/Taxes (if applicable) are as per law, and ITC should be adjusted accordingly.
              </Text>
            </View>
          </View>

          {/* 4. SUMMARY CARD */}
          <View style={styles.card}>
            <Text style={styles.sectionHeaderTitle}>SUMMARY</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount</Text>
              <View style={styles.summaryValContainer}>
                <Text style={styles.summaryValText}>{calculatedTotal.toFixed(1)}</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <TouchableOpacity
                style={styles.tcsCheckboxRow}
                onPress={() => setTcsApplicable(!tcsApplicable)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxSmall, tcsApplicable && styles.checkboxSmallActive]}>
                  {tcsApplicable && <Feather name="check" size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.summaryLabel}>TCS</Text>
              </TouchableOpacity>

              <TextInput
                style={[styles.tcsInputBox, !tcsApplicable && styles.tcsInputDisabled]}
                keyboardType="numeric"
                editable={tcsApplicable}
                value={tcsAmount}
                onChangeText={setTcsAmount}
                placeholder="0"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Net Amount</Text>
              <View style={styles.summaryValContainer}>
                <Text style={styles.summaryValText}>{netAmount.toFixed(1)}</Text>
              </View>
            </View>
          </View>

          {/* 5. BILL INFO CARD */}
          <View style={styles.card}>
            <Text style={styles.sectionHeaderTitle}>BILL INFO</Text>

            <View style={styles.billInfoRow}>
              <Text style={styles.billInfoLabel}>
                Original Bill No. <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.billInfoInput}
                value={origBillNo}
                onChangeText={setOrigBillNo}
                placeholder="Enter bill no."
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.billInfoRow}>
              <Text style={styles.billInfoLabel}>
                Original Bill Date <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.billInfoDateBox}
                onPress={() => setOrigBillDateVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.billInfoDateText} numberOfLines={1}>
                  {formatReadable(origBillDate)}
                </Text>
                <Feather name="calendar" size={16} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            <View style={styles.billInfoRow}>
              <Text style={styles.billInfoLabel}>Remark</Text>
              <TextInput
                style={styles.billInfoInput}
                value={remark}
                onChangeText={setRemark}
                placeholder="Remarks (optional)"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Submit Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Party Search Sheet */}
      <PartySearchSheet
        visible={partySheetVisible}
        onClose={() => setPartySheetVisible(false)}
        onSelect={handleSelectParty}
        selectedPartyId={selectedParty?.partyId}
      />

      {/* Pick Date Calendar Modal */}
      <CalendarPickerModal
        visible={pickDateVisible}
        onClose={() => setPickDateVisible(false)}
        selectedDate={pickDate}
        onSelectDate={(d) => {
          setPickDate(d.split('T')[0]);
          setPickDateVisible(false);
        }}
        title="Select Pick Date"
      />

      {/* Original Bill Date Calendar Modal */}
      <CalendarPickerModal
        visible={origBillDateVisible}
        onClose={() => setOrigBillDateVisible(false)}
        selectedDate={origBillDate}
        onSelectDate={(d) => {
          setOrigBillDate(d.split('T')[0]);
          setOrigBillDateVisible(false);
        }}
        title="Select Original Bill Date"
      />

      {/* Add Items Sheet */}
      {selectedParty && (
        <AddSaleReturnItemsSheet
          visible={addItemSheetOpen}
          onClose={() => setAddItemSheetOpen(false)}
          partyId={selectedParty.partyId}
          financialYear={financialYear}
          cartBillType={cartData.bill_type || 'Inclusive'}
          onCartUpdated={loadCart}
        />
      )}

      {/* Picker Modal for Dropdowns */}
      <Modal
        visible={Boolean(activePicker)}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
        >
          <View style={styles.pickerModalCard}>
            <Text style={styles.pickerModalTitle}>
              {activePicker === 'fy'
                ? 'Select Financial Year'
                : activePicker === 'type'
                ? 'Select Credit Note Type'
                : 'Reverse Charges'}
            </Text>

            <ScrollView style={{ maxHeight: 240 }}>
              {activePicker === 'fy' &&
                FY_OPTIONS.map((fy) => (
                  <TouchableOpacity
                    key={fy}
                    style={[
                      styles.pickerOptionRow,
                      financialYear === fy && styles.pickerOptionActive,
                    ]}
                    onPress={() => {
                      setFinancialYear(fy);
                      setActivePicker(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        financialYear === fy && styles.pickerOptionTextActive,
                      ]}
                    >
                      {fy}
                    </Text>
                    {financialYear === fy && (
                      <Feather name="check" size={16} color="#0047AB" />
                    )}
                  </TouchableOpacity>
                ))}

              {activePicker === 'type' &&
                CREDIT_NOTE_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.pickerOptionRow,
                      creditNoteType === t && styles.pickerOptionActive,
                    ]}
                    onPress={() => {
                      setCreditNoteType(t);
                      setActivePicker(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        creditNoteType === t && styles.pickerOptionTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                    {creditNoteType === t && (
                      <Feather name="check" size={16} color="#0047AB" />
                    )}
                  </TouchableOpacity>
                ))}

              {activePicker === 'reverse' &&
                REVERSE_CHARGE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.pickerOptionRow,
                      reverseCharges === opt && styles.pickerOptionActive,
                    ]}
                    onPress={() => {
                      setReverseCharges(opt);
                      setActivePicker(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        reverseCharges === opt && styles.pickerOptionTextActive,
                      ]}
                    >
                      {opt}
                    </Text>
                    {reverseCharges === opt && (
                      <Feather name="check" size={16} color="#0047AB" />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E204E',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#DC2626',
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
  },
  pickerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
    flex: 1,
    marginRight: 6,
  },
  pickerPlaceholder: {
    color: '#94A3B8',
  },
  inputBox: {
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0E204E',
  },
  cartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
    letterSpacing: 0.5,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  cartLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  cartLoadingText: {
    fontSize: 13,
    color: '#5A6B87',
  },
  emptyCartBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyCartIconOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 13,
    color: '#5A6B87',
  },
  cartList: {
    gap: 10,
  },
  cartItemRow: {
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 12,
    gap: 8,
  },
  cartItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  cartItemMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#5A6B87',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
    marginTop: 2,
  },
  metricTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
    marginTop: 2,
  },
  cartSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  cartSummaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  cartSummaryValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartSummaryQty: {
    fontSize: 13,
    color: '#5A6B87',
  },
  cartSummaryAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0047AB',
  },
  addItemDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0047AB',
    borderRadius: 12,
    height: 44,
    gap: 8,
    marginTop: 4,
  },
  addItemDashedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0047AB',
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
    letterSpacing: 0.5,
  },
  termsList: {
    gap: 6,
  },
  termsItem: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5A6B87',
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  summaryValContainer: {
    width: 120,
    height: 40,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  summaryValText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  tcsCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxSmall: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSmallActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  tcsInputBox: {
    width: 120,
    height: 40,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0E204E',
  },
  tcsInputDisabled: {
    opacity: 0.4,
  },
  billInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  billInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
    flex: 1,
  },
  billInfoInput: {
    width: 140,
    height: 40,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0E204E',
  },
  billInfoDateBox: {
    width: 140,
    height: 40,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  billInfoDateText: {
    fontSize: 12,
    color: '#0E204E',
    flex: 1,
    marginRight: 4,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
    paddingHorizontal: 16,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  submitButton: {
    backgroundColor: '#0047AB',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 20,
    elevation: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 14,
  },
  pickerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#5A6B87',
  },
  pickerOptionTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
});
