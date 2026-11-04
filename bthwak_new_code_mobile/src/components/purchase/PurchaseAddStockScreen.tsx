import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  PurchasePartyItem,
  PurchaseCartResponse,
  PurchaseCartDetailItem,
  DistributorBankItem,
  SubmitPurchasePayload,
  fetchPurchasePartyListApi,
  fetchPurchaseCartApi,
  clearPurchaseCartApi,
  fetchStockTermsConditionsApi,
  fetchDistributorBanksApi,
  submitPurchaseApi,
} from '@/api/purchase';
import { AddItemsModal } from './AddItemsModal';
import { AddPartySheet } from '@/components/modals/AddPartySheet';
import { CalendarPickerModal } from '@/components/common/CalendarPickerModal';
import { AppTabBar } from '@/components/navigation/AppTabBar';

interface PurchaseAddStockScreenProps {
  onOpenDrawer?: () => void;
  onOpenSettings?: () => void;
  onNavigateToCreditList?: () => void;
  onNavigateToParties?: () => void;
}

type PaymentMode = 'Cash' | 'Cheque' | 'Credit' | 'Online';
type OnlineType = 'IMPS' | 'NEFT' | 'RTGS' | 'WALLET' | 'UPI';

export const PurchaseAddStockScreen: React.FC<PurchaseAddStockScreenProps> = ({
  onOpenDrawer,
  onOpenSettings,
  onNavigateToCreditList,
  onNavigateToParties,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Parties state
  const [parties, setParties] = useState<PurchasePartyItem[]>([]);
  const [selectedParty, setSelectedParty] = useState<PurchasePartyItem | null>(null);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [partySearch, setPartySearch] = useState('');
  const [isLoadingParties, setIsLoadingParties] = useState(false);
  const [showAddBuyerSheet, setShowAddBuyerSheet] = useState(false);

  // Bill info state
  const [billNo, setBillNo] = useState('');
  const [billDate, setBillDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDateInput, setTempDateInput] = useState(billDate);
  const [taxPreference, setTaxPreference] = useState<'Inclusive' | 'Exclusive'>('Inclusive');

  // Cart state
  const [cart, setCart] = useState<PurchaseCartResponse>({
    items: [],
    summary: {
      final_bill_qty: 0,
      final_bill_amt: 0,
      final_paid_amt: 0,
      final_gst_paid: 0,
      cess_amt_final: 0,
      disc_amt_final: 0,
      net_amount_applicable: 0,
    },
    bill_type: 'Inclusive',
  });
  const [expandedCartItemIds, setExpandedCartItemIds] = useState<Record<number, boolean>>({});
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearingCart, setIsClearingCart] = useState(false);

  // Add Item Modal
  const [isAddItemsModalVisible, setIsAddItemsModalVisible] = useState(false);

  // Terms & Conditions
  const [terms, setTerms] = useState<string[]>([]);

  // Payment mode state
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paymentDetails, setPaymentDetails] = useState({
    paymentType: 'IMPS' as OnlineType,
    txnNo: '',
    chequeDate: new Date().toISOString().slice(0, 10),
    depositBankId: 0,
    depositBankName: '',
    creditDays: '30',
  });
  const [banks, setBanks] = useState<DistributorBankItem[]>([]);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const toggleCartItemExpand = (id: number) => {
    setExpandedCartItemIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalCartQty = useMemo(() => {
    return cart.items.reduce(
      (sum, item) => sum + (Number(item.actual_qty || item.bag_qty) || 1),
      0
    );
  }, [cart.items]);

  const totalCartAmt = useMemo(() => {
    return cart.items.reduce(
      (sum, item) => sum + (Number(item.net_amount) || 0),
      0
    );
  }, [cart.items]);

  // Additional charges state
  const [isChargesModalOpen, setIsChargesModalOpen] = useState(false);
  const [charges, setCharges] = useState({
    labour: 0,
    freight: 0,
    other: 0,
    tcsApplicable: false,
    tcsAmount: 0,
  });
  const [tempCharges, setTempCharges] = useState({
    labour: '0',
    freight: '0',
    other: '0',
    tcsApplicable: false,
    tcsAmount: '0',
  });

  // Remark state
  const [remark, setRemark] = useState('');

  // Submit loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // Load initial data
  // -------------------------------------------------------------
  const loadData = useCallback(async () => {
    try {
      const [partyList, cartData, termsList, bankList] = await Promise.all([
        fetchPurchasePartyListApi(),
        fetchPurchaseCartApi(),
        fetchStockTermsConditionsApi(),
        fetchDistributorBanksApi(),
      ]);
      setParties(partyList);
      setCart(cartData);
      if (cartData.bill_type === 'Exclusive') {
        setTaxPreference('Exclusive');
      }
      setTerms(termsList);
      setBanks(bankList);
      if (bankList.length > 0) {
        setPaymentDetails((prev) => ({
          ...prev,
          depositBankId: bankList[0].bankMasterId,
          depositBankName: bankList[0].bankName,
        }));
      }
    } catch (err) {
      console.warn('Failed to load initial purchase data', err);
    } finally {
      setIsLoadingCart(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadData();
  }, [loadData]);

  // Refresh cart only
  const refreshCart = useCallback(async () => {
    try {
      const cartData = await fetchPurchaseCartApi();
      setCart(cartData);
      if (cartData.bill_type === 'Exclusive') {
        setTaxPreference('Exclusive');
      }
    } catch (err) {
      console.warn('Error refreshing cart', err);
    }
  }, []);

  // -------------------------------------------------------------
  // Filtered party list for modal
  // -------------------------------------------------------------
  const filteredParties = useMemo(() => {
    const q = partySearch.toLowerCase().trim();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        p.partyName?.toLowerCase().includes(q) ||
        p.partyPhone?.toLowerCase().includes(q) ||
        p.placeOfSupply?.toLowerCase().includes(q)
    );
  }, [parties, partySearch]);

  // -------------------------------------------------------------
  // Calculations
  // -------------------------------------------------------------
  const additionalChargesTotal = useMemo(() => {
    const sum =
      charges.labour +
      charges.freight +
      charges.other +
      (charges.tcsApplicable ? charges.tcsAmount : 0);
    return sum;
  }, [charges]);

  const baseTotal = useMemo(() => {
    return cart.summary?.net_amount_applicable || cart.summary?.final_paid_amt || 0;
  }, [cart]);

  const netAmount = useMemo(() => {
    return baseTotal + additionalChargesTotal;
  }, [baseTotal, additionalChargesTotal]);

  // -------------------------------------------------------------
  // Clear cart handlers
  // -------------------------------------------------------------
  const handleClearCart = () => {
    if (cart.items.length === 0) return;
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from the purchase cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setIsClearingCart(true);
            try {
              const res = await clearPurchaseCartApi();
              if (res.status) {
                await refreshCart();
              } else {
                Alert.alert('Error', res.message || 'Failed to clear cart');
              }
            } catch {
              Alert.alert('Error', 'Failed to clear cart');
            } finally {
              setIsClearingCart(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteItem = async (item: PurchaseCartDetailItem) => {
    try {
      const res = await clearPurchaseCartApi({
        cartId: item.cart_detail_id,
        productId: item.product_id,
      });
      if (res.status) {
        await refreshCart();
      } else {
        Alert.alert('Error', res.message || 'Failed to remove item');
      }
    } catch {
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  // -------------------------------------------------------------
  // Additional Charges Modal Handlers
  // -------------------------------------------------------------
  const openChargesModal = () => {
    setTempCharges({
      labour: String(charges.labour || 0),
      freight: String(charges.freight || 0),
      other: String(charges.other || 0),
      tcsApplicable: charges.tcsApplicable,
      tcsAmount: String(charges.tcsAmount || 0),
    });
    setIsChargesModalOpen(true);
  };

  const saveChargesModal = () => {
    setCharges({
      labour: parseFloat(tempCharges.labour) || 0,
      freight: parseFloat(tempCharges.freight) || 0,
      other: parseFloat(tempCharges.other) || 0,
      tcsApplicable: tempCharges.tcsApplicable,
      tcsAmount: parseFloat(tempCharges.tcsAmount) || 0,
    });
    setIsChargesModalOpen(false);
  };

  // -------------------------------------------------------------
  // Submit Purchase
  // -------------------------------------------------------------
  const handleSubmitPurchase = async () => {
    if (!selectedParty) {
      Alert.alert('Required Field', 'Please select a Party / Supplier.');
      return;
    }
    if (!billNo.trim()) {
      Alert.alert('Required Field', 'Please enter Bill Number.');
      return;
    }
    if (!billDate) {
      Alert.alert('Required Field', 'Please select Bill Date.');
      return;
    }
    if (cart.items.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one item to the cart before submitting.');
      return;
    }

    if (paymentMode === 'Cheque') {
      if (!paymentDetails.txnNo.trim()) {
        Alert.alert('Required Field', 'Please enter Cheque Number.');
        return;
      }
    }

    if (paymentMode === 'Online') {
      if (!paymentDetails.txnNo.trim()) {
        Alert.alert('Required Field', 'Please enter Transaction / UTR Number.');
        return;
      }
      if (!paymentDetails.depositBankId) {
        Alert.alert('Required Field', 'Please select Deposit Bank.');
        return;
      }
    }

    const payload: SubmitPurchasePayload = {
      purchase_party_id: selectedParty.purchasePartyId,
      party_place_of_supply: selectedParty.placeOfSupply || '24-GUJARAT',
      distributor_place_of_supply: selectedParty.placeOfSupply || '24-GUJARAT',
      bill_type: taxPreference,
      bill_number: billNo.trim(),
      bill_date: billDate,
      dist_dsr_require: 'Yes',
      payment_mode: paymentMode,
      payment_type: paymentMode === 'Online' ? paymentDetails.paymentType : '',
      cheque_number:
        paymentMode === 'Cheque' || paymentMode === 'Online' ? paymentDetails.txnNo.trim() : '',
      cheque_date:
        paymentMode === 'Cheque' || paymentMode === 'Online' ? paymentDetails.chequeDate : '',
      credit_days: paymentMode === 'Credit' ? paymentDetails.creditDays : '',
      bank_id: paymentMode === 'Online' ? paymentDetails.depositBankId : 0,
      bank_name: paymentMode === 'Online' ? paymentDetails.depositBankName : '',
      net_amount: netAmount,
      tcs_applicable: charges.tcsApplicable ? 'Yes' : 'No',
      tcs_amount: charges.tcsAmount,
      labour_charges: charges.labour,
      freight_charges: charges.freight,
      other_expenses: charges.other,
      total_amount: baseTotal,
      calculate_discount_amt: cart.summary?.disc_amt_final ?? 0,
      remark: remark.trim(),
      source: 'app',
      item_taxs: cart.items.map((item) => ({
        gst: item.gst_amount ?? 0,
        cess_amt: item.cess_amount ?? 0,
      })),
    };

    setIsSubmitting(true);
    try {
      const res = await submitPurchaseApi(payload);
      if (res.status) {
        Alert.alert('Purchase Success', res.message || 'Purchase stock entry added successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedParty(null);
              setBillNo('');
              setRemark('');
              setCharges({
                labour: 0,
                freight: 0,
                other: 0,
                tcsApplicable: false,
                tcsAmount: 0,
              });
              void refreshCart();
            },
          },
        ]);
      } else {
        Alert.alert('Submission Error', res.message || 'Failed to submit purchase stock entry.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred while submitting purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER (MATCHES SCREENSHOT) */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.topHeaderRow}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              if (onOpenDrawer) onOpenDrawer();
              else if (router.canGoBack()) router.back();
              else router.replace('/dashboard');
            }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={22} color="#0E204E" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Add Stock</Text>
          </View>

          {/* Right option removed in mobile as requested */}
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#0047AB']}
            tintColor="#0047AB"
          />
        }
      >
        {/* ============================================================ */}
        {/* CARD 1: PARTY & BILL DETAILS */}
        {/* ============================================================ */}
        <View style={styles.card}>
          {/* PARTY NAME ROW */}
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>
              Party Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.addBuyerBtn}
              onPress={() => setShowAddBuyerSheet(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={14} color="#0047AB" />
              <Text style={styles.addBuyerBtnText}>Add Buyer</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.partySelectBtn}
            onPress={() => setIsPartyModalOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.partySelectInner}>
              <View
                style={[
                  styles.partyAvatarCircle,
                  { backgroundColor: selectedParty ? '#EFF6FF' : '#F8FAFD' },
                ]}
              >
                <Feather
                  name={selectedParty ? 'user-check' : 'user'}
                  size={18}
                  color={selectedParty ? '#0047AB' : '#5A6B87'}
                />
              </View>
              <View style={styles.partySelectTextWrap}>
                <Text
                  style={[
                    styles.partySelectTitle,
                    !selectedParty && { color: '#5A6B87', fontWeight: '500' },
                  ]}
                  numberOfLines={1}
                >
                  {selectedParty ? selectedParty.partyName : 'Select Party'}
                </Text>
                {selectedParty && (
                  <Text style={styles.partySelectSub}>
                    {selectedParty.partyPhone || 'No Phone'} • {selectedParty.placeOfSupply || 'N/A'}
                  </Text>
                )}
              </View>
            </View>
            <Feather name="chevron-down" size={20} color="#5A6B87" />
          </TouchableOpacity>

          {/* BALANCE INFO IF PARTY SELECTED */}
          {selectedParty && (
            <View style={styles.partyBalanceRow}>
              <View style={styles.balanceTag}>
                <Text style={styles.balanceTagLabel}>Credit Due:</Text>
                <Text style={[styles.balanceTagVal, { color: '#DC2626' }]}>
                  ₹{(selectedParty.creaditAmount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.balanceTag}>
                <Text style={styles.balanceTagLabel}>Advance:</Text>
                <Text style={[styles.balanceTagVal, { color: '#16A34A' }]}>
                  ₹{(selectedParty.advanceAmount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          )}

          {/* BILL NO & BILL DATE ROW */}
          <View style={styles.rowTwoCols}>
            {/* BILL NO */}
            <View style={styles.colHalf}>
              <Text style={styles.fieldLabel}>
                Bill No <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Bill No"
                  placeholderTextColor="#8E9CAE"
                  value={billNo}
                  onChangeText={setBillNo}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* BILL DATE */}
            <View style={styles.colHalf}>
              <Text style={styles.fieldLabel}>
                Date <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => {
                  setTempDateInput(billDate);
                  setIsDatePickerOpen(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dateText}>{billDate}</Text>
                <Feather name="calendar" size={17} color="#0047AB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* TAX PREFERENCE */}
          <View style={styles.taxPrefWrap}>
            <Text style={styles.fieldLabelSmall}>Tax Preference:</Text>
            <View style={styles.taxPillGroup}>
              {(['Inclusive', 'Exclusive'] as const).map((pref) => {
                const isActive = taxPreference === pref;
                return (
                  <TouchableOpacity
                    key={pref}
                    style={[styles.taxPill, isActive && styles.taxPillActive]}
                    onPress={() => setTaxPreference(pref)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.taxPillText, isActive && styles.taxPillTextActive]}>
                      {pref}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 2: CART & ITEMS */}
        {/* ============================================================ */}
        <View style={styles.card}>
          <View style={styles.cartHeaderRow}>
            <View style={styles.cartHeaderLeft}>
              <MaterialCommunityIcons name="cart-outline" size={18} color="#0047AB" />
              <Text style={styles.cartHeaderTitle}>
                CART • {cart.items.length} {cart.items.length === 1 ? 'ITEM' : 'ITEMS'}
              </Text>
            </View>

            {cart.items.length > 0 && (
              <TouchableOpacity
                style={styles.clearCartBtn}
                onPress={handleClearCart}
                disabled={isClearingCart}
                activeOpacity={0.7}
              >
                {isClearingCart ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Feather name="trash-2" size={14} color="#EF4444" />
                    <Text style={styles.clearCartText}>Clear Cart</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* CART BODY */}
          {isLoadingCart ? (
            <View style={styles.cartLoaderWrap}>
              <ActivityIndicator size="small" color="#0047AB" />
              <Text style={styles.cartLoaderText}>Loading cart details...</Text>
            </View>
          ) : cart.items.length === 0 ? (
            <View style={styles.cartEmptyWrap}>
              <View style={styles.emptyCartIconCircle}>
                <Feather name="shopping-bag" size={28} color="#94A3B8" />
              </View>
              <Text style={styles.cartEmptyTitle}>Cart empty — tap add item below</Text>
              <Text style={styles.cartEmptySub}>
                Add FMCG goods, Serial/IMEI products, or service items
              </Text>
            </View>
          ) : (
            <View style={styles.cartItemsList}>
              {cart.items.map((item, index) => {
                // Parse IMEIs if any
                let imeiList: string[] = [];
                if (Array.isArray(item.imeiList)) {
                  imeiList = item.imeiList.map((im: any) =>
                    typeof im === 'string' ? im : im.imei_no || ''
                  );
                } else if (typeof item.imeiList === 'string' && item.imeiList.trim()) {
                  imeiList = item.imeiList.split(',').map((s) => s.trim());
                }

                const isExpanded = !!expandedCartItemIds[item.cart_detail_id];

                return (
                  <View key={item.cart_detail_id || index} style={styles.cartItemCard}>
                    {/* TOP ROW: Product Name + Chevron + Delete Trash */}
                    <View style={styles.cartItemTopRow}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {item.product_name}
                      </Text>

                      <View style={styles.cartItemActionIcons}>
                        {imeiList.length > 0 && (
                          <TouchableOpacity
                            style={styles.cartItemExpandBtn}
                            onPress={() => toggleCartItemExpand(item.cart_detail_id)}
                            activeOpacity={0.7}
                          >
                            <Feather
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={18}
                              color="#64748B"
                            />
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.cartItemTrashBtn}
                          onPress={() => handleDeleteItem(item)}
                          activeOpacity={0.7}
                        >
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* 4-COLUMN BREAKDOWN: Price | Qty | Tax | Total */}
                    <View style={styles.cartItemMetricsTable}>
                      <View style={styles.cartItemMetricCol}>
                        <Text style={styles.cartItemMetricHeader}>Price</Text>
                        <Text style={styles.cartItemMetricValue}>
                          ₹{Number(item.price || 0).toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.cartItemMetricCol}>
                        <Text style={styles.cartItemMetricHeader}>Qty</Text>
                        <Text style={styles.cartItemMetricValue}>
                          {item.actual_qty || item.bag_qty || 1}
                        </Text>
                      </View>

                      <View style={styles.cartItemMetricCol}>
                        <Text style={styles.cartItemMetricHeader}>Tax</Text>
                        <Text style={styles.cartItemMetricValue}>
                          {item.gst_percent ? `${item.gst_percent}%` : '0%'}
                        </Text>
                      </View>

                      <View style={[styles.cartItemMetricCol, { alignItems: 'flex-end' }]}>
                        <Text style={styles.cartItemMetricHeader}>Total</Text>
                        <Text style={styles.cartItemMetricTotalValue}>
                          ₹{Number(item.net_amount || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {/* EXPANDED IMEIs LIST */}
                    {imeiList.length > 0 && isExpanded && (
                      <View style={styles.cartItemExpandedImeis}>
                        <Text style={styles.cartItemImeiHeader}>
                          IMEIs ({imeiList.length}):
                        </Text>
                        <View style={styles.cartItemImeiChipsWrap}>
                          {imeiList.map((sn, sidx) => (
                            <View key={sidx} style={styles.cartItemImeiChip}>
                              <Text style={styles.cartItemImeiChipText}>{sn}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* CART TOTAL BAR (MATCHES SCREENSHOT 3) */}
              <View style={styles.cartTotalBar}>
                <Text style={styles.cartTotalLabel}>Total</Text>
                <View style={styles.cartTotalRight}>
                  <Text style={styles.cartTotalQtyText}>Qty: {totalCartQty}</Text>
                  <Text style={styles.cartTotalAmtText}>₹{totalCartAmt.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ACTION BUTTONS: + ADD ITEM & + NEW ITEM */}
          <View style={styles.cartActionButtonsRow}>
            <TouchableOpacity
              style={styles.addItemOutlineBtn}
              onPress={() => setIsAddItemsModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={18} color="#0047AB" />
              <Text style={styles.addItemOutlineText}>Add Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newItemSolidBtn}
              onPress={() => setIsAddItemsModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={18} color="#0E1128" />
              <Text style={styles.newItemSolidText}>New Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 3: TERMS & CONDITIONS */}
        {/* ============================================================ */}
        <View style={styles.card}>
          <View style={styles.termsHeaderRow}>
            <MaterialCommunityIcons name="file-document-outline" size={18} color="#0047AB" />
            <Text style={styles.termsHeaderTitle}>TERMS & CONDITIONS</Text>
          </View>
          <View style={styles.termsList}>
            {terms.map((term, index) => (
              <View key={index} style={styles.termItemRow}>
                <Text style={styles.termNumber}>{index + 1}.</Text>
                <Text style={styles.termText}>{term}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 4: SELECT PAYMENT MODE */}
        {/* ============================================================ */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>SELECT PAYMENT MODE</Text>

          {/* PAYMENT MODE PILLS */}
          <View style={styles.paymentModePillsRow}>
            {(['Cash', 'Cheque', 'Credit', 'Online'] as const).map((mode) => {
              const isSelected = paymentMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.paymentModePill, isSelected && styles.paymentModePillActive]}
                  onPress={() => setPaymentMode(mode)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.paymentModePillText,
                      isSelected && styles.paymentModePillTextActive,
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CONDITIONAL PAYMENT INPUTS */}
          {paymentMode === 'Cheque' && (
            <View style={styles.conditionalModeBox}>
              <View style={styles.rowTwoCols}>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldLabelSmall}>
                    Cheque No <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInputSmall}
                    placeholder="e.g. 000123"
                    placeholderTextColor="#94A3B8"
                    value={paymentDetails.txnNo}
                    onChangeText={(val) => setPaymentDetails((s) => ({ ...s, txnNo: val }))}
                  />
                </View>

                <View style={styles.colHalf}>
                  <Text style={styles.fieldLabelSmall}>
                    Cheque Date <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.textInputSmall}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94A3B8"
                    value={paymentDetails.chequeDate}
                    onChangeText={(val) => setPaymentDetails((s) => ({ ...s, chequeDate: val }))}
                  />
                </View>
              </View>
            </View>
          )}

          {paymentMode === 'Credit' && (
            <View style={styles.conditionalModeBox}>
              <Text style={styles.fieldLabelSmall}>Credit Term (Days):</Text>
              <View style={styles.creditDaysRow}>
                {['7', '15', '30', '45', '60'].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.creditDayChip,
                      paymentDetails.creditDays === days && styles.creditDayChipActive,
                    ]}
                    onPress={() => setPaymentDetails((s) => ({ ...s, creditDays: days }))}
                  >
                    <Text
                      style={[
                        styles.creditDayChipText,
                        paymentDetails.creditDays === days && styles.creditDayChipTextActive,
                      ]}
                    >
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={styles.creditCustomInput}
                  placeholder="Custom"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={paymentDetails.creditDays}
                  onChangeText={(val) => setPaymentDetails((s) => ({ ...s, creditDays: val }))}
                />
              </View>
            </View>
          )}

          {paymentMode === 'Online' && (
            <View style={styles.conditionalModeBox}>
              {/* ONLINE TRANSFER TYPE */}
              <Text style={styles.fieldLabelSmall}>Transfer Type:</Text>
              <View style={styles.transferTypeRow}>
                {(['IMPS', 'NEFT', 'RTGS', 'UPI', 'WALLET'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.transferTypeChip,
                      paymentDetails.paymentType === type && styles.transferTypeChipActive,
                    ]}
                    onPress={() => setPaymentDetails((s) => ({ ...s, paymentType: type }))}
                  >
                    <Text
                      style={[
                        styles.transferTypeChipText,
                        paymentDetails.paymentType === type && styles.transferTypeChipTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* BANK SELECTION */}
              <Text style={[styles.fieldLabelSmall, { marginTop: 10 }]}>
                Deposit Bank <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.bankSelectBtn}
                onPress={() => setIsBankModalOpen(true)}
              >
                <Text
                  style={[
                    styles.bankSelectText,
                    !paymentDetails.depositBankName && { color: '#94A3B8' },
                  ]}
                  numberOfLines={1}
                >
                  {paymentDetails.depositBankName || 'Select Distributor Bank'}
                </Text>
                <Feather name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>

              {/* TXN NO */}
              <Text style={[styles.fieldLabelSmall, { marginTop: 10 }]}>
                Transaction / UTR No <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInputSmall}
                placeholder="UTR / Reference Number"
                placeholderTextColor="#94A3B8"
                value={paymentDetails.txnNo}
                onChangeText={(val) => setPaymentDetails((s) => ({ ...s, txnNo: val }))}
              />
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* CARD 5: SUMMARY */}
        {/* ============================================================ */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>SUMMARY</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>₹{baseTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.additionalChargesLeft}>
              <Text style={styles.summaryLabel}>Additional Charges</Text>
              {additionalChargesTotal > 0 && (
                <Text style={styles.additionalChargesBreakdown}>
                  {charges.labour ? `Labour: ₹${charges.labour} ` : ''}
                  {charges.freight ? `Freight: ₹${charges.freight} ` : ''}
                  {charges.other ? `Other: ₹${charges.other} ` : ''}
                  {charges.tcsApplicable ? `TCS: ₹${charges.tcsAmount}` : ''}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.addChargesBtn}
              onPress={openChargesModal}
              activeOpacity={0.8}
            >
              <Text style={styles.addChargesBtnText}>
                {additionalChargesTotal > 0 ? `₹${additionalChargesTotal.toFixed(2)} ` : ''}+
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.netAmountLabel}>Net Amount</Text>
            <Text style={styles.netAmountValue}>₹{netAmount.toFixed(2)}</Text>
          </View>

          {/* OPTIONAL REMARKS */}
          <View style={styles.remarkWrap}>
            <Text style={styles.fieldLabelSmall}>Remark / Notes (Optional):</Text>
            <TextInput
              style={styles.remarkInput}
              placeholder="e.g. Goods delivered at central warehouse..."
              placeholderTextColor="#94A3B8"
              value={remark}
              onChangeText={setRemark}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[
            styles.submitPurchaseBtn,
            (cart.items.length === 0 || !selectedParty || isSubmitting) &&
              styles.submitPurchaseBtnDisabled,
          ]}
          onPress={handleSubmitPurchase}
          disabled={cart.items.length === 0 || !selectedParty || isSubmitting}
          activeOpacity={0.88}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.submitPurchaseBtnInner}>
              <Feather name="shopping-cart" size={20} color="#FFFFFF" />
              <Text style={styles.submitPurchaseBtnText}>
                Add Purchase • ₹{netAmount.toFixed(2)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ============================================================ */}
      {/* MODAL 1: ADD ITEMS MODAL (FULL CAPABILITIES) */}
      {/* ============================================================ */}
      <AddItemsModal
        visible={isAddItemsModalVisible}
        onClose={() => setIsAddItemsModalVisible(false)}
        onSuccess={() => {
          void refreshCart();
        }}
      />

      {/* ============================================================ */}
      {/* MODAL 2: PARTY SELECTION MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={isPartyModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPartyModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Party / Supplier</Text>
                <Text style={styles.modalSubTitle}>
                  Showing {filteredParties.length} available vendors
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsPartyModalOpen(false)}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* SEARCH PARTY INPUT */}
            <View style={styles.modalSearchWrap}>
              <Feather name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search party by name, phone, or state..."
                placeholderTextColor="#94A3B8"
                value={partySearch}
                onChangeText={setPartySearch}
                autoFocus
              />
              {partySearch.length > 0 && (
                <TouchableOpacity onPress={() => setPartySearch('')}>
                  <Feather name="x-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* PARTIES LIST */}
            <ScrollView style={styles.modalScroll}>
              {filteredParties.map((p) => {
                const isSelected = selectedParty?.purchasePartyId === p.purchasePartyId;
                return (
                  <TouchableOpacity
                    key={p.purchasePartyId}
                    style={[styles.partyListItem, isSelected && styles.partyListItemActive]}
                    onPress={() => {
                      setSelectedParty(p);
                      setIsPartyModalOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.partyItemLeft}>
                      <View
                        style={[
                          styles.partyItemAvatar,
                          isSelected && { backgroundColor: '#0047AB' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.partyItemAvatarText,
                            isSelected && { color: '#0E1128' },
                          ]}
                        >
                          {(p.partyName || 'P').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.partyItemName} numberOfLines={1}>
                          {p.partyName}
                        </Text>
                        <Text style={styles.partyItemMeta}>
                          {p.partyPhone ? `📞 ${p.partyPhone}` : 'No phone'}
                          {p.placeOfSupply ? ` • ${p.placeOfSupply}` : ''}
                        </Text>
                      </View>
                    </View>

                    {isSelected && <Feather name="check-circle" size={20} color="#0047AB" />}
                  </TouchableOpacity>
                );
              })}

              {filteredParties.length === 0 && (
                <View style={styles.modalEmptyWrap}>
                  <Feather name="user-x" size={32} color="#8E98BA" />
                  <Text style={styles.modalEmptyTitle}>No parties match "{partySearch}"</Text>
                  <TouchableOpacity
                    style={styles.modalAddBuyerBtn}
                    onPress={() => {
                      setIsPartyModalOpen(false);
                      setShowAddBuyerSheet(true);
                    }}
                  >
                    <Text style={styles.modalAddBuyerText}>+ Create New Buyer / Party</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 3: DISTRIBUTOR BANK SELECTION MODAL */}
      {/* ============================================================ */}
      <Modal
        visible={isBankModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsBankModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Deposit Bank</Text>
              <TouchableOpacity onPress={() => setIsBankModalOpen(false)}>
                <Feather name="x" size={20} color="#8E98BA" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {banks.map((b) => (
                <TouchableOpacity
                  key={b.bankMasterId}
                  style={styles.bankListItem}
                  onPress={() => {
                    setPaymentDetails((s) => ({
                      ...s,
                      depositBankId: b.bankMasterId,
                      depositBankName: b.bankName,
                    }));
                    setIsBankModalOpen(false);
                  }}
                >
                  <Ionicons name="business-outline" size={20} color="#0047AB" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.bankItemName}>{b.bankName}</Text>
                    {b.accountNo ? (
                      <Text style={styles.bankItemAcc}>A/C: {b.accountNo}</Text>
                    ) : null}
                  </View>
                  {paymentDetails.depositBankId === b.bankMasterId && (
                    <Feather name="check" size={18} color="#0047AB" />
                  )}
                </TouchableOpacity>
              ))}

              {banks.length === 0 && (
                <Text style={styles.noBanksText}>No distributor bank accounts found.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 4: ADDITIONAL CHARGES SHEET */}
      {/* ============================================================ */}
      <Modal
        visible={isChargesModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsChargesModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Additional Charges</Text>
              <TouchableOpacity onPress={() => setIsChargesModalOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.chargesFormBody}>
              {/* LABOUR */}
              <View style={styles.chargeInputRow}>
                <Text style={styles.chargeInputLabel}>Labour Charges (₹)</Text>
                <TextInput
                  style={styles.chargeTextInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={tempCharges.labour}
                  onChangeText={(val) => setTempCharges((s) => ({ ...s, labour: val }))}
                />
              </View>

              {/* FREIGHT */}
              <View style={styles.chargeInputRow}>
                <Text style={styles.chargeInputLabel}>Freight Charges (₹)</Text>
                <TextInput
                  style={styles.chargeTextInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={tempCharges.freight}
                  onChangeText={(val) => setTempCharges((s) => ({ ...s, freight: val }))}
                />
              </View>

              {/* OTHER */}
              <View style={styles.chargeInputRow}>
                <Text style={styles.chargeInputLabel}>Other Expenses (₹)</Text>
                <TextInput
                  style={styles.chargeTextInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={tempCharges.other}
                  onChangeText={(val) => setTempCharges((s) => ({ ...s, other: val }))}
                />
              </View>

              {/* TCS TOGGLE */}
              <View style={styles.tcsToggleRow}>
                <Text style={styles.chargeInputLabel}>TCS Applicable</Text>
                <TouchableOpacity
                  style={[
                    styles.tcsPill,
                    tempCharges.tcsApplicable ? styles.tcsPillActive : styles.tcsPillInactive,
                  ]}
                  onPress={() =>
                    setTempCharges((s) => ({ ...s, tcsApplicable: !s.tcsApplicable }))
                  }
                >
                  <Text
                    style={[
                      styles.tcsPillText,
                      tempCharges.tcsApplicable && styles.tcsPillTextActive,
                    ]}
                  >
                    {tempCharges.tcsApplicable ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
              </View>

              {tempCharges.tcsApplicable && (
                <View style={styles.chargeInputRow}>
                  <Text style={styles.chargeInputLabel}>TCS Amount (₹)</Text>
                  <TextInput
                    style={styles.chargeTextInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={tempCharges.tcsAmount}
                    onChangeText={(val) => setTempCharges((s) => ({ ...s, tcsAmount: val }))}
                  />
                </View>
              )}

              <TouchableOpacity style={styles.saveChargesBtn} onPress={saveChargesModal}>
                <Text style={styles.saveChargesBtnText}>Apply Charges</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL 5: CALENDAR PICKER MODAL */}
      {/* ============================================================ */}
      <CalendarPickerModal
        visible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={billDate}
        onSelectDate={(ymd) => {
          setBillDate(ymd);
          setIsDatePickerOpen(false);
        }}
        maxDate={new Date()}
        title="Select Bill Date"
      />

      {/* ============================================================ */}
      {/* MODAL 6: ADD BUYER SHEET (REUSED) */}
      {/* ============================================================ */}
      <AddPartySheet
        visible={showAddBuyerSheet}
        onClose={() => setShowAddBuyerSheet(false)}
        onSuccess={async () => {
          setShowAddBuyerSheet(false);
          const updated = await fetchPurchasePartyListApi();
          setParties(updated);
          if (updated.length > 0) {
            setSelectedParty(updated[0]);
          }
        }}
      />
      {/* BOTTOM TAB BAR */}
      <AppTabBar
        activeTab="parties"
        onTabChange={(tab) => {
          if (tab === 'dashboard') {
            router.replace('/dashboard?tab=dashboard' as any);
          } else if (tab === 'sales') {
            router.replace('/generate-invoice' as any);
          } else if (tab === 'reports') {
            router.replace('/dashboard?tab=reports' as any);
          } else if (tab === 'chat') {
            router.replace('/dashboard?tab=chat' as any);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingBottom: 10,
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  headerSubTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#5A6B87',
  },
  subSegmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  subSegmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  subSegmentPillActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  subSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
  },
  subSegmentTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  fieldLabelSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
    marginBottom: 4,
  },
  requiredStar: {
    color: '#DC2626',
  },
  addBuyerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addBuyerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  partySelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  partySelectInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  partyAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  partySelectTextWrap: {
    flex: 1,
  },
  partySelectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  partySelectSub: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
  },
  partyBalanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  balanceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceTagLabel: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '500',
  },
  balanceTagVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  colHalf: {
    flex: 1,
  },
  inputWrap: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '600',
    padding: 0,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  taxPrefWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  taxPillGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  taxPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  taxPillActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  taxPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
  },
  taxPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cartHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 0.3,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  cartLoaderWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  cartLoaderText: {
    fontSize: 12,
    color: '#5A6B87',
  },
  cartEmptyWrap: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyCartIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cartEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  cartEmptySub: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 3,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cartItemsList: {
    paddingVertical: 4,
  },
  cartItemCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 10,
  },
  cartItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E204E',
    flex: 1,
  },
  cartItemActionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartItemExpandBtn: {
    padding: 2,
  },
  cartItemTrashBtn: {
    padding: 2,
  },
  cartItemMetricsTable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  cartItemMetricCol: {
    flex: 1,
  },
  cartItemMetricHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
    marginBottom: 2,
  },
  cartItemMetricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  cartItemMetricTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
  },
  cartItemExpandedImeis: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cartItemImeiHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
    marginBottom: 6,
  },
  cartItemImeiChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cartItemImeiChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cartItemImeiChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0047AB',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  cartTotalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cartTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E204E',
  },
  cartTotalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cartTotalQtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B87',
  },
  cartTotalAmtText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0047AB',
  },
  imeiChip: {
    backgroundColor: '#F8FAFD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  imeiChipText: {
    fontSize: 11,
    color: '#0E204E',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  cartActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  addItemOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0047AB',
    borderStyle: 'dashed',
    backgroundColor: '#EFF6FF',
  },
  addItemOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  newItemSolidBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0047AB',
  },
  newItemSolidText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  termsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  termsHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 0.5,
  },
  termsList: {
    gap: 6,
  },
  termItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  termNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6B87',
    width: 18,
  },
  termText: {
    fontSize: 12,
    color: '#5A6B87',
    flex: 1,
    lineHeight: 18,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  paymentModePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentModePill: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  paymentModePillActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  paymentModePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  paymentModePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  conditionalModeBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInputSmall: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
    color: '#0E204E',
  },
  creditDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  creditDayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  creditDayChipActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  creditDayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
  },
  creditDayChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  creditCustomInput: {
    width: 65,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 12,
    color: '#0E204E',
  },
  transferTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  transferTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  transferTypeChipActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  transferTypeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
  },
  transferTypeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bankSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginTop: 4,
  },
  bankSelectText: {
    fontSize: 13,
    color: '#0E204E',
    fontWeight: '500',
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  additionalChargesLeft: {
    flex: 1,
  },
  additionalChargesBreakdown: {
    fontSize: 10,
    color: '#5A6B87',
    marginTop: 2,
  },
  addChargesBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addChargesBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  netAmountLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
  },
  netAmountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0047AB',
  },
  remarkWrap: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  remarkInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0E204E',
    textAlignVertical: 'top',
  },
  submitPurchaseBtn: {
    backgroundColor: '#0047AB',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 20,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitPurchaseBtnDisabled: {
    backgroundColor: '#CBD5E1',
    elevation: 0,
  },
  submitPurchaseBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitPurchaseBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 88, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  modalSubTitle: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
  },
  modalScroll: {
    maxHeight: 380,
  },
  partyListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  partyListItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  partyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  partyItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyItemAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
  },
  partyItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  partyItemMeta: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
  },
  modalEmptyWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  modalEmptyTitle: {
    fontSize: 13,
    color: '#5A6B87',
  },
  modalAddBuyerBtn: {
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modalAddBuyerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  bankListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  bankItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  bankItemAcc: {
    fontSize: 12,
    color: '#5A6B87',
  },
  noBanksText: {
    paddingVertical: 20,
    textAlign: 'center',
    color: '#5A6B87',
    fontSize: 13,
  },
  chargesFormBody: {
    gap: 12,
  },
  chargeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chargeInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  chargeTextInput: {
    width: 120,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    backgroundColor: '#FFFFFF',
    textAlign: 'right',
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  tcsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tcsPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  tcsPillActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  tcsPillInactive: {
    backgroundColor: '#F8FAFD',
  },
  tcsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6B87',
  },
  tcsPillTextActive: {
    color: '#FFFFFF',
  },
  saveChargesBtn: {
    backgroundColor: '#0047AB',
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveChargesBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  datePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  datePresetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  datePresetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
});
