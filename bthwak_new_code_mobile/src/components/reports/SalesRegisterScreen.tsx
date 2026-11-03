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
  fetchSaleRegisterApi,
  SaleRegisterItem,
  SaleRegisterSummary,
} from '@/api/reports';
import { formatIndianCurrency, formatIndianNumber } from '@/utils/formatters';
import {
  DateRangePickerModal,
  DatePresetKey,
  formatDateToIso,
  formatReadableDate,
} from '@/components/common/DateRangePickerModal';

export const SalesRegisterScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);

  // Dates state
  const today = useMemo(() => new Date(), []);
  const [datePreset, setDatePreset] = useState<DatePresetKey>('last_7_days');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDateToIso(d);
  });
  const [toDate, setToDate] = useState(() => formatDateToIso(today));

  // Search & Filter state
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // Data state
  const [records, setRecords] = useState<SaleRegisterItem[]>([]);
  const [summary, setSummary] = useState<SaleRegisterSummary>({
    total_bills: 0,
    total_quentity: 0,
    total_amount: 0,
    total_discount: 0,
    total_net_amount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Active Action Sheet & Detail modals
  const [actionSheetVoucher, setActionSheetVoucher] = useState<SaleRegisterItem | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<SaleRegisterItem | null>(null);

  // Load Data
  const loadRegister = useCallback(async (isPull = false) => {
    if (isPull) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res = await fetchSaleRegisterApi({
        start_date: fromDate,
        end_date: toDate,
        search: searchProduct.trim(),
        mode_type: selectedMode !== 'All' ? selectedMode : undefined,
      });
      setRecords(res.data || []);
      setSummary(res.summary || {
        total_bills: 0,
        total_quentity: 0,
        total_amount: 0,
        total_discount: 0,
        total_net_amount: 0,
      });
    } catch {
      setRecords([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fromDate, toDate, searchProduct, selectedMode]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadRegister();
    }, 250);
    return () => clearTimeout(t);
  }, [loadRegister]);

  const getDateLabel = () => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'last_7_days') return '7 Days';
    if (datePreset === 'this_month') return 'This Month';
    if (datePreset === 'last_30_days') return '30 Days';
    if (datePreset === 'this_year') return 'FY Year';
    return `${fromDate.slice(5)} - ${toDate.slice(5)}`;
  };

  // Client-side quick filter
  const displayedRecords = useMemo(() => {
    if (!searchProduct.trim() && selectedMode === 'All') return records;
    const q = searchProduct.trim().toLowerCase();
    return records.filter((item) => {
      const matchesSearch =
        !q ||
        item.item_name.toLowerCase().includes(q) ||
        item.bill_no.toLowerCase().includes(q) ||
        item.party_name.toLowerCase().includes(q) ||
        item.hsn.includes(q);

      const matchesMode = selectedMode === 'All' || item.mode_type.toLowerCase() === selectedMode.toLowerCase();
      return matchesSearch && matchesMode;
    });
  }, [records, searchProduct, selectedMode]);

  // Scroll to Top
  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Payment Badge Color Generator
  const getModeBadgeStyle = (mode: string) => {
    const m = mode.toLowerCase();
    if (m === 'cash') {
      return {
        bg: '#FDF2F2',
        border: '#FCA5A5',
        text: '#B91C1C',
      };
    }
    if (m === 'credit') {
      return {
        bg: '#FFFBEB',
        border: '#FCD34D',
        text: '#B45309',
      };
    }
    if (m === 'online' || m === 'upi') {
      return {
        bg: '#EFF6FF',
        border: '#93C5FD',
        text: '#1D4ED8',
      };
    }
    return {
      bg: '#F0FDF4',
      border: '#86EFAC',
      text: '#15803D',
    };
  };

  // Share Voucher via WhatsApp
  const handleShareVoucher = async (item: SaleRegisterItem) => {
    const msg =
      `*BTHAWK SALE INVOICE* 🧾\n` +
      `--------------------------------\n` +
      `*Bill No:* ${item.bill_no}\n` +
      `*Date:* ${item.bill_date}\n` +
      `*Customer:* ${item.party_name}\n` +
      (item.party_phone ? `*Phone:* ${item.party_phone}\n` : '') +
      `*Item:* ${item.item_name} (HSN: ${item.hsn})\n` +
      `*Quantity:* ${item.quentity} @ ${formatIndianCurrency(item.price)}\n` +
      (item.discount > 0 ? `*Discount:* ${formatIndianCurrency(item.discount)}\n` : '') +
      `*Net Payable:* ${formatIndianCurrency(item.net_amount)}\n` +
      `*Payment Mode:* ${item.mode_type}\n` +
      `--------------------------------\n` +
      `Powered by BTHAWK ERP.`;

    try {
      await Share.share({ message: msg, title: item.bill_no });
    } catch {}
  };

  const handleCallParty = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No contact number available for this party.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER WITH TOP RIGHT DATE FILTER BUTTON */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color="#0E204E" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Sale Register</Text>
            <Text style={styles.headerSubtitle}>Invoices & sales audit logs</Text>
          </View>
        </View>

        {/* TOP RIGHT ACTIONS */}
        <View style={styles.headerRight}>
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
            onPress={() => loadRegister(true)}
            style={styles.headerRefreshBtn}
            activeOpacity={0.7}
          >
            <Feather name="rotate-cw" size={16} color="#0E204E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. FULL-WIDTH SEARCH BAR & PAYMENT MODE CHIPS */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#8FA0B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search product, bill, customer, HSN..."
            placeholderTextColor="#8FA0B8"
            value={searchProduct}
            onChangeText={setSearchProduct}
            clearButtonMode="while-editing"
          />
          {searchProduct.length > 0 && (
            <TouchableOpacity onPress={() => setSearchProduct('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x-circle" size={15} color="#8FA0B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* PAYMENT MODE FILTER CHIPS */}
        <View style={styles.modeFilterRow}>
          {['All', 'Cash', 'Credit', 'Online'].map((mode) => {
            const isSelected = selectedMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.modePill, isSelected && styles.modePillActive]}
                onPress={() => setSelectedMode(mode)}
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

      {/* 3. METRIC SUMMARY BAR */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Bills</Text>
          <Text style={styles.summaryValue}>{summary.total_bills}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Qty</Text>
          <Text style={styles.summaryValue}>{formatIndianNumber(summary.total_quentity)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Discount</Text>
          <Text style={[styles.summaryValue, { color: '#D97706' }]}>
            {formatIndianCurrency(summary.total_discount)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net Amount</Text>
          <Text style={[styles.summaryValue, { color: '#0047AB' }]}>
            {formatIndianCurrency(summary.total_net_amount)}
          </Text>
        </View>
      </View>

      {/* 4. MAIN SALE VOUCHER CARDS */}
      <ScrollView
        ref={scrollRef}
        style={styles.mainScrollView}
        contentContainerStyle={[styles.mainScrollContent, { paddingBottom: 60 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadRegister(true)}
            colors={['#0047AB']}
            tintColor="#0047AB"
          />
        }
        onScroll={(e) => {
          setShowScrollTop(e.nativeEvent.contentOffset.y > 280);
        }}
        scrollEventThrottle={16}
      >
        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color="#0047AB" />
            <Text style={styles.loaderText}>Loading sales vouchers...</Text>
          </View>
        ) : displayedRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="file-text" size={32} color="#8FA0B8" />
            </View>
            <Text style={styles.emptyTitle}>No Sales Records</Text>
            <Text style={styles.emptyDesc}>
              No sale vouchers found for the selected date range and filter criteria.
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearchProduct('');
                setSelectedMode('All');
                setDatePreset('last_7_days');
                const now = new Date();
                const d = new Date();
                d.setDate(d.getDate() - 7);
                setFromDate(formatDateToIso(d));
                setToDate(formatDateToIso(now));
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.resetFilterBtnText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedRecords.map((item) => {
            const badgeStyle = getModeBadgeStyle(item.mode_type);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.voucherCard}
                activeOpacity={0.9}
                onPress={() => setActionSheetVoucher(item)}
              >
                {/* CARD ROW 1: BILL NUMBER + MODE BADGE + 3-DOT KEBAB */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.billNumberWrap}>
                    <Ionicons name="receipt-outline" size={15} color="#0047AB" style={{ marginRight: 6 }} />
                    <Text style={styles.billNumber}>{item.bill_no}</Text>
                  </View>

                  <View style={styles.cardHeaderRight}>
                    <View
                      style={[
                        styles.modeBadge,
                        { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
                      ]}
                    >
                      <Text style={[styles.modeBadgeText, { color: badgeStyle.text }]}>
                        {item.mode_type}
                      </Text>
                    </View>

                    {/* 3-DOT KEBAB ACTION BUTTON */}
                    <TouchableOpacity
                      style={styles.kebabBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        setActionSheetVoucher(item);
                      }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      activeOpacity={0.7}
                    >
                      <Feather name="more-vertical" size={18} color="#5A6B87" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* CARD ROW 2: PRODUCT NAME & BILL DATE */}
                <View style={styles.productDateRow}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.item_name}
                  </Text>
                  <Text style={styles.billDate}>{item.bill_date}</Text>
                </View>

                {/* CARD ROW 3: HSN CODE */}
                <Text style={styles.hsnText}>HSN: {item.hsn}</Text>

                {/* CARD ROW 4: CUSTOMER / PARTY NAME */}
                <View style={styles.partyRow}>
                  <Feather name="user" size={12} color="#5A6B87" style={{ marginRight: 5 }} />
                  <Text style={styles.partyName} numberOfLines={1}>
                    {item.party_name}
                  </Text>
                  {item.party_phone ? (
                    <Text style={styles.partyPhone}>• {item.party_phone}</Text>
                  ) : null}
                </View>

                {/* CARD ROW 5: 4-COLUMN CLEAN METRICS */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricCol}>
                    <Text style={styles.metricVal}>{formatIndianNumber(item.quentity)}</Text>
                    <Text style={styles.metricLabel}>Qty</Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={styles.metricVal}>{formatIndianCurrency(item.price)}</Text>
                    <Text style={styles.metricLabel}>Price</Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={styles.metricVal}>{formatIndianCurrency(item.discount)}</Text>
                    <Text style={styles.metricLabel}>Disc</Text>
                  </View>

                  <View style={[styles.metricCol, styles.metricColNet]}>
                    <Text style={[styles.metricVal, styles.metricValNet]}>
                      {formatIndianCurrency(item.net_amount)}
                    </Text>
                    <Text style={styles.metricLabelNet}>Net</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* 5. FLOATING SCROLL TO TOP BUTTON */}
      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopFab}
          onPress={scrollToTop}
          activeOpacity={0.8}
          accessibilityLabel="Scroll to top"
        >
          <Feather name="chevron-up" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* 6. ACTION SHEET BOTTOM MODAL (Triggered by 3-dot kebab menu) */}
      <Modal
        visible={!!actionSheetVoucher}
        transparent
        animationType="slide"
        onRequestClose={() => setActionSheetVoucher(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setActionSheetVoucher(null)}
          />

          {actionSheetVoucher && (
            <View style={styles.actionSheetContent}>
              <View style={styles.sheetHandle} />

              <View style={styles.actionSheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionSheetVoucherNo}>{actionSheetVoucher.bill_no}</Text>
                  <Text style={styles.actionSheetPartyName} numberOfLines={1}>
                    {actionSheetVoucher.party_name}
                  </Text>
                </View>
                <View style={styles.actionSheetAmountBadge}>
                  <Text style={styles.actionSheetAmountText}>
                    {formatIndianCurrency(actionSheetVoucher.net_amount)}
                  </Text>
                </View>
              </View>

              <View style={styles.actionSheetDivider} />

              {/* Option 1: View Details */}
              <TouchableOpacity
                style={styles.actionSheetRow}
                onPress={() => {
                  const v = actionSheetVoucher;
                  setActionSheetVoucher(null);
                  setSelectedVoucher(v);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="document-text-outline" size={20} color="#0047AB" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionRowTitle}>View Invoice Details</Text>
                  <Text style={styles.actionRowSub}>Line items, taxes, price breakdown</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#8FA0B8" />
              </TouchableOpacity>

              {/* Option 2: WhatsApp Share */}
              <TouchableOpacity
                style={styles.actionSheetRow}
                onPress={() => {
                  const v = actionSheetVoucher;
                  setActionSheetVoucher(null);
                  handleShareVoucher(v);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="#059669" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionRowTitle}>Share on WhatsApp</Text>
                  <Text style={styles.actionRowSub}>Send digital invoice details to party</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#8FA0B8" />
              </TouchableOpacity>

              {/* Option 3: Call Customer */}
              {actionSheetVoucher.party_phone ? (
                <TouchableOpacity
                  style={styles.actionSheetRow}
                  onPress={() => {
                    const phone = actionSheetVoucher.party_phone;
                    setActionSheetVoucher(null);
                    handleCallParty(phone);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: '#F0F9FF' }]}>
                    <Feather name="phone-call" size={18} color="#0284C7" />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionRowTitle}>Call Customer</Text>
                    <Text style={styles.actionRowSub}>{actionSheetVoucher.party_phone}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#8FA0B8" />
                </TouchableOpacity>
              ) : null}

              {/* Dismiss Button */}
              <TouchableOpacity
                style={styles.actionSheetCancelBtn}
                onPress={() => setActionSheetVoucher(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionSheetCancelBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* 7. TOP-TIER DATE RANGE PICKER BOTTOM MODAL */}
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
        title="Sale Register Date Filter"
      />

      {/* 8. INVOICE DETAIL MODAL */}
      <Modal
        visible={!!selectedVoucher}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVoucher(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setSelectedVoucher(null)}
          />

          {selectedVoucher && (
            <View style={styles.detailSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.detailHeaderRow}>
                <View>
                  <Text style={styles.detailBillNo}>{selectedVoucher.bill_no}</Text>
                  <Text style={styles.detailBillDate}>Dated: {selectedVoucher.bill_date}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseCircle}
                  onPress={() => setSelectedVoucher(null)}
                >
                  <Feather name="x" size={18} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionHeader}>PARTY & ITEM INFO</Text>
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailItemKey}>Party Name</Text>
                    <Text style={styles.detailItemVal}>{selectedVoucher.party_name}</Text>
                  </View>
                  {selectedVoucher.party_phone ? (
                    <View style={styles.detailItemRow}>
                      <Text style={styles.detailItemKey}>Phone</Text>
                      <Text style={styles.detailItemVal}>{selectedVoucher.party_phone}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailItemKey}>Product Item</Text>
                    <Text style={styles.detailItemVal}>{selectedVoucher.item_name}</Text>
                  </View>
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailItemKey}>HSN Code</Text>
                    <Text style={styles.detailItemVal}>{selectedVoucher.hsn}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionHeader}>FINANCIAL BREAKDOWN</Text>
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailItemKey}>Quantity</Text>
                    <Text style={styles.detailItemVal}>{selectedVoucher.quentity} Units</Text>
                  </View>
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailItemKey}>Unit Price</Text>
                    <Text style={styles.detailItemVal}>{formatIndianCurrency(selectedVoucher.price)}</Text>
                  </View>
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailItemKey}>Discount</Text>
                    <Text style={[styles.detailItemVal, { color: '#D97706' }]}>
                      {formatIndianCurrency(selectedVoucher.discount)}
                    </Text>
                  </View>
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailItemKey}>Payment Mode</Text>
                    <Text style={styles.detailItemVal}>{selectedVoucher.mode_type}</Text>
                  </View>
                </View>

                <View style={styles.detailNetCard}>
                  <Text style={styles.detailNetLabel}>NET BILL AMOUNT</Text>
                  <Text style={styles.detailNetVal}>
                    {formatIndianCurrency(selectedVoucher.net_amount)}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.detailActionsRow}>
                <TouchableOpacity
                  style={styles.detailShareBtn}
                  onPress={() => {
                    handleShareVoucher(selectedVoucher);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.detailShareBtnText}>Share on WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={() => setSelectedVoucher(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.detailCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },

  // 1. TOP HEADER
  topHeader: {
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
  headerBackBtn: {
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
  headerRight: {
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
  headerRefreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F8FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },

  // 2. SEARCH & MODE FILTER
  filterSection: {
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

  // 3. SUMMARY BAR
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

  // 4. MAIN SCROLL & CARDS
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
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

  voucherCard: {
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
  billNumberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billNumber: {
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

  productDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
    marginRight: 8,
  },
  billDate: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
  },
  hsnText: {
    fontSize: 11,
    color: '#8FA0B8',
    marginBottom: 4,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyName: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  partyPhone: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },

  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFD',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricColNet: {
    borderLeftWidth: 1,
    borderLeftColor: '#DFE7F2',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 1,
  },
  metricLabel: {
    fontSize: 9,
    color: '#8FA0B8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricValNet: {
    color: '#0047AB',
    fontWeight: '800',
  },
  metricLabelNet: {
    color: '#0047AB',
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '700',
  },

  // 5. FAB
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

  // 6. ACTION SHEET
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 88, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  actionSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionSheetAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0047AB',
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

  // INVOICE DETAIL SHEET
  detailSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailBillNo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0047AB',
  },
  detailBillDate: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
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
  detailBody: {
    paddingVertical: 12,
  },
  detailSection: {
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginBottom: 10,
    gap: 6,
  },
  detailSectionHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8FA0B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  detailItemKey: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
  },
  detailItemVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E204E',
    textAlign: 'right',
    maxWidth: '65%',
  },
  detailNetCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  detailNetLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 0.6,
  },
  detailNetVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0047AB',
    marginTop: 4,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  detailShareBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
  },
  detailShareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailCloseBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F8FD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  detailCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
});
