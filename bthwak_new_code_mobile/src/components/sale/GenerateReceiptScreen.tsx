import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  CreditReceiptItem,
  ReturnReceiptItem,
  RetailerOption,
  CreditPendingBillItem,
  fetchCreditReceiptListApi,
  submitCreditReceiptApi,
  submitAdvanceReceiptApi,
  fetchReturnReceiptDetailApi,
  submitReturnReceiptApi,
  fetchRetailerPartiesApi,
  fetchPartyCreditSummaryApi,
  submitCreditReceiptAdjustApi,
} from '@/api/receipt';
import { fetchBeatsApi, BeatOption } from '@/api/bulkRetailer';
import { CalendarPickerModal } from '@/components/common/CalendarPickerModal';

interface GenerateReceiptScreenProps {
  onBack?: () => void;
}

type TabType = 'Credit' | 'Advance' | 'Return';

export const GenerateReceiptScreen: React.FC<GenerateReceiptScreenProps> = ({ onBack }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('Credit');

  // Search & Filter State
  const [partySearch, setPartySearch] = useState('');
  const [beatSearch, setBeatSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  // Dropdown options
  const [partiesList, setPartiesList] = useState<RetailerOption[]>([]);
  const [beatsList, setBeatsList] = useState<BeatOption[]>([]);

  // -------------------------------------------------------------
  // TAB 1: CREDIT STATE
  // -------------------------------------------------------------
  const [creditRows, setCreditRows] = useState<CreditReceiptItem[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [isCreditLoading, setIsCreditLoading] = useState(false);
  const [isCreditRefreshing, setIsCreditRefreshing] = useState(false);

  // Receive Payment Modal (Single Bill)
  const [receiveTarget, setReceiveTarget] = useState<CreditReceiptItem | null>(null);
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('0');
  const [netAmount, setNetAmount] = useState('');
  const [creditRemark, setCreditRemark] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Cheque' | 'Online' | 'Both'>('Cash');
  const [isSubmittingCredit, setIsSubmittingCredit] = useState(false);

  // Multi-Bill Adjustment Modal (Screenshot 3)
  const [multiTarget, setMultiTarget] = useState<CreditReceiptItem | null>(null);
  const [multiPendingBills, setMultiPendingBills] = useState<CreditPendingBillItem[]>([]);
  const [isMultiBillsLoading, setIsMultiBillsLoading] = useState(false);
  const [multiReceiptDate, setMultiReceiptDate] = useState(new Date().toISOString());
  const [multiCalendarOpen, setMultiCalendarOpen] = useState(false);
  const [multiPaymentMode, setMultiPaymentMode] = useState<'Cash' | 'Cheque' | 'Online'>('Cash');
  const [multiTotalReceived, setMultiTotalReceived] = useState('');
  const [multiRemark, setMultiRemark] = useState('');
  const [billAdjustments, setBillAdjustments] = useState<{ [invoiceId: string]: string }>({});
  const [isSubmittingMulti, setIsSubmittingMulti] = useState(false);

  // -------------------------------------------------------------
  // TAB 2: ADVANCE STATE
  // -------------------------------------------------------------
  const [advanceParty, setAdvanceParty] = useState<RetailerOption | null>(null);
  const [advancePartyPickerOpen, setAdvancePartyPickerOpen] = useState(false);
  const [advancePartySearch, setAdvancePartySearch] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString());
  const [advanceCalendarOpen, setAdvanceCalendarOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceRemark, setAdvanceRemark] = useState('');
  const [advancePaymentMode, setAdvancePaymentMode] = useState<'Cash' | 'Cheque' | 'Online' | 'Both'>('Cash');
  const [isSubmittingAdvance, setIsSubmittingAdvance] = useState(false);

  // -------------------------------------------------------------
  // TAB 3: RETURN STATE
  // -------------------------------------------------------------
  const [returnItems, setReturnItems] = useState<ReturnReceiptItem[]>([]);
  const [isReturnLoading, setIsReturnLoading] = useState(false);
  const [isReturnRefreshing, setIsReturnRefreshing] = useState(false);

  // Return Modal Sheet (Matching Screenshot media_1793537064071_d3d66997)
  const [returnTarget, setReturnTarget] = useState<ReturnReceiptItem | null>(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString());
  const [returnCalendarOpen, setReturnCalendarOpen] = useState(false);
  const [returnRemark, setReturnRemark] = useState('');
  const [returnAdjustments, setReturnAdjustments] = useState<{
    [txnId: string]: { crate: string; bottle: string };
  }>({});
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Load Remote Reference Dropdowns
  useEffect(() => {
    fetchRetailerPartiesApi().then((p) => setPartiesList(p || []));
    fetchBeatsApi().then((b) => setBeatsList(b || []));
  }, []);

  // -------------------------------------------------------------
  // DATA LOADERS
  // -------------------------------------------------------------
  const loadCreditList = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsCreditRefreshing(true);
      else setIsCreditLoading(true);

      const res = await fetchCreditReceiptListApi({
        search: (partySearch || itemSearch).trim(),
        beat: beatSearch.trim() || undefined,
        limit: 100,
      });

      setCreditRows(res.rows || []);
      setTotalOutstanding(res.totalOutstanding || 0);
      setTotalPending(res.totalPending || 0);
    } catch (err: any) {
      console.warn('Failed to load credit list', err);
    } finally {
      setIsCreditLoading(false);
      setIsCreditRefreshing(false);
    }
  }, [partySearch, beatSearch, itemSearch]);

  const loadReturnList = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsReturnRefreshing(true);
      else setIsReturnLoading(true);

      const res = await fetchReturnReceiptDetailApi(0);
      setReturnItems(res.parties || []);
    } catch (err: any) {
      console.warn('Failed to load return receipt details', err);
    } finally {
      setIsReturnLoading(false);
      setIsReturnRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Credit') {
      loadCreditList();
    } else if (activeTab === 'Return') {
      loadReturnList();
    }
  }, [activeTab, loadCreditList, loadReturnList]);

  // Handle open receive modal
  const handleOpenReceive = (item: CreditReceiptItem) => {
    setReceiveTarget(item);
    setReceiptDate(new Date().toISOString());
    setDiscountAmount('0');
    setNetAmount(String(item.pendingAmount || 0));
    setCreditRemark('');
    setPaymentMode('Cash');
  };

  // Submit Credit Payment (Single Bill)
  const handleSubmitCreditPayment = async () => {
    if (!receiveTarget) return;

    const parsedNet = parseFloat(netAmount.trim()) || 0;
    const parsedDisc = parseFloat(discountAmount.trim()) || 0;

    if (parsedNet <= 0 && parsedDisc <= 0) {
      Alert.alert('Required', 'Please enter a valid amount or discount.');
      return;
    }

    try {
      setIsSubmittingCredit(true);
      const res = await submitCreditReceiptApi({
        partyId: receiveTarget.partyId,
        invoiceId: receiveTarget.invoiceId || 0,
        receiptDate: receiptDate.split('T')[0],
        totalAmount: parsedNet,
        discountAmount: parsedDisc,
        paymentMode,
        cashAmount: paymentMode === 'Cash' ? parsedNet : 0,
        remark: creditRemark.trim(),
      });

      Alert.alert('Success', res?.message || 'Payment received successfully!');
      setReceiveTarget(null);
      loadCreditList(true);
    } catch (err: any) {
      Alert.alert('Payment Failed', err?.message || 'Could not record payment.');
    } finally {
      setIsSubmittingCredit(false);
    }
  };

  // Open Multi-Bill Adjust Modal (Screenshot 3)
  const handleOpenMultiBill = async (item: CreditReceiptItem) => {
    setMultiTarget(item);
    setMultiReceiptDate(new Date().toISOString());
    setMultiPaymentMode('Cash');
    setMultiTotalReceived('');
    setMultiRemark('');
    setBillAdjustments({});
    setIsMultiBillsLoading(true);

    try {
      const res = await fetchPartyCreditSummaryApi(item.partyId);
      if (res.transactions && res.transactions.length > 0) {
        setMultiPendingBills(res.transactions);
      } else {
        setMultiPendingBills([
          {
            invoiceId: String(item.invoiceId || 'INV-1'),
            billNo: item.type === 'Business Opening' ? 'Business Opening' : `Bill #${item.invoiceId || '1'}`,
            transactionDate: item.billDate || item.transactionDate || new Date().toISOString().split('T')[0],
            finalAmount: item.totalAmount || 0,
            receivedAmount: (item.totalAmount || 0) - (item.pendingAmount || 0),
            pendingAmount: item.pendingAmount || 0,
            paymentStatus: item.paymentStatus || 'Pending',
          },
        ]);
      }
    } catch {
      setMultiPendingBills([
        {
          invoiceId: String(item.invoiceId || 'INV-1'),
          billNo: item.type === 'Business Opening' ? 'Business Opening' : `Bill #${item.invoiceId || '1'}`,
          transactionDate: item.billDate || item.transactionDate || new Date().toISOString().split('T')[0],
          finalAmount: item.totalAmount || 0,
          receivedAmount: (item.totalAmount || 0) - (item.pendingAmount || 0),
          pendingAmount: item.pendingAmount || 0,
          paymentStatus: item.paymentStatus || 'Pending',
        },
      ]);
    } finally {
      setIsMultiBillsLoading(false);
    }
  };

  const handleAdjustChange = (invoiceId: string, val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setBillAdjustments((prev) => ({
      ...prev,
      [invoiceId]: clean,
    }));
  };

  // Submit Multi-Bill Adjustment
  const handleSubmitMultiAdjust = async () => {
    if (!multiTarget) return;

    const totalRec = parseFloat(multiTotalReceived.trim()) || 0;
    if (totalRec <= 0) {
      Alert.alert('Required', 'Please enter Total Received Amount.');
      return;
    }

    const adjustments = Object.entries(billAdjustments)
      .map(([transactionId, amtStr]) => ({
        transactionId,
        adjustAmount: parseFloat(amtStr) || 0,
      }))
      .filter((a) => a.adjustAmount > 0);

    if (adjustments.length === 0) {
      Alert.alert('Required', 'Please enter an adjust amount for at least one pending bill.');
      return;
    }

    const sumAdjusted = adjustments.reduce((acc, a) => acc + a.adjustAmount, 0);
    if (sumAdjusted > totalRec) {
      Alert.alert('Invalid Amount', 'Total adjusted amount cannot exceed Total Received Amount.');
      return;
    }

    try {
      setIsSubmittingMulti(true);
      await submitCreditReceiptAdjustApi({
        partyId: multiTarget.partyId,
        receiptDate: multiReceiptDate.split('T')[0],
        paymentMode: multiPaymentMode,
        totalReceivedAmount: totalRec,
        remark: multiRemark.trim(),
        adjustments,
      });

      Alert.alert('Success', 'Credit receipt adjustment recorded successfully!');
      setMultiTarget(null);
      loadCreditList(true);
    } catch (err: any) {
      Alert.alert('Adjustment Failed', err?.message || 'Could not adjust credit receipt.');
    } finally {
      setIsSubmittingMulti(false);
    }
  };

  // Submit Advance Receipt
  const handleSubmitAdvance = async () => {
    const rawPid = Number(advanceParty?.partyId || (advanceParty as any)?.party_id || 0);
    if (!advanceParty || !rawPid || rawPid <= 0) {
      Alert.alert('Required', 'Please select a Party to receive advance.');
      return;
    }

    const parsedAmount = parseFloat(advanceAmount.trim()) || 0;
    if (parsedAmount <= 0) {
      Alert.alert('Required', 'Please enter a valid advance amount.');
      return;
    }

    try {
      setIsSubmittingAdvance(true);
      const res = await submitAdvanceReceiptApi({
        partyId: rawPid,
        receiptDate: advanceDate.split('T')[0],
        totalAmount: parsedAmount,
        paymentMode: advancePaymentMode,
        cashAmount: advancePaymentMode === 'Cash' ? parsedAmount : 0,
        remark: advanceRemark.trim(),
      });

      Alert.alert('Success', res?.message || 'Advance payment recorded successfully!');
      setAdvanceParty(null);
      setAdvanceAmount('');
      setAdvanceRemark('');
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Could not submit advance receipt.');
    } finally {
      setIsSubmittingAdvance(false);
    }
  };

  // Open Return Receipt Sheet (Screenshot media_1793537064071_d3d66997)
  const handleOpenReturn = (item: ReturnReceiptItem) => {
    setReturnTarget(item);
    setReturnDate(new Date().toISOString());
    setReturnRemark('');
    const initialAdjust: { [txnId: string]: { crate: string; bottle: string } } = {};
    if (item.transactions && item.transactions.length > 0) {
      item.transactions.forEach((t) => {
        initialAdjust[t.txnId] = { crate: '', bottle: '' };
      });
    } else {
      const defaultTxnId = `TXN-${item.partyId}`;
      initialAdjust[defaultTxnId] = { crate: '', bottle: '' };
    }
    setReturnAdjustments(initialAdjust);
  };

  // Derived Totals for Return Modal
  const returnTotals = useMemo(() => {
    let totalCrates = 0;
    let totalBottles = 0;
    Object.values(returnAdjustments).forEach((adj) => {
      totalCrates += parseInt(adj.crate || '0', 10) || 0;
      totalBottles += parseInt(adj.bottle || '0', 10) || 0;
    });
    return { totalCrates, totalBottles };
  }, [returnAdjustments]);

  // Derived Transactions for Return Modal
  const modalTransactions = useMemo(() => {
    if (!returnTarget) return [];
    if (returnTarget.transactions && returnTarget.transactions.length > 0) {
      return returnTarget.transactions;
    }
    // Fallback if party has pending crate/bottle without transaction breakdown
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${now.toLocaleString('en-GB', { month: 'short' })}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return [
      {
        txnId: `TXN-${returnTarget.partyId}`,
        billNo: `GO00${returnTarget.partyId}`,
        transactionDateTime: formattedDate,
        totalCrate: returnTarget.totalPendingCrate || 0,
        totalBottle: returnTarget.totalPendingBottle || 0,
        pendingCrate: returnTarget.totalPendingCrate || 0,
        pendingBottle: returnTarget.totalPendingBottle || 0,
      },
    ];
  }, [returnTarget]);

  // Submit Return Receipt
  const handleSubmitReturn = async () => {
    if (!returnTarget) return;

    if (returnTotals.totalCrates === 0 && returnTotals.totalBottles === 0) {
      Alert.alert('Required', 'Please enter at least 1 crate or bottle to return.');
      return;
    }

    try {
      setIsSubmittingReturn(true);
      const txnsPayload = Object.entries(returnAdjustments)
        .map(([txnId, adj]) => ({
          txnId,
          returnCrate: parseInt(adj.crate || '0', 10) || 0,
          returnBottle: parseInt(adj.bottle || '0', 10) || 0,
        }))
        .filter((t) => t.returnCrate > 0 || t.returnBottle > 0);

      const res = await submitReturnReceiptApi({
        partyId: returnTarget.partyId,
        returnDate: returnDate.split('T')[0],
        remark: returnRemark.trim(),
        totalReturnCrate: returnTotals.totalCrates,
        totalReturnBottle: returnTotals.totalBottles,
        transactions: txnsPayload.length > 0 ? txnsPayload : [
          {
            txnId: `TXN-${returnTarget.partyId}`,
            returnCrate: returnTotals.totalCrates,
            returnBottle: returnTotals.totalBottles,
          },
        ],
      });

      Alert.alert('Success', res?.message || 'Return receipt submitted successfully!');
      setReturnTarget(null);
      setReturnRemark('');
      setReturnAdjustments({});
      loadReturnList(true);
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message || 'Could not submit return receipt.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Filtered Advance Parties for picker
  const filteredAdvanceParties = useMemo(() => {
    if (!advancePartySearch.trim()) return partiesList;
    const q = advancePartySearch.trim().toLowerCase();
    return partiesList.filter((p) => p.partyName?.toLowerCase().includes(q));
  }, [partiesList, advancePartySearch]);

  // Formatted date string helper
  const formatDate = (isoString?: string): string => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Format currency
  const formatMoney = (val?: number): string => {
    const num = val || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Derived multi-bill summaries (Screenshot 3)
  const multiPendingSum = useMemo(() => {
    return multiPendingBills.reduce((acc, b) => acc + (b.pendingAmount || 0), 0) || multiTarget?.pendingAmount || 0;
  }, [multiPendingBills, multiTarget]);

  const multiReceivedNum = useMemo(() => {
    return parseFloat(multiTotalReceived) || 0;
  }, [multiTotalReceived]);

  const multiAdjustedSum = useMemo(() => {
    return Object.values(billAdjustments).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
  }, [billAdjustments]);

  const multiRemainingNum = useMemo(() => {
    return Math.max(0, multiPendingSum - multiAdjustedSum);
  }, [multiPendingSum, multiAdjustedSum]);

  // Client-side instant filters
  const filteredCreditRows = useMemo(() => {
    const qParty = partySearch.trim().toLowerCase();
    const qItem = itemSearch.trim().toLowerCase();
    const qBeat = beatSearch.trim().toLowerCase();

    return creditRows.filter((r) => {
      const matchParty =
        !qParty ||
        r.partyName.toLowerCase().includes(qParty) ||
        (r.phone && r.phone.includes(qParty));
      const matchItem = !qItem || r.partyName.toLowerCase().includes(qItem);
      return matchParty && matchItem;
    });
  }, [creditRows, partySearch, itemSearch, beatSearch]);

  const filteredReturnItems = useMemo(() => {
    const qParty = partySearch.trim().toLowerCase();
    const qItem = itemSearch.trim().toLowerCase();
    return returnItems.filter((r) => {
      const matchParty = !qParty || r.partyName.toLowerCase().includes(qParty);
      const matchItem = !qItem || r.partyName.toLowerCase().includes(qItem);
      return matchParty && matchItem;
    });
  }, [returnItems, partySearch, itemSearch]);

  // -------------------------------------------------------------
  // RENDER CARDS
  // -------------------------------------------------------------
  const renderCreditCard = ({ item }: { item: CreditReceiptItem }) => {
    const isMultiBill = Boolean((item.recordsCount && item.recordsCount > 1) || item.type === 'Credit');
    const isPending = (item.pendingAmount || 0) > 0;
    const initials = item.partyName?.charAt(0).toUpperCase() || 'P';

    if (isMultiBill) {
      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.88}
          onPress={() => handleOpenMultiBill(item)}
        >
          <View style={styles.cardTopRow}>
            <View style={[styles.avatarCircle, { backgroundColor: '#EDE9FE' }]}>
              <Text style={[styles.avatarText, { color: '#6366F1' }]}>{initials}</Text>
            </View>

            <View style={styles.cardMeta}>
              <Text style={styles.partyNameText} numberOfLines={1}>
                {item.partyName}
              </Text>
              {item.billDate || item.transactionDate ? (
                <Text style={styles.dateSubText}>
                  {item.billDate || item.transactionDate}
                </Text>
              ) : null}
            </View>
          </View>

          {/* 3 Metric Columns: Records | Outstanding | Pending (Screenshot 1 Bottom) */}
          <View style={styles.cardBottomRow}>
            <View style={[styles.amountsGroup, { flex: 1, justifyContent: 'space-between' }]}>
              <View style={styles.amountCol}>
                <Text style={styles.amountLabel}>Records</Text>
                <Text style={[styles.totalValue, { color: '#0E204E', fontSize: 16 }]}>
                  {item.recordsCount || 4}
                </Text>
              </View>

              <View style={styles.amountCol}>
                <Text style={styles.amountLabel}>Outstanding</Text>
                <Text style={[styles.totalValue, { color: '#D97706', fontSize: 16 }]}>
                  {formatMoney(item.totalAmount)}
                </Text>
              </View>

              <View style={styles.amountCol}>
                <Text style={styles.amountLabel}>Pending</Text>
                <Text style={[styles.pendingValue, { color: '#0047AB', fontSize: 16 }]}>
                  {formatMoney(item.pendingAmount)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.receiveBtn, { marginLeft: 10 }]}
              onPress={() => handleOpenMultiBill(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.receiveBtnText}>Receive</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.cardMeta}>
            <Text style={styles.partyNameText} numberOfLines={1}>
              {item.partyName} {item.phone ? `- ${item.phone}` : ''}
            </Text>
            {item.billDate || item.transactionDate ? (
              <Text style={styles.dateSubText}>
                {item.billDate || item.transactionDate}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Badges Row */}
        <View style={styles.badgesRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {item.type || 'Business Opening'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isPending ? styles.statusBadgePending : styles.statusBadgePaid,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isPending ? styles.statusBadgeTextPending : styles.statusBadgeTextPaid,
              ]}
            >
              {isPending ? 'Pending' : 'Completed'}
            </Text>
          </View>
        </View>

        {/* Financial & Receive Button Row */}
        <View style={styles.cardBottomRow}>
          <View style={styles.amountsGroup}>
            <View style={styles.amountCol}>
              <Text style={styles.amountLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{formatMoney(item.totalAmount)}</Text>
            </View>

            <View style={styles.amountCol}>
              <Text style={styles.amountLabel}>PENDING</Text>
              <Text style={styles.pendingValue}>
                {formatMoney(item.pendingAmount)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.receiveBtn}
            onPress={() => handleOpenReceive(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.receiveBtnText}>Receive</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderReturnCard = ({ item }: { item: ReturnReceiptItem }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.partyName?.charAt(0).toUpperCase() || 'R'}
            </Text>
          </View>
          <Text style={styles.partyNameText} numberOfLines={1}>
            {item.partyName}
          </Text>
        </View>

        {/* Crates & Bottles Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.crateBadge}>
            <Feather name="box" size={12} color="#16A34A" />
            <Text style={styles.crateBadgeText}>
              {item.totalPendingCrate || 0} Crates
            </Text>
          </View>

          <View style={styles.bottleBadge}>
            <Feather name="disc" size={12} color="#0047AB" />
            <Text style={styles.bottleBadgeText}>
              {item.totalPendingBottle || 0} Bottles
            </Text>
          </View>
        </View>

        {/* Return Button */}
        <TouchableOpacity
          style={styles.returnActionBtn}
          onPress={() => handleOpenReturn(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.returnActionBtnText}>Return</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (onBack) onBack();
            else router.back();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0E204E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Generate Receipt</Text>

        <View style={{ width: 38 }} />
      </View>

      {/* 2. Top Tabs: Credit | Advance | Return */}
      <View style={styles.tabsRow}>
        {(['Credit', 'Advance', 'Return'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabItemText, isActive && styles.tabItemTextActive]}>
                {tab}
              </Text>
              {isActive && <View style={styles.tabActiveBar} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: CREDIT VIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'Credit' && (
        <View style={styles.tabContentArea}>
          {/* Filters Row: Search Party & Search Beat */}
          <View style={styles.filtersTwoColRow}>
            <View style={[styles.searchBox, { flex: 1 }]}>
              <Feather name="search" size={14} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Party..."
                placeholderTextColor="#94A3B8"
                value={partySearch}
                onChangeText={setPartySearch}
              />
            </View>

            <View style={[styles.searchBox, { flex: 1 }]}>
              <Feather name="map-pin" size={14} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Beat..."
                placeholderTextColor="#94A3B8"
                value={beatSearch}
                onChangeText={setBeatSearch}
              />
            </View>
          </View>

          {/* Search items bar */}
          <View style={styles.searchItemsRow}>
            <View style={styles.searchBox}>
              <Feather name="search" size={14} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor="#94A3B8"
                value={itemSearch}
                onChangeText={setItemSearch}
              />
            </View>
          </View>

          {/* KPI Summary Bar */}
          <View style={styles.kpiSummaryBar}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>TOTAL OUTSTANDING</Text>
              <Text style={styles.kpiValueOutstanding}>
                {formatMoney(totalOutstanding)}
              </Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>TOTAL PENDING</Text>
              <Text style={styles.kpiValuePending}>
                {formatMoney(totalPending)}
              </Text>
            </View>
          </View>

          {/* Credit List */}
          {isCreditLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loadingText}>Loading credit receipts...</Text>
            </View>
          ) : filteredCreditRows.length === 0 ? (
            <View style={styles.centerContainer}>
              <Feather name="file-text" size={38} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Credit Records</Text>
              <Text style={styles.emptyDesc}>
                No pending credit records found for the current search filter.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCreditRows}
              keyExtractor={(item, idx) => `${item.partyId}_${item.invoiceId || idx}`}
              renderItem={renderCreditCard}
              contentContainerStyle={[
                styles.listContainer,
                { paddingBottom: Math.max(insets.bottom, 20) + 90 },
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isCreditRefreshing}
                  onRefresh={() => loadCreditList(true)}
                  tintColor="#0047AB"
                  colors={['#0047AB']}
                />
              }
            />
          )}
        </View>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ADVANCE VIEW (Screenshot 4) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'Advance' && (
        <ScrollView
          style={styles.tabContentArea}
          contentContainerStyle={[
            styles.advanceFormContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Party Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Party Name <Text style={styles.reqStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setAdvancePartyPickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dropdownInputText,
                    !advanceParty && { color: '#94A3B8', fontWeight: '500' },
                  ]}
                >
                  {advanceParty ? advanceParty.partyName : 'Search Party...'}
                </Text>
                <Feather name="chevron-down" size={16} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            {/* Receipt Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Receipt Date <Text style={styles.reqStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setAdvanceCalendarOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownInputText}>
                  {formatDate(advanceDate)}
                </Text>
                <Feather name="calendar" size={16} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            {/* Total Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Total Amount <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Total Amount"
                placeholderTextColor="#94A3B8"
                value={advanceAmount}
                onChangeText={(val) => setAdvanceAmount(val.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Remark */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Remark</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Remark"
                placeholderTextColor="#94A3B8"
                value={advanceRemark}
                onChangeText={setAdvanceRemark}
              />
            </View>

            {/* Payment Mode Pills */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Payment Mode</Text>
              <View style={styles.pillsRow}>
                {(['Cash', 'Cheque', 'Online', 'Both'] as const).map((m) => {
                  const isSelected = advancePaymentMode === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pillBtn, isSelected && styles.pillBtnActive]}
                      onPress={() => setAdvancePaymentMode(m)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.pillBtnText, isSelected && styles.pillBtnTextActive]}
                      >
                        {m === 'Both' ? 'Both' : m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.primarySubmitBtn,
                isSubmittingAdvance && styles.btnDisabled,
              ]}
              onPress={handleSubmitAdvance}
              disabled={isSubmittingAdvance}
              activeOpacity={0.85}
            >
              {isSubmittingAdvance ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="shopping-cart" size={16} color="#FFFFFF" />
                  <Text style={styles.primarySubmitText}>Submit</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: RETURN VIEW (Screenshot 5) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'Return' && (
        <View style={styles.tabContentArea}>
          {/* Filters */}
          <View style={styles.filtersTwoColRow}>
            <View style={[styles.searchBox, { flex: 1 }]}>
              <Feather name="search" size={14} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Party..."
                placeholderTextColor="#94A3B8"
                value={partySearch}
                onChangeText={setPartySearch}
              />
            </View>

            <View style={[styles.searchBox, { flex: 1 }]}>
              <Feather name="search" size={14} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="#94A3B8"
                value={itemSearch}
                onChangeText={setItemSearch}
              />
            </View>
          </View>

          {/* KPI Summary Bar for Return */}
          <View style={styles.kpiSummaryBar}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>PENDING CRATES</Text>
              <Text style={[styles.kpiValuePending, { color: '#16A34A' }]}>
                {returnItems.reduce((acc, r) => acc + (r.totalPendingCrate || 0), 0)} Crates
              </Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>PENDING BOTTLES</Text>
              <Text style={[styles.kpiValuePending, { color: '#0047AB' }]}>
                {returnItems.reduce((acc, r) => acc + (r.totalPendingBottle || 0), 0)} Bottles
              </Text>
            </View>
          </View>

          {isReturnLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loadingText}>Loading return records...</Text>
            </View>
          ) : filteredReturnItems.length === 0 ? (
            <View style={styles.centerContainer}>
              <Feather name="rotate-ccw" size={38} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Return Pending</Text>
              <Text style={styles.emptyDesc}>No crates or bottles return pending.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredReturnItems}
              keyExtractor={(item) => String(item.partyId)}
              renderItem={renderReturnCard}
              contentContainerStyle={[
                styles.listContainer,
                { paddingBottom: Math.max(insets.bottom, 20) + 90 },
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isReturnRefreshing}
                  onRefresh={() => loadReturnList(true)}
                  tintColor="#0047AB"
                  colors={['#0047AB']}
                />
              }
            />
          )}
        </View>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RECEIVE PAYMENT MODAL (Screenshot 2) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={Boolean(receiveTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setReceiveTarget(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setReceiveTarget(null)}
          />

          <View style={[styles.sheetCard, { maxHeight: '90%', paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.dragHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Receive Payment</Text>
              <TouchableOpacity
                onPress={() => setReceiveTarget(null)}
                style={styles.sheetCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 460 }}
              contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Party Highlight Box */}
              {receiveTarget && (
                <View style={styles.partyHighlightBox}>
                  <View style={styles.partyHighlightBar} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.highlightPartyLabel}>Party Name</Text>
                    <Text style={styles.highlightPartyName}>
                      {receiveTarget.partyName}{' '}
                      {receiveTarget.phone ? `- ${receiveTarget.phone}` : ''}
                    </Text>

                    <View style={styles.highlightMetaRow}>
                      <View>
                        <Text style={styles.highlightMetaLabel}>Bill Date</Text>
                        <Text style={styles.highlightMetaVal}>
                          {receiveTarget.billDate || '2026-10-28'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.highlightMetaLabel}>Pending (₹)</Text>
                        <Text style={styles.highlightMetaPending}>
                          {receiveTarget.pendingAmount}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Receipt Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Receipt Date</Text>
                <TouchableOpacity
                  style={styles.dropdownInput}
                  onPress={() => setCalendarOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownInputText}>{formatDate(receiptDate)}</Text>
                  <Feather name="calendar" size={16} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              {/* Discount Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Discount Amt.</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={discountAmount}
                  onChangeText={(val) => {
                    setDiscountAmount(val.replace(/[^0-9.]/g, ''));
                    const disc = parseFloat(val) || 0;
                    const maxP = receiveTarget?.pendingAmount || 0;
                    setNetAmount(String(Math.max(0, maxP - disc)));
                  }}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Net Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Net Amount</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={netAmount}
                  onChangeText={(val) => setNetAmount(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Remarks */}
              <View style={styles.formGroup}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter remark..."
                  placeholderTextColor="#94A3B8"
                  value={creditRemark}
                  onChangeText={setCreditRemark}
                />
              </View>

              {/* Payment Mode Pills */}
              <View style={styles.pillsRow}>
                {(['Cash', 'Cheque', 'Online', 'Both'] as const).map((m) => {
                  const isSelected = paymentMode === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pillBtn, isSelected && styles.pillBtnActive]}
                      onPress={() => setPaymentMode(m)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.pillBtnText, isSelected && styles.pillBtnTextActive]}
                      >
                        {m === 'Both' ? 'Both' : m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalFooterRow}>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setReceiveTarget(null)}
                  disabled={isSubmittingCredit}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSubmitBtn,
                    isSubmittingCredit && styles.btnDisabled,
                  ]}
                  onPress={handleSubmitCreditPayment}
                  disabled={isSubmittingCredit}
                >
                  {isSubmittingCredit ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MULTI-BILL ADJUSTMENT MODAL SHEET (Screenshot 3) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={Boolean(multiTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setMultiTarget(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setMultiTarget(null)}
          />

          <View style={[styles.sheetCard, { maxHeight: '90%', paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.dragHandle} />

            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setMultiTarget(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="arrow-back" size={20} color="#0E204E" />
                </TouchableOpacity>
                <Text style={styles.sheetTitle}>Generate Receipt</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMultiTarget(null)}
                style={styles.sheetCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Receipt Date Picker */}
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setMultiCalendarOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.datePickerBtnText}>{formatDate(multiReceiptDate)}</Text>
                <Feather name="calendar" size={16} color="#0047AB" />
              </TouchableOpacity>

              {/* Payment Mode Pills (Cash, Cheque, Online) */}
              <View style={styles.pillsRow}>
                {(['Cash', 'Cheque', 'Online'] as const).map((m) => {
                  const isSelected = multiPaymentMode === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.pillBtn, isSelected && styles.pillBtnActive]}
                      onPress={() => setMultiPaymentMode(m)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pillBtnText, isSelected && styles.pillBtnTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Total Received Amount Input */}
              <View style={styles.formGroup}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Total Received Amount"
                  placeholderTextColor="#94A3B8"
                  value={multiTotalReceived}
                  onChangeText={(val) => setMultiTotalReceived(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Remark Input */}
              <View style={styles.formGroup}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Remark"
                  placeholderTextColor="#94A3B8"
                  value={multiRemark}
                  onChangeText={setMultiRemark}
                />
              </View>

              {/* Section Header: Pending Bills */}
              <Text style={styles.pendingBillsSectionTitle}>Pending Bills</Text>

              {/* Pending Bills List */}
              {isMultiBillsLoading ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0047AB" />
                  <Text style={{ fontSize: 13, color: '#5A6B87', marginTop: 8 }}>
                    Loading pending bills...
                  </Text>
                </View>
              ) : multiPendingBills.length === 0 ? (
                <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#5A6B87' }}>No pending bills found.</Text>
                </View>
              ) : (
                multiPendingBills.map((bill, bIdx) => {
                  const isPartial = bill.paymentStatus?.toLowerCase().includes('partial');
                  return (
                    <View key={bill.invoiceId || bIdx} style={styles.pendingBillCard}>
                      <View style={styles.billCardRow1}>
                        <Text style={styles.billNoText}>
                          Bill No: <Text style={styles.billNoHighlight}>{bill.billNo || bill.invoiceId}</Text>
                        </Text>
                        <Text style={styles.billPendingAmount}>₹{bill.pendingAmount}</Text>
                      </View>

                      <View style={styles.billCardRow2}>
                        <Text style={styles.billDateText}>{bill.transactionDate}</Text>
                        <View
                          style={[
                            styles.billStatusBadge,
                            isPartial ? styles.badgePartial : styles.badgePending,
                          ]}
                        >
                          <Text
                            style={[
                              styles.billStatusBadgeText,
                              isPartial ? styles.badgeTextPartial : styles.badgeTextPending,
                            ]}
                          >
                            {bill.paymentStatus || 'Pending'}
                          </Text>
                        </View>
                      </View>

                      <View style={{ marginTop: 6 }}>
                        <TextInput
                          style={styles.billAdjustInput}
                          placeholder="Adjust Amount"
                          placeholderTextColor="#94A3B8"
                          keyboardType="decimal-pad"
                          value={billAdjustments[bill.invoiceId] || ''}
                          onChangeText={(val) => handleAdjustChange(bill.invoiceId, val)}
                        />
                      </View>
                    </View>
                  );
                })
              )}

              {/* Summary Box (Screenshot 3) */}
              <View style={styles.multiSummaryBox}>
                <View style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemLabel}>Pending</Text>
                  <Text style={styles.summaryItemVal}>₹{multiPendingSum}</Text>
                </View>
                <View style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemLabel}>Received</Text>
                  <Text style={styles.summaryItemVal}>₹{multiReceivedNum}</Text>
                </View>
                <View style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemLabel}>Adjusted</Text>
                  <Text style={styles.summaryItemVal}>₹{multiAdjustedSum}</Text>
                </View>
                <View
                  style={[
                    styles.summaryItemRow,
                    {
                      marginTop: 4,
                      paddingTop: 6,
                      borderTopWidth: 1,
                      borderTopColor: '#DFE7F2',
                    },
                  ]}
                >
                  <Text style={[styles.summaryItemLabel, { fontWeight: '700', color: '#0E204E' }]}>
                    Remaining
                  </Text>
                  <Text style={[styles.summaryItemVal, { fontWeight: '800', color: '#EF4444' }]}>
                    ₹{multiRemainingNum.toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* Modal Action Buttons */}
              <View style={styles.modalFooterRow}>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setMultiTarget(null)}
                  disabled={isSubmittingMulti}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSubmitBtn,
                    isSubmittingMulti && styles.btnDisabled,
                  ]}
                  onPress={handleSubmitMultiAdjust}
                  disabled={isSubmittingMulti}
                >
                  {isSubmittingMulti ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* RETURN MODAL SHEET (Matching media_1793537064071_d3d66997) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={Boolean(returnTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setReturnTarget(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setReturnTarget(null)}
          />

          <View style={[styles.sheetCard, { maxHeight: '88%', paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.dragHandle} />

            {/* Header: Return Receipt + party name */}
            <View style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.sheetTitle}>Return Receipt</Text>
                <TouchableOpacity
                  onPress={() => setReturnTarget(null)}
                  style={styles.sheetCloseBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={18} color="#5A6B87" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#5A6B87', marginTop: 2 }}>
                {returnTarget?.partyName}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Transactions List */}
              {modalTransactions.map((txn, index) => {
                const adj = returnAdjustments[txn.txnId] || { crate: '', bottle: '' };
                return (
                  <View key={txn.txnId || index} style={styles.returnTxnCard}>
                    {/* Bill number & DateTime */}
                    <View style={styles.returnTxnTopRow}>
                      <Text style={styles.returnBillNoText}>{txn.billNo || `TXN #${txn.txnId}`}</Text>
                      <Text style={styles.returnTxnDateText}>{txn.transactionDateTime}</Text>
                    </View>

                    {/* Pending Badges Row */}
                    <View style={styles.returnBadgesRow}>
                      <View style={styles.returnCratePill}>
                        <Feather name="box" size={14} color="#16A34A" />
                        <Text style={styles.returnCratePillText} numberOfLines={1}>
                          {txn.pendingCrate ?? 0} Crates
                        </Text>
                      </View>

                      <View style={styles.returnBottlePill}>
                        <Ionicons name="wine-outline" size={14} color="#0047AB" />
                        <Text style={styles.returnBottlePillText} numberOfLines={1}>
                          {txn.pendingBottle ?? 0} Bottles
                        </Text>
                      </View>
                    </View>

                    {/* Inputs Row: Crates and Bottles */}
                    <View style={styles.returnInputsRow}>
                      <View style={{ flex: 1 }}>
                        <TextInput
                          style={styles.returnNumberInput}
                          placeholder="Crates"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={adj.crate}
                          onChangeText={(val) => {
                            const clean = val.replace(/[^0-9]/g, '');
                            setReturnAdjustments((prev) => ({
                              ...prev,
                              [txn.txnId]: {
                                ...(prev[txn.txnId] || { bottle: '' }),
                                crate: clean,
                              },
                            }));
                          }}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <TextInput
                          style={styles.returnNumberInput}
                          placeholder="Bottles"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={adj.bottle}
                          onChangeText={(val) => {
                            const clean = val.replace(/[^0-9]/g, '');
                            setReturnAdjustments((prev) => ({
                              ...prev,
                              [txn.txnId]: {
                                ...(prev[txn.txnId] || { crate: '' }),
                                bottle: clean,
                              },
                            }));
                          }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* Remark Input */}
              <View style={styles.formGroup}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Remark"
                  placeholderTextColor="#94A3B8"
                  value={returnRemark}
                  onChangeText={setReturnRemark}
                />
              </View>

              {/* Date Pill + Totals Row (Matching Screenshot media_1793537064071_d3d66997) */}
              <View style={styles.returnTotalsRow}>
                {/* Date Pill */}
                <TouchableOpacity
                  style={styles.returnDatePill}
                  onPress={() => setReturnCalendarOpen(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="calendar" size={14} color="#FFFFFF" />
                  <Text style={styles.returnDatePillText}>{formatDate(returnDate)}</Text>
                </TouchableOpacity>

                {/* Totals */}
                <View style={styles.returnTotalsCol}>
                  <View style={styles.returnTotalLine}>
                    <Text style={styles.returnTotalLabel}>Total Crates</Text>
                    <Text style={styles.returnTotalValue}>{returnTotals.totalCrates}</Text>
                  </View>
                  <View style={styles.returnTotalLine}>
                    <Text style={styles.returnTotalLabel}>Total Bottles</Text>
                    <Text style={styles.returnTotalValue}>{returnTotals.totalBottles}</Text>
                  </View>
                </View>
              </View>

              {/* Submit Return Button */}
              <TouchableOpacity
                style={[
                  styles.submitReturnBtn,
                  isSubmittingReturn && styles.btnDisabled,
                ]}
                onPress={handleSubmitReturn}
                disabled={isSubmittingReturn}
                activeOpacity={0.85}
              >
                {isSubmittingReturn ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitReturnBtnText}>Submit Return</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Advance Party Selector Modal */}
      <Modal
        visible={advancePartyPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAdvancePartyPickerOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setAdvancePartyPickerOpen(false)}
          />
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Party</Text>
              <TouchableOpacity onPress={() => setAdvancePartyPickerOpen(false)}>
                <Feather name="x" size={20} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerSearchBox}>
              <Feather name="search" size={15} color="#94A3B8" />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search party..."
                placeholderTextColor="#94A3B8"
                value={advancePartySearch}
                onChangeText={setAdvancePartySearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 300 }} keyboardShouldPersistTaps="handled">
              {filteredAdvanceParties.map((p) => {
                const isSelected = advanceParty?.partyId === p.partyId;
                return (
                  <TouchableOpacity
                    key={p.partyId}
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => {
                      setAdvanceParty(p);
                      setAdvancePartyPickerOpen(false);
                      setAdvancePartySearch('');
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextActive,
                      ]}
                    >
                      {p.partyName}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Modals */}
      <CalendarPickerModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={receiptDate}
        onSelectDate={(ymd) => {
          setReceiptDate(new Date(ymd).toISOString());
        }}
        maxDate={new Date()}
        title="Select Receipt Date"
      />

      <CalendarPickerModal
        visible={advanceCalendarOpen}
        onClose={() => setAdvanceCalendarOpen(false)}
        selectedDate={advanceDate}
        onSelectDate={(ymd) => {
          setAdvanceDate(new Date(ymd).toISOString());
        }}
        maxDate={new Date()}
        title="Select Receipt Date"
      />

      <CalendarPickerModal
        visible={multiCalendarOpen}
        onClose={() => setMultiCalendarOpen(false)}
        selectedDate={multiReceiptDate}
        onSelectDate={(ymd) => {
          setMultiReceiptDate(new Date(ymd).toISOString());
        }}
        maxDate={new Date()}
        title="Select Receipt Date"
      />

      <CalendarPickerModal
        visible={returnCalendarOpen}
        onClose={() => setReturnCalendarOpen(false)}
        selectedDate={returnDate}
        onSelectDate={(ymd) => {
          setReturnDate(new Date(ymd).toISOString());
        }}
        maxDate={new Date()}
        title="Select Return Date"
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabItemActive: {},
  tabItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
  tabItemTextActive: {
    color: '#0047AB',
  },
  tabActiveBar: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '60%',
    backgroundColor: '#0047AB',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tabContentArea: {
    flex: 1,
  },
  filtersTwoColRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchItemsRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  kpiSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingVertical: 10,
    paddingHorizontal: 14,
    elevation: 1,
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#DFE7F2',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5A6B87',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  kpiValueOutstanding: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
  },
  kpiValuePending: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0047AB',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 14,
    elevation: 2,
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0047AB',
  },
  cardMeta: {
    flex: 1,
    gap: 2,
  },
  partyNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
  },
  dateSubText: {
    fontSize: 11,
    color: '#5A6B87',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgePending: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBadgePaid: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextPending: {
    color: '#DC2626',
  },
  statusBadgeTextPaid: {
    color: '#059669',
  },
  crateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  crateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  bottleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bottleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  amountsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  amountCol: {
    gap: 2,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5A6B87',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
  },
  pendingValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  receiveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0047AB',
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  receiveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  returnActionBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  returnActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 18,
  },
  advanceFormContent: {
    padding: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  reqStar: {
    color: '#DC2626',
    fontWeight: '800',
  },
  dropdownInput: {
    height: 46,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownInputText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
    flex: 1,
  },
  textInput: {
    height: 46,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0E204E',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillBtnActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  pillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6B87',
  },
  pillBtnTextActive: {
    color: '#FFFFFF',
  },
  primarySubmitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  primarySubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingHorizontal: 20,
    elevation: 24,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    gap: 12,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E204E',
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partyHighlightBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 12,
    gap: 10,
  },
  partyHighlightBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#0047AB',
  },
  highlightPartyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
  },
  highlightPartyName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
  },
  highlightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  highlightMetaLabel: {
    fontSize: 11,
    color: '#5A6B87',
  },
  highlightMetaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  highlightMetaPending: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCloseBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
  modalSubmitBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    elevation: 16,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  pickerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 8,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  pickerItemTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
  // Multi-Bill Adjust Styles (Screenshot 3)
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 16,
    height: 48,
  },
  datePickerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  pendingBillsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
    marginTop: 6,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  pendingBillCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 14,
    gap: 8,
  },
  billCardRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billNoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B87',
  },
  billNoHighlight: {
    fontWeight: '700',
    color: '#0E204E',
  },
  billPendingAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  billCardRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billDateText: {
    fontSize: 13,
    color: '#5A6B87',
  },
  billStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgePartial: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgePending: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  billStatusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextPartial: {
    color: '#B45309',
  },
  badgeTextPending: {
    color: '#DC2626',
  },
  billAdjustInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  multiSummaryBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B87',
  },
  summaryItemVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  // Return Receipt Modal Styles (Screenshot media_1793537064071_d3d66997)
  returnTxnCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 12,
  },
  returnTxnTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  returnBillNoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: 0.3,
  },
  returnTxnDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
  },
  returnBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  returnCratePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  returnCratePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  returnBottlePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  returnBottlePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  returnInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  returnNumberInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  returnTotalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  returnDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0047AB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  returnDatePillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  returnTotalsCol: {
    gap: 4,
    minWidth: 140,
  },
  returnTotalLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  returnTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  returnTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E204E',
  },
  submitReturnBtn: {
    backgroundColor: '#0047AB',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitReturnBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
