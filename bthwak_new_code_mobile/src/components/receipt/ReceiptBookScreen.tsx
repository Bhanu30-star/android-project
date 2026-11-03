import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '@/theme';
import {
  fetchReceiptBookApi,
  cancelReceiptVoucherApi,
  ReceiptBookItem,
  ReceiptBookFilters,
} from '@/api/receipt';
import { formatIndianCurrency, formatIndianNumber } from '@/utils/formatters';
import {
  DateRangePickerModal,
  DatePresetKey,
  formatDateToIso,
  formatReadableDate,
} from '@/components/common/DateRangePickerModal';

type TabType = 'credit' | 'money' | 'other';

export const ReceiptBookScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);

  // Active Tab: credit | money | other
  const [activeTab, setActiveTab] = useState<TabType>('credit');

  // Dates state
  const [datePreset, setDatePreset] = useState<DatePresetKey>('last_30_days');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateToIso(d);
  });
  const [toDate, setToDate] = useState(() => formatDateToIso(new Date()));

  // Search & Mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('All');

  // Modals state
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [actionSheetReceipt, setActionSheetReceipt] = useState<ReceiptBookItem | null>(null);
  const [selectedReceiptForSlip, setSelectedReceiptForSlip] = useState<ReceiptBookItem | null>(null);
  const [receiptToCancel, setReceiptToCancel] = useState<ReceiptBookItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Data state
  const [records, setRecords] = useState<ReceiptBookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const getSearchType = (tab: TabType): ReceiptBookFilters['search_type'] => {
    switch (tab) {
      case 'money':
        return 'money_book';
      case 'other':
        return 'other_book';
      case 'credit':
      default:
        return 'credit_book';
    }
  };

  // Load receipts data from API
  const loadReceipts = useCallback(
    async (isPull = false) => {
      if (isPull) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const res = await fetchReceiptBookApi({
          search_type: getSearchType(activeTab),
          party_phone: searchQuery.trim(),
          from_date: fromDate,
          to_date: toDate,
          page: 1,
          limit: 100,
        });
        setRecords(res.data || []);
      } catch (err: any) {
        setRecords([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeTab, searchQuery, fromDate, toDate]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      loadReceipts();
    }, 250);
    return () => clearTimeout(t);
  }, [loadReceipts]);

  const getDateLabel = () => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'last_7_days') return '7 Days';
    if (datePreset === 'this_month') return 'This Month';
    if (datePreset === 'last_30_days') return '30 Days';
    if (datePreset === 'this_year') return 'FY Year';
    return `${fromDate.slice(5)} - ${toDate.slice(5)}`;
  };

  // Filtered list
  const filteredRecords = useMemo(() => {
    let result = records;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.party_name.toLowerCase().includes(q) ||
          r.receipt_no.toLowerCase().includes(q) ||
          (r.party_phone && r.party_phone.includes(q)) ||
          r.party_bill_number.toLowerCase().includes(q)
      );
    }
    if (selectedModeFilter !== 'All') {
      result = result.filter(
        (r) => r.payment_mode.toLowerCase() === selectedModeFilter.toLowerCase()
      );
    }
    return result;
  }, [records, searchQuery, selectedModeFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCount = filteredRecords.length;
    let totalAmt = 0;
    let cashAmt = 0;
    let onlineBankAmt = 0;

    filteredRecords.forEach((r) => {
      const amt = Number(r.total_amt || 0);
      totalAmt += amt;
      const mode = (r.payment_mode || '').toLowerCase();
      if (mode.includes('cash')) {
        cashAmt += amt;
      } else {
        onlineBankAmt += amt;
      }
    });

    return { totalCount, totalAmt, cashAmt, onlineBankAmt };
  }, [filteredRecords]);

  // Scroll to top
  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Handle Cancel receipt
  const handleConfirmCancel = async () => {
    if (!receiptToCancel) return;
    setIsCancelling(true);
    try {
      const type = activeTab === 'other' ? 'other' : 'credit';
      const res = await cancelReceiptVoucherApi(receiptToCancel.receipt_id, type);
      Alert.alert('Receipt Cancelled', res.message || 'Receipt has been voided successfully.');
      setReceiptToCancel(null);
      loadReceipts();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to cancel receipt');
    } finally {
      setIsCancelling(false);
    }
  };

  // Share receipt details via WhatsApp
  const handleShareReceipt = async (item: ReceiptBookItem) => {
    const shareText =
      `*BTHAWK PAYMENT RECEIPT* 🧾\n` +
      `--------------------------------\n` +
      `*Receipt No:* ${item.receipt_no}\n` +
      `*Party Name:* ${item.party_name}\n` +
      (item.party_phone ? `*Phone:* ${item.party_phone}\n` : '') +
      `*Bill Ref:* ${item.party_bill_number || '-'}\n` +
      `*Receipt Date:* ${item.receipt_date} ${item.receipt_time || ''}\n` +
      `*Payment Mode:* ${item.payment_mode}\n` +
      `*Deposit Bank:* ${item.deposit_bank || 'Cash Till'}\n` +
      `*Amount Received:* ${formatIndianCurrency(item.total_amt)}\n` +
      (item.remark ? `*Remark:* ${item.remark}\n` : '') +
      `--------------------------------\n` +
      `Collected By: ${item.sales_exec_name || 'Staff'}\n` +
      `Generated securely via BTHAWK ERP.`;

    try {
      await Share.share({
        message: shareText,
        title: `Receipt ${item.receipt_no}`,
      });
    } catch {}
  };

  // Direct Phone Dial
  const handleCallParty = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No contact number available for this party.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  // Mode badge styles
  const getModeBadge = (mode: string) => {
    const m = mode.toLowerCase();
    if (m === 'cash') {
      return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', icon: 'cash-outline' };
    }
    if (m === 'cheque') {
      return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', icon: 'newspaper-outline' };
    }
    if (m === 'online' || m === 'upi') {
      return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', icon: 'phone-portrait-outline' };
    }
    return { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE', icon: 'card-outline' };
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER BAR WITH TOP RIGHT DATE FILTER BUTTON */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/dashboard');
              }
            }}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#0E204E" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Receipt Book</Text>
            <Text style={styles.headerSubtitle}>Vouchers, settlements & receipts</Text>
          </View>
        </View>

        {/* TOP RIGHT ACTIONS */}
        <View style={styles.headerActions}>
          {/* TOP RIGHT DATE FILTER BUTTON */}
          <TouchableOpacity
            style={styles.topRightDateBtn}
            onPress={() => setIsDateModalOpen(true)}
            activeOpacity={0.8}
          >
            <Feather name="calendar" size={13} color="#0047AB" />
            <Text style={styles.topRightDateBtnText} numberOfLines={1}>
              {getDateLabel()}
            </Text>
            <Feather name="chevron-down" size={12} color="#0047AB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newReceiptBtn}
            onPress={() => router.push('/generate-receipt')}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.newReceiptBtnText}>New</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => loadReceipts(true)}
            activeOpacity={0.7}
          >
            <Feather name="rotate-cw" size={16} color="#0E204E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. THREE-TAB SELECTOR (CREDIT / MONEY / OTHER) */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'credit' && styles.tabButtonActive]}
          onPress={() => setActiveTab('credit')}
          activeOpacity={0.8}
        >
          <Feather
            name="credit-card"
            size={13}
            color={activeTab === 'credit' ? '#FFFFFF' : '#5A6B87'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'credit' && styles.tabTextActive]}>
            Credit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'money' && styles.tabButtonActive]}
          onPress={() => setActiveTab('money')}
          activeOpacity={0.8}
        >
          <Feather
            name="dollar-sign"
            size={13}
            color={activeTab === 'money' ? '#FFFFFF' : '#5A6B87'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'money' && styles.tabTextActive]}>
            Money
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'other' && styles.tabButtonActive]}
          onPress={() => setActiveTab('other')}
          activeOpacity={0.8}
        >
          <Feather
            name="layers"
            size={13}
            color={activeTab === 'other' ? '#FFFFFF' : '#5A6B87'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'other' && styles.tabTextActive]}>
            Other
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. FULL-WIDTH SEARCH & PAYMENT MODE CHIPS */}
      <View style={styles.searchBarSection}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#8FA0B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search party, bill, phone, receipt no..."
            placeholderTextColor="#8FA0B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x-circle" size={15} color="#8FA0B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* PAYMENT MODE FILTER CHIPS */}
        <View style={styles.modeFilterRow}>
          {['All', 'Cash', 'Online', 'Cheque'].map((mode) => {
            const isSelected = selectedModeFilter === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.modePill, isSelected && styles.modePillActive]}
                onPress={() => setSelectedModeFilter(mode)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modePillText, isSelected && styles.modePillTextActive]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. SUMMARY METRIC STRIP */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Receipts</Text>
          <Text style={styles.summaryValue}>{stats.totalCount}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Cash Collected</Text>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>
            {formatIndianCurrency(stats.cashAmt)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Collection</Text>
          <Text style={[styles.summaryValue, { color: '#0047AB' }]}>
            {formatIndianCurrency(stats.totalAmt)}
          </Text>
        </View>
      </View>

      {/* 5. MAIN LIST SCROLLVIEW */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadReceipts(true)}
            colors={['#0047AB']}
            tintColor="#0047AB"
          />
        }
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          setShowScrollTop(y > 350);
        }}
        scrollEventThrottle={16}
      >
        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#0047AB" />
            <Text style={styles.loaderText}>Loading receipts register...</Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="book-open" size={32} color="#8FA0B8" />
            </View>
            <Text style={styles.emptyTitle}>No Receipts Found</Text>
            <Text style={styles.emptyDesc}>
              No receipt records found for this period and filter criteria.
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedModeFilter('All');
                setDatePreset('last_30_days');
                const now = new Date();
                const m = new Date();
                m.setDate(m.getDate() - 30);
                setFromDate(formatDateToIso(m));
                setToDate(formatDateToIso(now));
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.resetFilterBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredRecords.map((item) => {
            const modeBadge = getModeBadge(item.payment_mode);
            return (
              <TouchableOpacity
                key={`${item.receipt_id}-${item.receipt_no}`}
                style={styles.receiptCard}
                activeOpacity={0.9}
                onPress={() => setActionSheetReceipt(item)}
              >
                {/* CARD ROW 1: RECEIPT NUMBER + MODE BADGE + 3-DOT KEBAB MENU */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.receiptNoWrap}>
                    <Ionicons name="receipt-outline" size={15} color="#0047AB" style={{ marginRight: 6 }} />
                    <Text style={styles.receiptNo}>{item.receipt_no}</Text>
                  </View>

                  <View style={styles.cardHeaderRight}>
                    <View
                      style={[
                        styles.modeBadge,
                        { backgroundColor: modeBadge.bg, borderColor: modeBadge.border },
                      ]}
                    >
                      <Ionicons
                        name={modeBadge.icon as any}
                        size={11}
                        color={modeBadge.text}
                        style={{ marginRight: 3 }}
                      />
                      <Text style={[styles.modeBadgeText, { color: modeBadge.text }]}>
                        {item.payment_mode}
                      </Text>
                    </View>

                    {/* 3-DOT KEBAB ACTION BUTTON */}
                    <TouchableOpacity
                      style={styles.kebabBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setActionSheetReceipt(item);
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      activeOpacity={0.7}
                    >
                      <Feather name="more-vertical" size={18} color="#5A6B87" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* CARD ROW 2: PARTY NAME & TOTAL AMOUNT */}
                <View style={styles.partyRow}>
                  <View style={styles.partyInfo}>
                    <Text style={styles.partyName} numberOfLines={1}>
                      {item.party_name}
                    </Text>
                    {item.party_phone ? (
                      <View style={styles.phoneRow}>
                        <Feather name="phone" size={11} color="#5A6B87" style={{ marginRight: 4 }} />
                        <Text style={styles.phoneText}>{item.party_phone}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.amountCol}>
                    <Text style={styles.totalAmountText}>
                      {formatIndianCurrency(item.total_amt)}
                    </Text>
                    <Text style={styles.amountSubLabel}>Received</Text>
                  </View>
                </View>

                {/* CARD ROW 3: BILL DETAILS & TIMESTAMPS */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Bill Ref No</Text>
                    <Text style={styles.detailVal} numberOfLines={1}>
                      {item.party_bill_number || '-'}
                    </Text>
                  </View>

                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Receipt Date</Text>
                    <Text style={styles.detailVal} numberOfLines={1}>
                      {item.receipt_date} {item.receipt_time ? `• ${item.receipt_time}` : ''}
                    </Text>
                  </View>

                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Deposit Account</Text>
                    <Text style={styles.detailVal} numberOfLines={1}>
                      {item.deposit_bank || 'Cash Till'}
                    </Text>
                  </View>

                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>Collected By</Text>
                    <Text style={styles.detailVal} numberOfLines={1}>
                      {item.sales_exec_name || 'Staff'}
                    </Text>
                  </View>
                </View>

                {/* CARD ROW 4: REMARK (IF ANY) */}
                {item.remark ? (
                  <View style={styles.remarkBox}>
                    <Feather name="info" size={12} color="#92400E" style={{ marginRight: 5 }} />
                    <Text style={styles.remarkText} numberOfLines={2}>
                      {item.remark}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 6. FLOATING SCROLL TO TOP BUTTON */}
      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopFab}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <Feather name="chevron-up" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* 7. ACTION SHEET BOTTOM MODAL (Triggered by 3-dot kebab button) */}
      <Modal
        visible={!!actionSheetReceipt}
        transparent
        animationType="slide"
        onRequestClose={() => setActionSheetReceipt(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setActionSheetReceipt(null)}
          />

          {actionSheetReceipt && (
            <View style={styles.actionSheetContent}>
              <View style={styles.sheetHandle} />

              {/* Action sheet header with voucher details */}
              <View style={styles.actionSheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionSheetVoucherNo}>{actionSheetReceipt.receipt_no}</Text>
                  <Text style={styles.actionSheetPartyName} numberOfLines={1}>
                    {actionSheetReceipt.party_name}
                  </Text>
                </View>
                <View style={styles.actionSheetAmountBadge}>
                  <Text style={styles.actionSheetAmountText}>
                    {formatIndianCurrency(actionSheetReceipt.total_amt)}
                  </Text>
                </View>
              </View>

              <View style={styles.actionSheetDivider} />

              {/* Option 1: View Slip */}
              <TouchableOpacity
                style={styles.actionSheetRow}
                onPress={() => {
                  const receipt = actionSheetReceipt;
                  setActionSheetReceipt(null);
                  setSelectedReceiptForSlip(receipt);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="document-text-outline" size={20} color="#0047AB" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionRowTitle}>View Receipt Slip</Text>
                  <Text style={styles.actionRowSub}>Preview and inspect official voucher slip</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#8FA0B8" />
              </TouchableOpacity>

              {/* Option 2: WhatsApp Share */}
              <TouchableOpacity
                style={styles.actionSheetRow}
                onPress={() => {
                  const receipt = actionSheetReceipt;
                  setActionSheetReceipt(null);
                  handleShareReceipt(receipt);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="#059669" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionRowTitle}>Share on WhatsApp</Text>
                  <Text style={styles.actionRowSub}>Send receipt voucher breakdown to customer</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#8FA0B8" />
              </TouchableOpacity>

              {/* Option 3: Call Customer (if phone available) */}
              {actionSheetReceipt.party_phone ? (
                <TouchableOpacity
                  style={styles.actionSheetRow}
                  onPress={() => {
                    const phone = actionSheetReceipt.party_phone;
                    setActionSheetReceipt(null);
                    handleCallParty(phone);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: '#F0F9FF' }]}>
                    <Feather name="phone-call" size={18} color="#0284C7" />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionRowTitle}>Call Customer</Text>
                    <Text style={styles.actionRowSub}>{actionSheetReceipt.party_phone}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#8FA0B8" />
                </TouchableOpacity>
              ) : null}

              {/* Option 4: Cancel Voucher (if allowed) */}
              {actionSheetReceipt.cancel_allowed ? (
                <TouchableOpacity
                  style={styles.actionSheetRow}
                  onPress={() => {
                    const receipt = actionSheetReceipt;
                    setActionSheetReceipt(null);
                    setReceiptToCancel(receipt);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: '#FEF2F2' }]}>
                    <Feather name="trash-2" size={18} color="#DC2626" />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={[styles.actionRowTitle, { color: '#DC2626' }]}>Cancel Receipt</Text>
                    <Text style={styles.actionRowSub}>Void and reverse this transaction</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#8FA0B8" />
                </TouchableOpacity>
              ) : null}

              {/* Dismiss button */}
              <TouchableOpacity
                style={styles.actionSheetCancelBtn}
                onPress={() => setActionSheetReceipt(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionSheetCancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* 8. TOP-TIER DATE RANGE PICKER BOTTOM MODAL */}
      <DateRangePickerModal
        visible={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        fromDate={fromDate}
        toDate={toDate}
        activePreset={datePreset}
        onApply={(newFrom, newTo, newPreset) => {
          setFromDate(newFrom);
          setToDate(newTo);
          setDatePreset(newPreset);
        }}
        title="Receipt Book Date Filter"
      />

      {/* 9. RECEIPT SLIP PREVIEW MODAL */}
      <Modal
        visible={!!selectedReceiptForSlip}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReceiptForSlip(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setSelectedReceiptForSlip(null)}
          />

          {selectedReceiptForSlip && (
            <View style={styles.slipSheet}>
              <View style={styles.sheetHandle} />

              {/* SLIP HEADER */}
              <View style={styles.slipCardHeader}>
                <View style={styles.slipCompanyBadge}>
                  <Ionicons name="business" size={18} color="#0047AB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.slipCompanyName}>BTHAWK ENTERPRISE</Text>
                  <Text style={styles.slipCompanySub}>Official Payment Receipt Voucher</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseCircle}
                  onPress={() => setSelectedReceiptForSlip(null)}
                >
                  <Feather name="x" size={18} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.slipScrollBody} showsVerticalScrollIndicator={false}>
                {/* VOUCHER NO & DATE BANNER */}
                <View style={styles.slipVoucherBanner}>
                  <View>
                    <Text style={styles.slipVoucherLabel}>RECEIPT VOUCHER NO</Text>
                    <Text style={styles.slipVoucherNumber}>{selectedReceiptForSlip.receipt_no}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.slipVoucherLabel}>DATE & TIME</Text>
                    <Text style={styles.slipVoucherDate}>
                      {selectedReceiptForSlip.receipt_date} {selectedReceiptForSlip.receipt_time || ''}
                    </Text>
                  </View>
                </View>

                {/* RECEIVED FROM PARTY CARD */}
                <View style={styles.slipPartyBox}>
                  <Text style={styles.slipSectionTitle}>RECEIVED WITH THANKS FROM</Text>
                  <Text style={styles.slipPartyName}>{selectedReceiptForSlip.party_name}</Text>
                  {selectedReceiptForSlip.party_phone ? (
                    <Text style={styles.slipPartyPhone}>Contact: {selectedReceiptForSlip.party_phone}</Text>
                  ) : null}
                  <Text style={styles.slipPartyBill}>Against Bill / Ref: {selectedReceiptForSlip.party_bill_number || '-'}</Text>
                </View>

                {/* FINANCIAL DETAILS TABLE */}
                <View style={styles.slipTable}>
                  <View style={styles.slipTableRow}>
                    <Text style={styles.slipTableKey}>Payment Mode</Text>
                    <Text style={styles.slipTableVal}>{selectedReceiptForSlip.payment_mode}</Text>
                  </View>
                  <View style={styles.slipTableRow}>
                    <Text style={styles.slipTableKey}>Deposited In</Text>
                    <Text style={styles.slipTableVal}>{selectedReceiptForSlip.deposit_bank || 'Cash Till'}</Text>
                  </View>
                  <View style={styles.slipTableRow}>
                    <Text style={styles.slipTableKey}>Source / Book</Text>
                    <Text style={styles.slipTableVal}>
                      {activeTab === 'credit'
                        ? 'Credit Ledger Book'
                        : activeTab === 'money'
                        ? 'Direct Cash Book'
                        : 'Miscellaneous Income Book'}
                    </Text>
                  </View>
                  <View style={styles.slipTableRow}>
                    <Text style={styles.slipTableKey}>Collected By</Text>
                    <Text style={styles.slipTableVal}>{selectedReceiptForSlip.sales_exec_name || 'Staff'}</Text>
                  </View>
                  {selectedReceiptForSlip.remark ? (
                    <View style={styles.slipTableRow}>
                      <Text style={styles.slipTableKey}>Remarks</Text>
                      <Text style={styles.slipTableVal}>{selectedReceiptForSlip.remark}</Text>
                    </View>
                  ) : null}
                </View>

                {/* GRAND TOTAL HIGHLIGHT */}
                <View style={styles.slipAmountHighlight}>
                  <Text style={styles.slipAmountLabel}>AMOUNT RECEIVED</Text>
                  <Text style={styles.slipAmountBig}>
                    {formatIndianCurrency(selectedReceiptForSlip.total_amt)}
                  </Text>
                  <Text style={styles.slipAmountStatus}>✓ Payment Settled & Verified</Text>
                </View>
              </ScrollView>

              {/* SLIP BOTTOM ACTIONS */}
              <View style={styles.slipActionRow}>
                <TouchableOpacity
                  style={styles.slipShareMainBtn}
                  onPress={() => {
                    handleShareReceipt(selectedReceiptForSlip);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.slipShareMainBtnText}>Share on WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.slipCloseBtn}
                  onPress={() => setSelectedReceiptForSlip(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.slipCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* 10. CANCEL RECEIPT CONFIRMATION MODAL */}
      <Modal
        visible={!!receiptToCancel}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptToCancel(null)}
      >
        <View style={styles.alertBackdrop}>
          <View style={styles.alertBox}>
            <View style={styles.alertIconCircle}>
              <Feather name="alert-triangle" size={28} color="#DC2626" />
            </View>
            <Text style={styles.alertTitle}>Cancel Receipt?</Text>
            <Text style={styles.alertDesc}>
              Are you sure you want to cancel receipt{' '}
              <Text style={{ fontWeight: '700', color: '#0E204E' }}>
                {receiptToCancel?.receipt_no}
              </Text>{' '}
              for{' '}
              <Text style={{ fontWeight: '700', color: '#0E204E' }}>
                {formatIndianCurrency(receiptToCancel?.total_amt)}
              </Text>
              ? This action cannot be reversed.
            </Text>

            <View style={styles.alertBtnRow}>
              <TouchableOpacity
                style={styles.alertCancelBtn}
                onPress={() => setReceiptToCancel(null)}
                disabled={isCancelling}
              >
                <Text style={styles.alertCancelBtnText}>No, Keep It</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.alertConfirmBtn}
                onPress={handleConfirmCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.alertConfirmBtnText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },

  // 1. TOP HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F8FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#5A6B87',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topRightDateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  topRightDateBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
    maxWidth: 70,
  },
  newReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0047AB',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
  },
  newReceiptBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F8FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },

  // 2. TAB SELECTOR
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  tabButtonActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 3. SEARCH & FULL-WIDTH MODE
  searchBarSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F8FD',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
    paddingVertical: 0,
  },
  modeFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F4F8FD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  modePillActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
  },
  modePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 4. SUMMARY METRIC STRIP
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#DFE7F2',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5A6B87',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
  },

  // 5. MAIN SCROLL & RECEIPT CARDS
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 40,
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#5A6B87',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  resetFilterBtn: {
    backgroundColor: '#0047AB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  receiptNoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptNo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 0.2,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  kebabBtn: {
    padding: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  partyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  partyInfo: {
    flex: 1,
    paddingRight: 10,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '500',
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  totalAmountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  amountSubLabel: {
    fontSize: 10,
    color: '#8FA0B8',
    textTransform: 'uppercase',
  },

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFD',
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  detailCol: {
    width: '48%',
  },
  detailLabel: {
    fontSize: 9,
    color: '#8FA0B8',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 1,
  },
  detailVal: {
    fontSize: 11,
    color: '#0E204E',
    fontWeight: '600',
  },

  remarkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
  },
  remarkText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },

  // 6. SCROLL TO TOP FAB
  scrollTopFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0047AB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },

  // 7. MODALS
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 88, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },

  // ACTION SHEET MODAL
  actionSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  actionSheetVoucherNo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0047AB',
    marginBottom: 2,
  },
  actionSheetPartyName: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '600',
  },
  actionSheetAmountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionSheetAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  actionSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFD',
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 2,
  },
  actionRowSub: {
    fontSize: 11,
    color: '#5A6B87',
  },
  actionSheetCancelBtn: {
    backgroundColor: '#F4F8FD',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  actionSheetCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B87',
  },

  // SLIP SHEET
  slipSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  slipCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  slipCompanyBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  slipCompanyName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
  },
  slipCompanySub: {
    fontSize: 11,
    color: '#5A6B87',
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  slipScrollBody: {
    paddingVertical: 10,
  },
  slipVoucherBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginBottom: 10,
  },
  slipVoucherLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8FA0B8',
    textTransform: 'uppercase',
  },
  slipVoucherNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
    marginTop: 2,
  },
  slipVoucherDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E204E',
    marginTop: 2,
  },
  slipPartyBox: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  slipSectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8FA0B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  slipPartyName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
  },
  slipPartyPhone: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  slipPartyBill: {
    fontSize: 11,
    color: '#0047AB',
    fontWeight: '600',
    marginTop: 4,
  },
  slipTable: {
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginBottom: 12,
    gap: 6,
  },
  slipTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  slipTableKey: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
  },
  slipTableVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E204E',
    textAlign: 'right',
    maxWidth: '60%',
  },
  slipAmountHighlight: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  slipAmountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.6,
  },
  slipAmountBig: {
    fontSize: 24,
    fontWeight: '900',
    color: '#065F46',
    marginVertical: 4,
  },
  slipAmountStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  slipActionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  slipShareMainBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
  },
  slipShareMainBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  slipCloseBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F8FD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  slipCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },

  // ALERT MODAL
  alertBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 88, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  alertBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  alertIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E204E',
    marginBottom: 6,
  },
  alertDesc: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  alertBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  alertCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F4F8FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  alertCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B87',
  },
  alertConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertConfirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
