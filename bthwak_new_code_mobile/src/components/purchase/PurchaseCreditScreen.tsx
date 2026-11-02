import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  fetchPurchasePartyCreditListApi,
  fetchPartyWiseCreditBillingDetailsApi,
  updateCreditPurchasePartyPaymentBillApi,
  fetchPurchaseBillDetailListApi,
  deletePurchasePaymentReceiptApi,
  generatePaymentReceiptPdfApi,
  PurchasePartyCreditItem,
  PurchaseCreditBillRecord,
  PurchaseBillDetailItem,
  PurchasePaymentReceiptItem,
} from '@/api/purchaseCredit';

interface PurchaseCreditScreenProps {
  onBack?: () => void;
}

type ActiveView = 'credit_list' | 'credit_adjustment' | 'bill_detail';

export const PurchaseCreditScreen: React.FC<PurchaseCreditScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();

  // Navigation state
  const [activeView, setActiveView] = useState<ActiveView>('credit_list');

  // Screen 1: Party Credit List state
  const [creditList, setCreditList] = useState<PurchasePartyCreditItem[]>([]);
  const [finalStockValue, setFinalStockValue] = useState(0);
  const [finalPendingValue, setFinalPendingValue] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isRefreshingList, setIsRefreshingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creditFilter, setCreditFilter] = useState<'all' | 'due' | 'cleared'>('all');

  // Selected party for Adjustment (Screen 2)
  const [selectedParty, setSelectedParty] = useState<PurchasePartyCreditItem | null>(null);
  const [partyBills, setPartyBills] = useState<PurchaseCreditBillRecord[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [clientPendingAmt, setClientPendingAmt] = useState(0);

  // Screen 2: Adjustment form state
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, string>>({});
  const [receivedAmount, setReceivedAmount] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Cheque' | 'Online'>('Cash');
  const [paymentDate, setPaymentDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // Selected bill for Bill Detail (Screen 3)
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<{
    unique_bill: string;
    bill_no: string;
    party_id: string | number;
  } | null>(null);
  const [billDetails, setBillDetails] = useState<PurchaseBillDetailItem[]>([]);
  const [receiptDetails, setReceiptDetails] = useState<PurchasePaymentReceiptItem[]>([]);
  const [isLoadingBillDetail, setIsLoadingBillDetail] = useState(false);
  const [generatingReceiptId, setGeneratingReceiptId] = useState<string | number | null>(null);

  // -------------------------------------------------------------
  // API: Load Party Credit List
  // -------------------------------------------------------------
  const loadPartyCreditList = useCallback(async () => {
    try {
      const res = await fetchPurchasePartyCreditListApi();
      if (res.success) {
        setCreditList(res.data.data_set);
        setFinalStockValue(res.data.final_stock_value);
        setFinalPendingValue(res.data.final_pending_value);
      } else {
        setCreditList([]);
        setFinalStockValue(0);
        setFinalPendingValue(0);
      }
    } catch {
      setCreditList([]);
    } finally {
      setIsLoadingList(false);
      setIsRefreshingList(false);
    }
  }, []);

  useEffect(() => {
    loadPartyCreditList();
  }, [loadPartyCreditList]);

  const handleRefreshList = () => {
    setIsRefreshingList(true);
    loadPartyCreditList();
  };

  // -------------------------------------------------------------
  // API: Load Party Bills (Screen 2)
  // -------------------------------------------------------------
  const loadPartyBills = async (party: PurchasePartyCreditItem) => {
    setSelectedParty(party);
    setActiveView('credit_adjustment');
    setIsLoadingBills(true);
    setAdjustAmounts({});
    setReceivedAmount('');
    setRemarkText('');

    try {
      const res = await fetchPartyWiseCreditBillingDetailsApi(party.purchase_party_id);
      if (res.success) {
        setPartyBills(res.data.records || []);
        setClientPendingAmt(res.data.client_pending_amt);
      } else {
        setPartyBills([]);
        setClientPendingAmt(party.pending_amount);
      }
    } catch {
      setPartyBills([]);
      setClientPendingAmt(party.pending_amount);
    } finally {
      setIsLoadingBills(false);
    }
  };

  // -------------------------------------------------------------
  // API: Load Bill Detail & Receipts (Screen 3)
  // -------------------------------------------------------------
  const loadBillDetail = async (
    unique_bill: string,
    bill_no: string,
    party_id: string | number
  ) => {
    setSelectedBillForDetail({ unique_bill, bill_no, party_id });
    setActiveView('bill_detail');
    setIsLoadingBillDetail(true);

    try {
      const res = await fetchPurchaseBillDetailListApi({
        unique_id: unique_bill,
        bill_no,
        purchase_party_id: party_id,
      });
      if (res.success) {
        setBillDetails(res.data.purchase_party_ditails || []);
        setReceiptDetails(res.data.purchase_payment_details || []);
      } else {
        setBillDetails([]);
        setReceiptDetails([]);
      }
    } catch {
      setBillDetails([]);
      setReceiptDetails([]);
    } finally {
      setIsLoadingBillDetail(false);
    }
  };

  // -------------------------------------------------------------
  // Handlers: Adjustment Form
  // -------------------------------------------------------------
  const handleReceivedAmountChange = (text: string) => {
    setReceivedAmount(text);
    const amount = parseFloat(text) || 0;
    if (amount <= 0) {
      setAdjustAmounts({});
      return;
    }

    // Allocate across pending bills FIFO
    let remaining = amount;
    const newAdjusts: Record<string, string> = {};
    partyBills.forEach((b) => {
      if (remaining <= 0) return;
      const key = `${b.unique_bill}_${b.bill_no}`;
      const toAdjust = Math.min(b.pending_amount, remaining);
      if (toAdjust > 0) {
        newAdjusts[key] = String(toAdjust);
        remaining -= toAdjust;
      }
    });
    setAdjustAmounts(newAdjusts);
  };

  const handleApplyPresetAmount = (preset: 'full' | 'half' | 'clear') => {
    const totalPending = clientPendingAmt || selectedParty?.pending_amount || 0;
    if (preset === 'clear') {
      setReceivedAmount('');
      setAdjustAmounts({});
      return;
    }
    const target = preset === 'full' ? totalPending : Math.round(totalPending / 2);
    handleReceivedAmountChange(String(target));
  };

  const handleAdjustPerBillChange = (key: string, text: string) => {
    const updated = { ...adjustAmounts, [key]: text };
    setAdjustAmounts(updated);

    let total = 0;
    Object.values(updated).forEach((val) => {
      const n = parseFloat(val);
      if (!isNaN(n)) total += n;
    });
    setReceivedAmount(total > 0 ? String(total) : '');
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedParty) return;

    const recvNum = parseFloat(receivedAmount);
    if (isNaN(recvNum) || recvNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid payment amount greater than 0.');
      return;
    }

    const totalAllowed = clientPendingAmt || selectedParty.pending_amount;
    if (recvNum > totalAllowed) {
      Alert.alert(
        'Validation Error',
        `Payment amount cannot exceed total pending balance (₹${totalAllowed.toLocaleString('en-IN')}).`
      );
      return;
    }

    // Build adjust_list
    const adjust_list: Array<{
      unique_bill: string;
      bill_no: string;
      pending_amt: number;
      adjust_amt: number;
    }> = [];

    partyBills.forEach((b) => {
      const key = `${b.unique_bill}_${b.bill_no}`;
      const userAdjust = parseFloat(adjustAmounts[key] || '0');
      if (userAdjust > 0) {
        adjust_list.push({
          unique_bill: b.unique_bill,
          bill_no: b.bill_no,
          pending_amt: b.pending_amount,
          adjust_amt: userAdjust,
        });
      }
    });

    if (adjust_list.length === 0 && partyBills.length > 0) {
      const first = partyBills[0];
      adjust_list.push({
        unique_bill: first.unique_bill,
        bill_no: first.bill_no,
        pending_amt: first.pending_amount,
        adjust_amt: Math.min(first.pending_amount, recvNum),
      });
    }

    setIsSubmittingAdjustment(true);
    try {
      const res = await updateCreditPurchasePartyPaymentBillApi({
        party_id: selectedParty.purchase_party_id,
        dist_dsr_require: 'No',
        pay_date: paymentDate,
        total_bill_pending_amt: clientPendingAmt || selectedParty.pending_amount,
        total_recieved_amt: recvNum,
        remark: remarkText.trim() || undefined,
        payment_mode: paymentMode,
        adjust_list,
      });

      if (res.success) {
        Alert.alert('Payment Recorded', res.message || 'Credit adjustment submitted successfully!', [
          {
            text: 'OK',
            onPress: () => {
              void loadPartyCreditList();
              setActiveView('credit_list');
            },
          },
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to submit credit adjustment.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update credit payment.');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const handleDeleteReceipt = (receipt: PurchasePaymentReceiptItem) => {
    Alert.alert(
      'Delete Receipt',
      `Delete payment receipt of ₹${receipt.total_amount.toLocaleString(
        'en-IN'
      )} (${receipt.payment_mode})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deletePurchasePaymentReceiptApi(receipt.payment_id);
              if (res.success) {
                Alert.alert('Deleted', 'Payment receipt removed successfully.');
                if (selectedBillForDetail) {
                  void loadBillDetail(
                    selectedBillForDetail.unique_bill,
                    selectedBillForDetail.bill_no,
                    selectedBillForDetail.party_id
                  );
                }
              } else {
                Alert.alert('Error', res.message || 'Failed to delete payment receipt.');
              }
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not delete receipt.');
            }
          },
        },
      ]
    );
  };

  const handleGenerateReceiptPdf = async (receipt: PurchasePaymentReceiptItem) => {
    try {
      setGeneratingReceiptId(receipt.payment_id);
      const res = await generatePaymentReceiptPdfApi({
        payment_id: receipt.payment_id,
        purchase_party_id: selectedBillForDetail?.party_id,
        unique_id: selectedBillForDetail?.unique_bill,
        bill_no: selectedBillForDetail?.bill_no,
      });
      if (!res.success) {
        Alert.alert('Receipt PDF', res.message || 'Failed to generate receipt PDF.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not generate receipt PDF.');
    } finally {
      setGeneratingReceiptId(null);
    }
  };

  const handleDialPhone = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  // Counts for quick filter tabs
  const dueCount = React.useMemo(
    () => creditList.filter((i) => i.pending_amount > 0).length,
    [creditList]
  );
  const clearedCount = React.useMemo(
    () => creditList.filter((i) => i.pending_amount <= 0).length,
    [creditList]
  );

  // Filtered party credit list
  const filteredCreditList = creditList.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.party_name.toLowerCase().includes(q) ||
      (item.party_phone && item.party_phone.includes(q));
    if (!matchesSearch) return false;
    if (creditFilter === 'due') return item.pending_amount > 0;
    if (creditFilter === 'cleared') return item.pending_amount <= 0;
    return true;
  });

  // Top header renderer
  const renderTopBar = (title: string, onBackPress: () => void, rightAction?: React.ReactNode) => (
    <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 14) }]}>
      <TouchableOpacity
        onPress={onBackPress}
        style={styles.backBtn}
        activeOpacity={0.7}
        accessibilityLabel="Go back"
      >
        <Feather name="arrow-left" size={20} color="#0E204E" />
      </TouchableOpacity>
      <Text style={styles.topBarTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightActionSlot}>{rightAction}</View>
    </View>
  );

  // -------------------------------------------------------------
  // 1. SCREEN 1: PARTY CREDIT LIST
  // -------------------------------------------------------------
  if (activeView === 'credit_list') {
    return (
      <View style={styles.rootWrapper}>
        <View style={styles.screenContainer}>
          {renderTopBar('Party Credit List', () => {
            if (onBack) onBack();
          })}

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 40 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshingList}
                onRefresh={handleRefreshList}
                colors={['#0047AB']}
                tintColor="#0047AB"
              />
            }
          >
            {/* 1. SEARCH BAR */}
            <View style={styles.searchBarContainer}>
              <Feather name="search" size={17} color="#5A6B87" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search party or phone number..."
                placeholderTextColor="#8E9CAE"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x-circle" size={16} color="#8E9EB5" />
                </TouchableOpacity>
              )}
            </View>

            {/* 2. SUMMARY STAT CARDS (TOTAL PURCHASES & PENDING DUE) */}
            <View style={styles.summaryBarRow}>
              <View style={styles.summaryStatCard}>
                <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialCommunityIcons name="receipt" size={16} color="#0047AB" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel} numberOfLines={1}>Total Purchases</Text>
                  <Text style={styles.statVal} numberOfLines={1} adjustsFontSizeToFit>
                    ₹{finalStockValue.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryStatCard}>
                <View style={[styles.statIconBadge, { backgroundColor: '#FEF2F2' }]}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={16} color="#DC2626" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel} numberOfLines={1}>Pending Credit</Text>
                  <Text style={[styles.statVal, { color: '#DC2626' }]} numberOfLines={1} adjustsFontSizeToFit>
                    ₹{finalPendingValue.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. SIMPLE FILTER TABS */}
            <View style={styles.filterPillsRow}>
              <TouchableOpacity
                style={[styles.filterChip, creditFilter === 'all' && styles.filterChipActive]}
                onPress={() => setCreditFilter('all')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, creditFilter === 'all' && styles.filterChipTextActive]}>
                  All ({creditList.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, creditFilter === 'due' && styles.filterChipActive]}
                onPress={() => setCreditFilter('due')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, creditFilter === 'due' && styles.filterChipTextActive]}>
                  Pending ({dueCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, creditFilter === 'cleared' && styles.filterChipActive]}
                onPress={() => setCreditFilter('cleared')}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, creditFilter === 'cleared' && styles.filterChipTextActive]}>
                  Cleared ({clearedCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* PARTY CARDS LIST */}
            {isLoadingList ? (
              <View style={styles.centerLoadingBox}>
                <ActivityIndicator size="large" color="#0047AB" />
                <Text style={styles.loadingText}>Fetching party credit records...</Text>
              </View>
            ) : filteredCreditList.length === 0 ? (
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIconCircle}>
                  <MaterialCommunityIcons name="check-all" size={36} color="#0047AB" />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No matching parties found' : 'No Party Credit Outstanding'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try searching with a different party name or phone number.'
                    : 'All purchase bills and supplier credit accounts are completely cleared.'}
                </Text>
              </View>
            ) : (
              filteredCreditList.map((item) => (
                <View key={String(item.purchase_party_id)} style={styles.partyCreditCard}>
                  {/* CARD HEADER: PARTY NAME + PHONE ACTION + STATUS BADGE */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.partyNameBox}>
                      <Text style={styles.partyNameText} numberOfLines={1}>
                        {item.party_name}
                      </Text>
                      {Boolean(item.party_phone) && (
                        <TouchableOpacity
                          style={styles.phonePill}
                          onPress={() => handleDialPhone(item.party_phone)}
                          activeOpacity={0.7}
                        >
                          <Feather name="phone-call" size={12} color="#0047AB" />
                          <Text style={styles.phoneText}>{item.party_phone}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.cardHeaderRight}>
                      {item.pending_amount > 0 ? (
                        <View style={styles.pendingDueBadge}>
                          <Text style={styles.pendingDueBadgeText}>
                            Due ₹{item.pending_amount.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.clearedBadge}>
                          <Feather name="check" size={11} color="#16A34A" />
                          <Text style={styles.clearedBadgeText}>Cleared</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* 3 METRIC TILES: TOTAL, PAID, PENDING */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel} numberOfLines={1}>Total</Text>
                      <Text style={styles.metricTotalVal} numberOfLines={1} adjustsFontSizeToFit>
                        ₹{item.total_amount.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel} numberOfLines={1}>Paid</Text>
                      <Text style={styles.metricPaidVal} numberOfLines={1} adjustsFontSizeToFit>
                        ₹{item.cash_amount.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={[styles.metricCol, styles.metricColPending]}>
                      <Text style={styles.metricLabelPending} numberOfLines={1}>Pending</Text>
                      <Text style={styles.metricPendingVal} numberOfLines={1} adjustsFontSizeToFit>
                        ₹{item.pending_amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* TWO PROMINENT ACTION BUTTONS */}
                  <View style={styles.partyCardActionsRow}>
                    <TouchableOpacity
                      style={styles.viewBillsActionBtn}
                      onPress={() => loadPartyBills(item)}
                      activeOpacity={0.8}
                    >
                      <Feather name="file-text" size={14} color="#0047AB" />
                      <Text style={styles.viewBillsActionBtnText}>Bills & History</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.settleActionBtn}
                      onPress={() => loadPartyBills(item)}
                      activeOpacity={0.85}
                    >
                      <Feather name="credit-card" size={14} color="#0E1128" />
                      <Text style={styles.settleActionBtnText}>Record Payment</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // 2. SCREEN 2: PARTY CREDIT ADJUSTMENT
  // -------------------------------------------------------------
  if (activeView === 'credit_adjustment') {
    return (
      <View style={styles.rootWrapper}>
        <View style={styles.screenContainer}>
          {renderTopBar('Record Payment', () => setActiveView('credit_list'))}

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 40 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* HERO PARTY SUMMARY CARD */}
            <View style={styles.adjustmentHeroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroPartyInfo}>
                  <Text style={styles.heroPartyTitle} numberOfLines={1}>
                    {selectedParty?.party_name}
                  </Text>
                  {Boolean(selectedParty?.party_phone) && (
                    <Text style={styles.heroPartyPhone}>{selectedParty?.party_phone}</Text>
                  )}
                </View>
                <View style={styles.heroPendingBadge}>
                  <Text style={styles.heroPendingBadgeLabel}>TOTAL PENDING</Text>
                  <Text style={styles.heroPendingBadgeVal} numberOfLines={1} adjustsFontSizeToFit>
                    ₹{(clientPendingAmt || selectedParty?.pending_amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* PAYMENT FORM CARD */}
            <View style={styles.formContainerCard}>
              <Text style={styles.formCardHeader}>Payment Information</Text>

              {/* RECEIVED AMOUNT INPUT */}
              <View style={styles.formFieldRow}>
                <Text style={styles.formFieldLabel}>
                  Payment / Received Amount (₹) <Text style={{ color: '#F87171' }}>*</Text>
                </Text>
                <View style={styles.inputWithIconBox}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="0.00"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={receivedAmount}
                    onChangeText={handleReceivedAmountChange}
                  />
                </View>

                {/* QUICK PRESET CHIPS */}
                <View style={styles.quickPresetRow}>
                  <TouchableOpacity
                    style={styles.quickPresetChip}
                    onPress={() => handleApplyPresetAmount('full')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickPresetText}>
                      Full Due (₹{(clientPendingAmt || selectedParty?.pending_amount || 0).toLocaleString('en-IN')})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickPresetChip}
                    onPress={() => handleApplyPresetAmount('half')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.quickPresetText}>50%</Text>
                  </TouchableOpacity>

                  {Boolean(receivedAmount) && (
                    <TouchableOpacity
                      style={[styles.quickPresetChip, { borderColor: 'rgba(248, 113, 113, 0.4)' }]}
                      onPress={() => handleApplyPresetAmount('clear')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.quickPresetText, { color: '#F87171' }]}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* PAYMENT MODE PILLS */}
              <View style={styles.formFieldRow}>
                <Text style={styles.formFieldLabel}>Payment Mode</Text>
                <View style={styles.paymentModePillsRow}>
                  {(['Cash', 'Cheque', 'Online'] as const).map((mode) => {
                    const active = paymentMode === mode;
                    return (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.modePillBtn, active && styles.modePillBtnActive]}
                        onPress={() => setPaymentMode(mode)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.modePillText, active && styles.modePillTextActive]}>
                          {mode}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* PAYMENT DATE */}
              <View style={styles.formFieldRow}>
                <Text style={styles.formFieldLabel}>Payment Date</Text>
                <View style={styles.dateDisplayPill}>
                  <TextInput
                    style={styles.dateDisplayText}
                    value={paymentDate}
                    onChangeText={setPaymentDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#8E9CAE"
                  />
                  <Feather name="calendar" size={17} color="#0047AB" />
                </View>
              </View>

              {/* REMARK */}
              <View style={styles.formFieldRow}>
                <Text style={styles.formFieldLabel}>Remark (Optional)</Text>
                <TextInput
                  style={styles.formTextInputStandalone}
                  placeholder="Notes, cheque no, transaction ref..."
                  placeholderTextColor="#8E9CAE"
                  value={remarkText}
                  onChangeText={setRemarkText}
                />
              </View>
            </View>

            {/* PENDING BILLS CARDS */}
            <View style={styles.sectionGuideRow}>
              <Text style={styles.sectionGuideTitle}>Outstanding Bills</Text>
              <Text style={styles.sectionGuideSub}>Optionally adjust amount per bill</Text>
            </View>

            {isLoadingBills ? (
              <View style={styles.centerLoadingBox}>
                <ActivityIndicator size="large" color="#0047AB" />
                <Text style={styles.loadingText}>Fetching pending purchase bills...</Text>
              </View>
            ) : partyBills.length === 0 ? (
              <View style={styles.partyAdjustmentCard}>
                <View style={styles.billHeaderRow}>
                  <Text style={styles.billNoText}>Opening Balance Credit</Text>
                </View>
                <Text style={styles.billPartyName}>{selectedParty?.party_name}</Text>
                <View style={styles.billMetricsRow}>
                  <View>
                    <Text style={styles.metricLabel}>Total</Text>
                    <Text style={styles.billTotalVal}>
                      ₹{(selectedParty?.total_amount ?? 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.metricLabel}>Paid</Text>
                    <Text style={styles.billPaidVal}>
                      ₹{(selectedParty?.cash_amount ?? 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.metricLabel}>Pending</Text>
                    <Text style={styles.billPendingVal}>
                      ₹{(selectedParty?.pending_amount ?? 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              partyBills.map((bill) => {
                const key = `${bill.unique_bill}_${bill.bill_no}`;
                const val = adjustAmounts[key] || '';

                return (
                  <View key={key} style={styles.partyAdjustmentCard}>
                    {/* TOP LINE: Bill No + Date + Eye Icon */}
                    <View style={styles.billHeaderRow}>
                      <View style={styles.billNoGroup}>
                        <Text style={styles.billNoText}>Bill No: {bill.bill_no}</Text>
                        <Text style={styles.billDateText}>{bill.bill_date}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.eyeBtn}
                        onPress={() =>
                          loadBillDetail(
                            bill.unique_bill,
                            bill.bill_no,
                            bill.purchase_party_id
                          )
                        }
                        activeOpacity={0.7}
                        accessibilityLabel="View Bill Detail"
                      >
                        <Ionicons name="eye-outline" size={18} color="#0047AB" />
                        <Text style={styles.eyeBtnText}>Details</Text>
                      </TouchableOpacity>
                    </View>

                    {/* METRICS ROW */}
                    <View style={styles.billMetricsRow}>
                      <View>
                        <Text style={styles.metricLabel}>Bill Total</Text>
                        <Text style={styles.billTotalVal}>
                          ₹{bill.total_amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.metricLabel}>Paid</Text>
                        <Text style={styles.billPaidVal}>
                          ₹{bill.paid_amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.metricLabel}>Due / Pending</Text>
                        <Text style={styles.billPendingVal}>
                          ₹{bill.pending_amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    {/* ADJUST INPUT ROW */}
                    <View style={styles.billAdjustRow}>
                      <Text style={styles.adjustInputLabel}>Adjust Towards This Bill:</Text>
                      <View style={styles.adjustInputWrapper}>
                        <Text style={styles.adjustRupee}>₹</Text>
                        <TextInput
                          style={styles.adjustTextInput}
                          placeholder={String(bill.pending_amount)}
                          placeholderTextColor="#8E9CAE"
                          keyboardType="numeric"
                          value={val}
                          onChangeText={(text) => handleAdjustPerBillChange(key, text)}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {/* ACTION BUTTONS ROW */}
            <View style={styles.formActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelFormBtn}
                onPress={() => setActiveView('credit_list')}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelFormBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitFormBtn, isSubmittingAdjustment && styles.btnDisabled]}
                onPress={handleSubmitAdjustment}
                disabled={isSubmittingAdjustment}
                activeOpacity={0.88}
              >
                {isSubmittingAdjustment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitFormBtnText}>Confirm & Record Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // 3. SCREEN 3: PURCHASE BILL DETAIL & RECEIPTS
  // -------------------------------------------------------------
  return (
    <View style={styles.rootWrapper}>
      <View style={styles.screenContainer}>
        {renderTopBar('Bill & Payment Receipts', () => setActiveView('credit_adjustment'))}

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isLoadingBillDetail ? (
            <View style={styles.centerLoadingBox}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loadingText}>Loading purchase bill & payment records...</Text>
            </View>
          ) : (
            <>
              {/* SECTION: PURCHASE BILL DETAIL */}
              <Text style={styles.sectionHeaderTitle}>Purchase Bill Items</Text>

              {billDetails.length === 0 ? (
                <View style={styles.billHeroCard}>
                  <Text style={styles.billHeroPartyName}>{selectedParty?.party_name}</Text>
                  <View style={styles.billHeroSubRow}>
                    <Text style={styles.billHeroSubLabel}>Billing Date</Text>
                    <Text style={styles.billHeroSubVal}>{paymentDate}</Text>
                  </View>
                  <View style={styles.billHeroMetricsRow}>
                    <Text style={styles.billHeroMetricTotal}>
                      Total ₹{(selectedParty?.total_amount ?? 0).toFixed(1)}
                    </Text>
                    <Text style={styles.billHeroMetricPaid}>
                      Paid ₹{(selectedParty?.cash_amount ?? 0).toFixed(1)}
                    </Text>
                    <Text style={styles.billHeroMetricPending}>
                      Pending ₹{(selectedParty?.pending_amount ?? 0).toFixed(1)}
                    </Text>
                  </View>
                </View>
              ) : (
                billDetails.map((b, idx) => (
                  <View key={idx} style={styles.billHeroCard}>
                    <Text style={styles.billHeroPartyName}>{b.party_name}</Text>
                    <View style={styles.billHeroSubRow}>
                      <Text style={styles.billHeroSubLabel}>Billing Date</Text>
                      <Text style={styles.billHeroSubVal}>{b.bill_date || b.txn_date}</Text>
                    </View>
                    <View style={styles.billHeroMetricsRow}>
                      <Text style={styles.billHeroMetricTotal}>Total ₹{b.total_amt.toFixed(1)}</Text>
                      <Text style={styles.billHeroMetricPaid}>Paid ₹{b.cash_amt.toFixed(1)}</Text>
                      <Text style={styles.billHeroMetricPending}>
                        Pending ₹{b.pending_amt.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                ))
              )}

              {/* SECTION: PAYMENT RECEIPT DETAIL */}
              <Text style={[styles.sectionHeaderTitle, { marginTop: 20 }]}>
                Payment Receipts History
              </Text>

              {receiptDetails.length === 0 ? (
                <View style={styles.emptyReceiptsCard}>
                  <Feather name="file-text" size={32} color="#626D92" />
                  <Text style={styles.emptyReceiptsTitle}>No Payment Receipts Found</Text>
                  <Text style={styles.emptyReceiptsSubtitle}>
                    Receipts generated upon payment adjustments will appear here.
                  </Text>
                </View>
              ) : (
                receiptDetails.map((receipt) => (
                  <View key={String(receipt.payment_id)} style={styles.receiptItemCard}>
                    {/* TOP LINE: MODE : DATE + RECEIPT ICON + TRASH ICON */}
                    <View style={styles.receiptTopLine}>
                      <View style={styles.receiptBadge}>
                        <Text style={styles.receiptBadgeText}>{receipt.payment_mode}</Text>
                      </View>
                      <Text style={styles.receiptDateText}>{receipt.payment_date}</Text>

                      <View style={styles.receiptIconsRight}>
                        <TouchableOpacity
                          style={styles.receiptPdfBtn}
                          onPress={() => handleGenerateReceiptPdf(receipt)}
                          disabled={generatingReceiptId === receipt.payment_id}
                          activeOpacity={0.7}
                          accessibilityLabel="Open Payment Receipt PDF"
                        >
                          {generatingReceiptId === receipt.payment_id ? (
                            <ActivityIndicator size="small" color="#0047AB" />
                          ) : (
                            <>
                              <Feather name="file-text" size={14} color="#0047AB" />
                              <Text style={styles.receiptPdfBtnText}>Receipt PDF</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.receiptTrashBtn}
                          onPress={() => handleDeleteReceipt(receipt)}
                          activeOpacity={0.7}
                          accessibilityLabel="Delete Receipt"
                        >
                          <Feather name="trash-2" size={17} color="#F87171" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* BOTTOM LINE: AMOUNT + DISCOUNT */}
                    <View style={styles.receiptBottomLine}>
                      <Text style={styles.receiptAmountVal}>
                        ₹{receipt.total_amount.toFixed(2)}
                      </Text>
                      {receipt.receive_disc_amt > 0 && (
                        <Text style={styles.receiptDiscVal}>
                          Discount: ₹{receipt.receive_disc_amt.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  screenContainer: {
    flex: 1,
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E204E',
    letterSpacing: -0.3,
    flex: 1,
    marginLeft: 12,
  },
  rightActionSlot: {
    minWidth: 38,
    alignItems: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '500',
    paddingVertical: 0,
  },
  summaryBarRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  summaryStatCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5A6B87',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
    marginTop: 2,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  filterChipActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  partyCreditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginBottom: 14,
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  partyNameBox: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  partyNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0047AB',
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  pendingDueBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingDueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  clearedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clearedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  metricCol: {
    flex: 1,
    minWidth: 0,
  },
  metricColPending: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
    marginBottom: 2,
  },
  metricLabelPending: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  metricTotalVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  metricPaidVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  metricPendingVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  partyCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  viewBillsActionBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    height: 42,
    borderRadius: 12,
  },
  viewBillsActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  settleActionBtn: {
    flex: 1.2,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0047AB',
    height: 42,
    borderRadius: 12,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  settleActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adjustmentHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    marginBottom: 14,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  heroPartyInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  heroPartyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
  },
  heroPartyPhone: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  heroPendingBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  heroPendingBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  heroPendingBadgeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 1,
  },
  quickPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  quickPresetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickPresetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0047AB',
  },
  formContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    marginBottom: 16,
    gap: 14,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  formCardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 2,
  },
  formFieldRow: {
    gap: 6,
  },
  formFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  inputWithIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0047AB',
  },
  formTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    paddingVertical: 0,
  },
  formTextInputStandalone: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0E204E',
  },
  paymentModePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modePillBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modePillBtnActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  modePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  modePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateDisplayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
  },
  dateDisplayText: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '600',
    paddingVertical: 0,
  },
  sectionGuideRow: {
    marginBottom: 10,
  },
  sectionGuideTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
  },
  sectionGuideSub: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  partyAdjustmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginBottom: 12,
    gap: 10,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  billHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billNoGroup: {
    flex: 1,
  },
  billNoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  billDateText: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  eyeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  eyeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0047AB',
  },
  billPartyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B87',
  },
  billMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  billTotalVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  billPaidVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  billPendingVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  billAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexWrap: 'wrap',
  },
  adjustInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
    flex: 1,
    minWidth: 110,
  },
  adjustInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 8,
    width: 105,
    gap: 4,
  },
  adjustRupee: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  adjustTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
    paddingVertical: 0,
  },
  formActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  cancelFormBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelFormBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B87',
  },
  submitFormBtn: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitFormBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 10,
  },
  billHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  billHeroPartyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
  },
  billHeroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billHeroSubLabel: {
    fontSize: 12,
    color: '#5A6B87',
  },
  billHeroSubVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E204E',
  },
  billHeroMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  billHeroMetricTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  billHeroMetricPaid: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  billHeroMetricPending: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyReceiptsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 30,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyReceiptsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    marginTop: 4,
  },
  emptyReceiptsSubtitle: {
    fontSize: 12,
    color: '#5A6B87',
    textAlign: 'center',
  },
  receiptItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 14,
    marginBottom: 10,
    gap: 10,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  receiptTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  receiptBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  receiptDateText: {
    fontSize: 12,
    color: '#5A6B87',
    flex: 1,
    marginLeft: 10,
  },
  receiptIconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  receiptPdfBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  receiptTrashBtn: {
    padding: 4,
  },
  receiptBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptAmountVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  receiptDiscVal: {
    fontSize: 12,
    color: '#5A6B87',
  },
  centerLoadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#5A6B87',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 18,
  },
});
