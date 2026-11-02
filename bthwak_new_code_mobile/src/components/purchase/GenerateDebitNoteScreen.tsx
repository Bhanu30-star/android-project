import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  PurchasePartyItem,
  fetchPurchasePartyListApi,
} from '@/api/purchase';
import {
  DebitNoteCartItem,
  DebitNoteCartResponse,
  fetchDebitNoteCartApi,
  clearDebitNoteCartApi,
  submitDebitNoteApi,
} from '@/api/debitNote';
import { AddDebitNoteItemsModal } from './AddDebitNoteItemsModal';
import { useAuth } from '@/hooks/useAuth';

interface GenerateDebitNoteScreenProps {
  onBack?: () => void;
}

export const GenerateDebitNoteScreen: React.FC<GenerateDebitNoteScreenProps> = ({ onBack }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Parties
  const [parties, setParties] = useState<PurchasePartyItem[]>([]);
  const [selectedParty, setSelectedParty] = useState<PurchasePartyItem | null>(null);
  const [isPartyModalVisible, setIsPartyModalVisible] = useState(false);
  const [partySearch, setPartySearch] = useState('');
  const [isLoadingParties, setIsLoadingParties] = useState(false);

  // Financial Year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0 = Jan
  const getCurrentFY = () => {
    if (currentMonth >= 3) {
      return `${currentYear}-${currentYear + 1}`;
    }
    return `${currentYear - 1}-${currentYear}`;
  };

  const [financialYear, setFinancialYear] = useState(getCurrentFY());
  const [isFyModalVisible, setIsFyModalVisible] = useState(false);
  const fyOptions = useMemo(() => {
    return [
      `${currentYear - 1}-${currentYear}`,
      `${currentYear}-${currentYear + 1}`,
      `${currentYear + 1}-${currentYear + 2}`,
    ];
  }, [currentYear]);

  // Debit Note Type: "Return Stock" | "Direct Debit Note"
  const [debitNoteType, setDebitNoteType] = useState<'Return Stock' | 'Direct Debit Note'>('Return Stock');
  const [isTypeModalVisible, setIsTypeModalVisible] = useState(false);
  const isDirectDebitNote = debitNoteType === 'Direct Debit Note';

  // Bill & Dates
  const [billNo, setBillNo] = useState('');
  const [hiddenBillNo, setHiddenBillNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isInvoiceDateModalVisible, setIsInvoiceDateModalVisible] = useState(false);

  // Reference Details
  const [originalBillNo, setOriginalBillNo] = useState('');
  const [debitNoteDate, setDebitNoteDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isDebitDateModalVisible, setIsDebitDateModalVisible] = useState(false);
  const [remark, setRemark] = useState('');

  // Cart State
  const [cart, setCart] = useState<DebitNoteCartResponse>({ items: [] });
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [isAddItemsModalVisible, setIsAddItemsModalVisible] = useState(false);

  // Summary State
  const [totalAmount, setTotalAmount] = useState(0);
  const [tcsApplicable, setTcsApplicable] = useState(false);
  const [tcsAmount, setTcsAmount] = useState(0);
  const [netAmount, setNetAmount] = useState(0);

  // Submitting ref guard
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load parties on mount
  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    try {
      setIsLoadingParties(true);
      const list = await fetchPurchasePartyListApi();
      setParties(list || []);

      // Default to cash party if available
      const cash = (list || []).find((p: PurchasePartyItem) => p.partyName?.toLowerCase() === 'cash');
      if (cash && !selectedParty) {
        setSelectedParty(cash);
      }
    } catch (err: any) {
      console.warn('Failed to load purchase parties', err);
    } finally {
      setIsLoadingParties(false);
    }
  };

  // Load Cart when not Direct Debit Note
  const loadCart = async () => {
    if (isDirectDebitNote) return;
    try {
      setIsLoadingCart(true);
      const res = await fetchDebitNoteCartApi();
      setCart(res);

      if (res.bill_no) {
        setBillNo(res.bill_no);
        setOriginalBillNo(res.bill_no);
        setHiddenBillNo(res.bill_no);
      }
      if (res.bill_date) {
        setInvoiceDate(res.bill_date.slice(0, 10));
        setDebitNoteDate(res.bill_date.slice(0, 10));
      }

      const tot = Number(res.total_notification || 0);
      setTotalAmount(tot);
    } catch (err: any) {
      console.warn('Failed to load debit note cart', err);
    } finally {
      setIsLoadingCart(false);
    }
  };

  useEffect(() => {
    if (!isDirectDebitNote) {
      loadCart();
    } else {
      setCart({ items: [] });
      setTotalAmount(0);
      setTcsApplicable(false);
      setTcsAmount(0);
    }
  }, [isDirectDebitNote]);

  // Recalculate Net Amount
  useEffect(() => {
    let net = totalAmount;
    if (tcsApplicable) {
      const calculatedTcs = Number((totalAmount * 0.01).toFixed(2));
      setTcsAmount(calculatedTcs);
      net = net + calculatedTcs;
    } else {
      setTcsAmount(0);
    }
    setNetAmount(net);
  }, [totalAmount, tcsApplicable]);

  // Clear Cart
  const handleClearCart = async () => {
    if (cart.items.length === 0) return;
    Alert.alert('Clear Cart', 'Are you sure you want to remove all items from the cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearDebitNoteCartApi(null);
            setTotalAmount(0);
            setNetAmount(0);
            setTcsApplicable(false);
            setTcsAmount(0);
            loadCart();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to clear cart.');
          }
        },
      },
    ]);
  };

  // Delete Single Cart Item
  const handleDeleteCartItem = async (cartId: number, productName: string) => {
    Alert.alert('Remove Item', `Remove "${productName}" from the cart?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearDebitNoteCartApi(cartId);
            loadCart();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete item.');
          }
        },
      },
    ]);
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (isSubmittingRef.current || isSubmitting) return;

    if (!selectedParty) {
      Alert.alert('Party Required', 'Please select a Party Name first.');
      return;
    }

    if (!billNo.trim()) {
      Alert.alert('Bill No Required', 'Debit Note Bill No. is required.');
      return;
    }

    if (!originalBillNo.trim()) {
      Alert.alert('Original Bill No Required', 'Original Bill No is required.');
      return;
    }

    if (isDirectDebitNote) {
      if (totalAmount <= 0) {
        Alert.alert('Amount Required', 'Total Amount must be greater than 0.');
        return;
      }
    } else {
      if (cart.items.length === 0) {
        Alert.alert('Cart Empty', 'Please add items to the cart before submitting.');
        return;
      }
    }

    const common = {
      party_id: selectedParty.purchasePartyId,
      tcs_applicable: tcsApplicable ? 'Yes' : 'No',
      tcs_amount: tcsApplicable ? tcsAmount : 0,
      total_amt: totalAmount,
      total_net_amt: netAmount,
      remark: remark || '',
    };

    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      if (isDirectDebitNote) {
        await submitDebitNoteApi({
          api: 'direct',
          data: {
            ...common,
            debit_note_bill_no: billNo,
            hidden_debit_note_bill_no: hiddenBillNo || billNo,
            debit_note_bill_date: invoiceDate,
            org_bill_no: originalBillNo,
            org_bill_date: debitNoteDate,
            bill_type: 'Inclusive',
          },
        });
      } else {
        await submitDebitNoteApi({
          api: 'return',
          data: {
            ...common,
            party_place_of_supply: selectedParty.placeOfSupply || '',
            distributor_place_of_supply: (user as any)?.place_of_supply || '',
            bill_no: billNo,
            hidden_bill_no: hiddenBillNo || billNo,
            bill_date: cart.bill_date || invoiceDate,
            org_bill_no: originalBillNo,
            org_bill_date: debitNoteDate,
            bill_type: cart.bill_type_notification || 'Inclusive',
            distributor_ser_config: cart.serialno_configuration || '',
            doctorapp_typeval: 'No',
          },
        });
      }

      Alert.alert('Success', 'Debit Note generated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (onBack) {
              onBack();
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/dashboard');
            }
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to generate Debit Note.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Filtered parties for search
  const filteredParties = useMemo(() => {
    if (!partySearch.trim()) return parties;
    const q = partySearch.trim().toLowerCase();
    return parties.filter(
      (p) =>
        p.partyName?.toLowerCase().includes(q) ||
        p.partyPhone?.toLowerCase().includes(q)
    );
  }, [parties, partySearch]);

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color="#0E204E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Debit Note</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* CARD 1: Basic Information */}
        <View style={styles.card}>
          {/* Party Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Party Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setIsPartyModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dropdownBtnText,
                  !selectedParty && styles.dropdownPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedParty ? selectedParty.partyName : 'No Party Selected'}
              </Text>
              <Feather name="chevron-down" size={18} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Row: Debit Note Bill No & Invoice Date */}
          <View style={styles.rowTwoCols}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>
                Debit Note Bill No. <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.standardInput}
                placeholder="Bill No"
                placeholderTextColor="#8E9CAE"
                value={billNo}
                onChangeText={setBillNo}
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.fieldLabel}>
                Invoice Date <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setIsInvoiceDateModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.datePickerText}>{invoiceDate}</Text>
                <Feather name="calendar" size={17} color="#0047AB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row: Financial Year & Debit Note Type */}
          <View style={styles.rowTwoCols}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>
                Financial Year <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setIsFyModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownBtnText}>{financialYear}</Text>
                <Feather name="chevron-down" size={17} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            <View style={styles.col}>
              <Text style={styles.fieldLabel}>
                Debit Note Type <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setIsTypeModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownBtnText} numberOfLines={1}>
                  {debitNoteType}
                </Text>
                <Feather name="chevron-down" size={17} color="#5A6B87" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* CARD 2: Cart & Items */}
        {!isDirectDebitNote && (
          <View style={styles.card}>
            {/* Cart Header */}
            <View style={styles.cartCardHeader}>
              <Text style={styles.cartCardTitle}>
                CART · {cart.items.length} {cart.items.length === 1 ? 'ITEM' : 'ITEMS'}
              </Text>
              {cart.items.length > 0 && (
                <TouchableOpacity
                  style={styles.clearCartBtn}
                  onPress={handleClearCart}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Feather name="trash-2" size={14} color="#DC2626" />
                  <Text style={styles.clearCartText}>Clear Cart</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Cart Content */}
            {isLoadingCart ? (
              <View style={styles.cartLoadingBox}>
                <ActivityIndicator size="small" color="#0047AB" />
                <Text style={styles.cartLoadingText}>Loading cart items...</Text>
              </View>
            ) : cart.items.length === 0 ? (
              <View style={styles.cartEmptyBox}>
                <View style={styles.cartEmptyIconCircle}>
                  <Feather name="shopping-bag" size={26} color="#0047AB" />
                </View>
                <Text style={styles.cartEmptyTitle}>
                  Cart empty — tap add item below
                </Text>
              </View>
            ) : (
              <View style={styles.cartItemsList}>
                {cart.items.map((item, idx) => (
                  <View key={item.cart_id || idx} style={styles.cartItemRow}>
                    <View style={styles.cartItemNumBadge}>
                      <Text style={styles.cartItemNumText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {item.product_name}
                      </Text>
                      <View style={styles.cartItemMetaRow}>
                        <Text style={styles.cartItemMetaText}>
                          Qty: {item.quantity} × ₹{item.price}
                        </Text>
                        {item.net_amount ? (
                          <Text style={styles.cartItemTotalText}>
                            ₹{Number(item.net_amount).toFixed(2)}
                          </Text>
                        ) : null}
                      </View>
                      {item.imei_list && item.imei_list.length > 0 && (
                        <Text style={styles.cartItemImeiText} numberOfLines={1}>
                          IMEI:{' '}
                          {item.imei_list
                            .map((im) => (typeof im === 'string' ? im : im.imei_no))
                            .join(', ')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.cartItemDeleteBtn}
                      onPress={() => handleDeleteCartItem(item.cart_id, item.product_name)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="trash-2" size={17} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* BUTTON: + Add Item (Dashed Border) */}
        {!isDirectDebitNote && (
          <TouchableOpacity
            style={styles.addItemDashedBtn}
            onPress={() => {
              if (!selectedParty) {
                Alert.alert('Select Party', 'Please select a Party Name first.');
                return;
              }
              setIsAddItemsModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={18} color="#0047AB" />
            <Text style={styles.addItemDashedText}>Add Item</Text>
          </TouchableOpacity>
        )}

        {/* CARD 3: Terms & Conditions */}
        <View style={styles.card}>
          <Text style={styles.termsHeading}>TERMS & CONDITIONS</Text>
          <View style={styles.termsList}>
            <View style={styles.termsItemRow}>
              <Text style={styles.termsBullet}>1.</Text>
              <Text style={styles.termsText}>
                Debit Note is valid for the financial year in which it is issued, as per GST law.
              </Text>
            </View>
            <View style={styles.termsItemRow}>
              <Text style={styles.termsBullet}>2.</Text>
              <Text style={styles.termsText}>
                Debit Note is issued only for sales return, excess billing, discount, or agreed adjustments.
              </Text>
            </View>
            <View style={styles.termsItemRow}>
              <Text style={styles.termsBullet}>3.</Text>
              <Text style={styles.termsText}>
                GST/Taxes (if applicable) are as per law, and ITC should be adjusted accordingly.
              </Text>
            </View>
          </View>
        </View>

        {/* CARD 4: Summary 1 (Total Amount, TCS, Net Amount) */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>SUMMARY</Text>

          {/* Total Amount */}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <TextInput
              style={[styles.summaryInput, !isDirectDebitNote && styles.summaryInputDisabled]}
              keyboardType="numeric"
              editable={isDirectDebitNote}
              value={String(totalAmount)}
              onChangeText={(txt) => setTotalAmount(parseFloat(txt) || 0)}
              placeholder="0.0"
              placeholderTextColor="#8E9CAE"
            />
          </View>

          {/* TCS Checkbox & Amount */}
          <View style={styles.summaryRow}>
            <TouchableOpacity
              style={styles.tcsCheckRow}
              onPress={() => setTcsApplicable(!tcsApplicable)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, tcsApplicable && styles.checkboxActive]}>
                {tcsApplicable && <Feather name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.summaryLabel}>TCS (1%)</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.summaryInput, !tcsApplicable && styles.summaryInputDisabled]}
              keyboardType="numeric"
              editable={tcsApplicable}
              value={String(tcsAmount)}
              onChangeText={(txt) => setTcsAmount(parseFloat(txt) || 0)}
              placeholder="0.0"
              placeholderTextColor="#8E9CAE"
            />
          </View>

          {/* Net Amount */}
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, styles.summaryLabelBold]}>Net Amount</Text>
            <TextInput
              style={[styles.summaryInput, styles.summaryInputNet]}
              editable={false}
              value={netAmount.toFixed(2)}
              placeholder="0.0"
              placeholderTextColor="#8E9CAE"
            />
          </View>
        </View>

        {/* CARD 5: Reference & Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>SUMMARY</Text>

          {/* Original Bill No */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Original Bill No <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={styles.standardInput}
              placeholder="Original Bill No"
              placeholderTextColor="#8E9CAE"
              value={originalBillNo}
              onChangeText={setOriginalBillNo}
            />
          </View>

          {/* Debit Note Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Debit Note Date <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.datePickerBtn}
              onPress={() => setIsDebitDateModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.datePickerText}>{debitNoteDate}</Text>
              <Feather name="calendar" size={17} color="#0047AB" />
            </TouchableOpacity>
          </View>

          {/* Remark */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Remark</Text>
            <TextInput
              style={styles.standardInput}
              placeholder="Remark"
              placeholderTextColor="#8E9CAE"
              value={remark}
              onChangeText={setRemark}
            />
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* PARTY SELECTION MODAL */}
      <Modal
        visible={isPartyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPartyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setIsPartyModalVisible(false)}
          />
          <View style={[styles.selectSheetCard, { maxHeight: '80%' }]}>
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Select Party</Text>
              <TouchableOpacity
                onPress={() => setIsPartyModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={20} color="#0E204E" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modalSearchBox}>
              <Feather name="search" size={16} color="#5A6B87" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search party by name or phone..."
                placeholderTextColor="#8E9CAE"
                value={partySearch}
                onChangeText={setPartySearch}
              />
            </View>

            {isLoadingParties ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#0047AB" />
              </View>
            ) : (
              <FlatList
                data={filteredParties}
                keyExtractor={(item) => String(item.purchasePartyId)}
                renderItem={({ item }) => {
                  const isSelected = selectedParty?.purchasePartyId === item.purchasePartyId;
                  return (
                    <TouchableOpacity
                      style={[styles.partyOption, isSelected && styles.partyOptionSelected]}
                      onPress={() => {
                        setSelectedParty(item);
                        setIsPartyModalVisible(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.partyOptionName,
                            isSelected && styles.partyOptionNameSelected,
                          ]}
                        >
                          {item.partyName}
                        </Text>
                        {item.partyPhone ? (
                          <Text style={styles.partyOptionSub}>{item.partyPhone}</Text>
                        ) : null}
                      </View>
                      {item.creaditAmount ? (
                        <Text style={styles.partyCreditAmt}>
                          Bal: ₹{Number(item.creaditAmount).toFixed(0)}
                        </Text>
                      ) : null}
                      {isSelected && <Feather name="check" size={17} color="#0047AB" />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: '#5A6B87', fontSize: 13 }}>No parties found.</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* FINANCIAL YEAR MODAL */}
      <Modal
        visible={isFyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setIsFyModalVisible(false)}
          />
          <View style={styles.selectSheetCard}>
            <Text style={styles.sheetTitle}>Select Financial Year</Text>
            {fyOptions.map((fy) => {
              const isSelected = financialYear === fy;
              return (
                <TouchableOpacity
                  key={fy}
                  style={[styles.selectOption, isSelected && styles.selectOptionActive]}
                  onPress={() => {
                    setFinancialYear(fy);
                    setIsFyModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      isSelected && styles.selectOptionTextActive,
                    ]}
                  >
                    {fy}
                  </Text>
                  {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* DEBIT NOTE TYPE MODAL */}
      <Modal
        visible={isTypeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTypeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setIsTypeModalVisible(false)}
          />
          <View style={styles.selectSheetCard}>
            <Text style={styles.sheetTitle}>Select Debit Note Type</Text>
            {(['Return Stock', 'Direct Debit Note'] as const).map((t) => {
              const isSelected = debitNoteType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.selectOption, isSelected && styles.selectOptionActive]}
                  onPress={() => {
                    setDebitNoteType(t);
                    setIsTypeModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      isSelected && styles.selectOptionTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                  {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* INVOICE DATE MODAL */}
      <Modal
        visible={isInvoiceDateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsInvoiceDateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setIsInvoiceDateModalVisible(false)}
          />
          <View style={styles.selectSheetCard}>
            <Text style={styles.sheetTitle}>Invoice Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.standardInput}
              value={invoiceDate}
              onChangeText={setInvoiceDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8E9CAE"
            />
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setIsInvoiceDateModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DEBIT NOTE DATE MODAL */}
      <Modal
        visible={isDebitDateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDebitDateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setIsDebitDateModalVisible(false)}
          />
          <View style={styles.selectSheetCard}>
            <Text style={styles.sheetTitle}>Debit Note Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.standardInput}
              value={debitNoteDate}
              onChangeText={setDebitNoteDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8E9CAE"
            />
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setIsDebitDateModalVisible(false)}
            >
              <Text style={styles.modalDoneBtnText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ADD ITEMS MODAL */}
      {selectedParty && (
        <AddDebitNoteItemsModal
          visible={isAddItemsModalVisible}
          onClose={() => setIsAddItemsModalVisible(false)}
          partyId={selectedParty.purchasePartyId}
          partyPlaceOfSupply={selectedParty.placeOfSupply || ''}
          financialYear={financialYear}
          onSuccess={loadCart}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  headerRightPlaceholder: {
    width: 38,
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 14,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5A6B87',
    letterSpacing: 0.8,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  requiredStar: {
    color: '#DC2626',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownBtnText: {
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#8E9CAE',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 6,
  },
  standardInput: {
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0E204E',
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  datePickerText: {
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '500',
  },
  cartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5A6B87',
    letterSpacing: 0.8,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clearCartText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  cartLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  cartLoadingText: {
    fontSize: 12,
    color: '#5A6B87',
  },
  cartEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  cartEmptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartEmptyTitle: {
    fontSize: 14,
    color: '#5A6B87',
    fontWeight: '500',
  },
  cartItemsList: {
    gap: 10,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  cartItemNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  cartItemInfo: {
    flex: 1,
    gap: 2,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  cartItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  cartItemMetaText: {
    fontSize: 12,
    color: '#5A6B87',
  },
  cartItemTotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  cartItemImeiText: {
    fontSize: 11,
    color: '#8E9CAE',
  },
  cartItemDeleteBtn: {
    padding: 6,
  },
  addItemDashedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0047AB',
    backgroundColor: '#EFF6FF',
    gap: 8,
  },
  addItemDashedText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0047AB',
  },
  termsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5A6B87',
    letterSpacing: 0.8,
  },
  termsList: {
    gap: 8,
  },
  termsItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  termsBullet: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
    lineHeight: 18,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#5A6B87',
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0E204E',
  },
  summaryLabelBold: {
    fontWeight: '700',
  },
  summaryInput: {
    width: 140,
    height: 42,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
    textAlign: 'right',
  },
  summaryInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#8E9CAE',
  },
  summaryInputNet: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    color: '#0047AB',
    fontWeight: '800',
    fontSize: 15,
  },
  tcsCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  overlayTouch: {
    ...StyleSheet.absoluteFill,
  },
  selectSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 18,
    gap: 10,
    elevation: 12,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 6,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
    paddingVertical: 0,
  },
  partyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFD',
  },
  partyOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  partyOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  partyOptionNameSelected: {
    color: '#0047AB',
    fontWeight: '700',
  },
  partyOptionSub: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
  },
  partyCreditAmt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    marginRight: 8,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0E204E',
  },
  selectOptionTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
  modalDoneBtn: {
    backgroundColor: '#0047AB',
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
