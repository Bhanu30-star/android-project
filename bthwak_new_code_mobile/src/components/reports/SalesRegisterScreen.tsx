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
  PATTERN_TABS,
  PatternKey,
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
  const [activePattern, setActivePattern] = useState<PatternKey>('marg');
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
        pattern: activePattern,
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
  }, [fromDate, toDate, searchProduct, selectedMode, activePattern]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadRegister();
    }, 250);
    return () => clearTimeout(t);
  }, [loadRegister]);

  // Export to Excel handler
  const handleExportExcel = () => {
    const patName = PATTERN_TABS.find((p) => p.key === activePattern)?.fullName || 'Sales';
    Alert.alert(
      'Export Excel (.xlsx)',
      `Sales Register (${patName}) with ${records.length} voucher rows is ready for spreadsheet export.`,
      [
        {
          text: 'Share / Save',
          onPress: async () => {
            try {
              const summaryText =
                `*BTHAWK ${patName.toUpperCase()} REGISTER EXPORT*\n` +
                `Period: ${fromDate} to ${toDate}\n` +
                `Total Invoices: ${summary.total_bills}\n` +
                `Total Quantity: ${summary.total_quentity} Units\n` +
                `Total Revenue: ${formatIndianCurrency(summary.total_net_amount)}\n` +
                `Generated via BTHAWK ERP.`;
              await Share.share({ message: summaryText, title: `${patName}_Register.xlsx` });
            } catch {}
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Print / PDF preview handler
  const handlePrintPdf = () => {
    const patName = PATTERN_TABS.find((p) => p.key === activePattern)?.fullName || 'Sales';
    Alert.alert(
      'Print / PDF Statement',
      `Generate GST-compliant print preview for ${patName}?`,
      [
        {
          text: 'Share Statement',
          onPress: async () => {
            try {
              const printMsg =
                `*BTHAWK TAX STATEMENT - ${patName.toUpperCase()}*\n` +
                `Date Range: ${fromDate} to ${toDate}\n` +
                `Total Invoices: ${summary.total_bills}\n` +
                `Total Qty: ${formatIndianNumber(summary.total_quentity)} Units\n` +
                `Total Taxable/Net: ${formatIndianCurrency(summary.total_net_amount)}\n` +
                `--------------------------------\n` +
                records
                  .slice(0, 10)
                  .map(
                    (r, i) =>
                      `${i + 1}. ${r.bill_no} | ${r.party_name} | ${formatIndianCurrency(r.net_amount)}`
                  )
                  .join('\n') +
                (records.length > 10 ? `\n...and ${records.length - 10} more bills.` : '') +
                `\n--------------------------------\nBTHAWK Enterprise ERP Statement.`;
              await Share.share({ message: printMsg, title: `${patName}_Statement` });
            } catch {}
          },
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

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
    const totalTax = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0) + (item.cess_amount || 0);
    const msg =
      `*BTHAWK SALE INVOICE* 🧾\n` +
      `--------------------------------\n` +
      `*Bill No:* ${item.bill_no}` + (item.vch_series ? ` (${item.vch_series})` : '') + `\n` +
      `*Date:* ${item.bill_date}\n` +
      `*Customer:* ${item.party_name}\n` +
      (item.party_gstin ? `*GSTIN:* ${item.party_gstin}\n` : '') +
      (item.party_phone ? `*Phone:* ${item.party_phone}\n` : '') +
      (item.beat ? `*Beat:* ${item.beat}\n` : '') +
      `*Item:* ${item.item_name} (HSN: ${item.hsn})\n` +
      `*Quantity:* ${item.quentity} ${item.unit || 'Units'} @ ${formatIndianCurrency(item.price)}\n` +
      (item.taxable_value ? `*Taxable Value:* ${formatIndianCurrency(item.taxable_value)}\n` : '') +
      (totalTax > 0 ? `*Total Taxes (GST):* ${formatIndianCurrency(totalTax)}\n` : '') +
      (item.discount > 0 ? `*Trade Discount:* -${formatIndianCurrency(item.discount)}\n` : '') +
      `*Consolidated Net:* ${formatIndianCurrency(item.net_amount)}\n` +
      `*Payment Mode:* ${item.mode_type}\n` +
      (item.source ? `*Source:* ${item.source}\n` : '') +
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
      {/* 1. TOP HEADER (CLEAN & SPACIOUS - NO OVERLAP) */}
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
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>Sale Register</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>Invoices & sales audit logs</Text>
          </View>
        </View>

        {/* TOP RIGHT ACTIONS */}
        <View style={styles.headerRight}>
          {/* EXCEL EXPORT BUTTON */}
          <TouchableOpacity
            onPress={handleExportExcel}
            style={styles.headerActionIconBtn}
            activeOpacity={0.7}
            accessibilityLabel="Export Excel"
          >
            <Feather name="download" size={15} color="#16A34A" />
          </TouchableOpacity>

          {/* PRINT / PDF BUTTON */}
          <TouchableOpacity
            onPress={handlePrintPdf}
            style={styles.headerActionIconBtn}
            activeOpacity={0.7}
            accessibilityLabel="Print Statement"
          >
            <Feather name="printer" size={15} color="#0047AB" />
          </TouchableOpacity>

          {/* REFRESH BUTTON */}
          <TouchableOpacity
            onPress={() => loadRegister(true)}
            style={styles.headerRefreshBtn}
            activeOpacity={0.7}
          >
            <Feather name="rotate-cw" size={15} color="#0E204E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. DATE FILTER & SEARCH SECTION */}
      <View style={styles.filterSection}>
        <View style={styles.searchAndDateRow}>
          {/* INTERACTIVE DATE FILTER BUTTON */}
          <TouchableOpacity
            style={styles.calendarFilterPill}
            onPress={() => setIsDateModalOpen(true)}
            activeOpacity={0.8}
          >
            <Feather name="calendar" size={13} color="#0047AB" />
            <Text style={styles.calendarFilterPillText} numberOfLines={1}>
              {getDateLabel()}
            </Text>
            <Feather name="chevron-down" size={12} color="#0047AB" />
          </TouchableOpacity>

          {/* SEARCH BOX */}
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#8FA0B8" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search product, bill, customer..."
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

      {/* 2.5 ACCOUNTING PATTERN STRIP (MARG / BUSY / TALLY / TFD / SARAL / STD.INV / STD.ITEM) */}
      <View style={styles.patternSection}>
        <View style={styles.patternHeader}>
          <View style={styles.patternHeaderLeft}>
            <Ionicons name="layers-outline" size={13} color="#0047AB" style={{ marginRight: 4 }} />
            <Text style={styles.patternHeaderTitle}>ACCOUNTING PATTERN</Text>
          </View>
          <View style={styles.patternActiveBadge}>
            <Text style={styles.patternActiveLabel}>
              {PATTERN_TABS.find((p) => p.key === activePattern)?.fullName}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.patternScrollContent}
        >
          {PATTERN_TABS.map((pat) => {
            const isActive = activePattern === pat.key;
            return (
              <TouchableOpacity
                key={pat.key}
                style={[styles.patternTabBtn, isActive && styles.patternTabBtnActive]}
                onPress={() => setActivePattern(pat.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.patternTabText, isActive && styles.patternTabTextActive]}>
                  {pat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. METRIC SUMMARY BAR - ADAPTIVE TO SELECTED PATTERN */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryBillsBadge}>
            <Ionicons name="receipt-outline" size={14} color="#0047AB" style={{ marginRight: 5 }} />
            <Text style={styles.summaryBillsText}>
              {summary.total_bills} {summary.total_bills === 1 ? 'Bill' : 'Bills'} • {PATTERN_TABS.find((p) => p.key === activePattern)?.label}
            </Text>
          </View>
          <View style={styles.summaryNetGroup}>
            <Text style={styles.summaryNetLabel}>TOTAL NET REVENUE</Text>
            <Text style={styles.summaryNetValue} numberOfLines={1}>
              {formatIndianCurrency(summary.total_net_amount)}
            </Text>
          </View>
        </View>

        {summary.summaryByTab && Object.keys(summary.summaryByTab).length > 0 ? (
          <>
            <View style={styles.summarySubDivider} />
            <View style={styles.summaryTilesGrid}>
              {Object.entries(summary.summaryByTab).map(([key, val]) => (
                <View key={key} style={styles.summaryTile}>
                  <Text style={styles.summaryTileLabel} numberOfLines={1}>
                    {key.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.summaryTileVal} numberOfLines={1}>
                    {typeof val === 'number' && (key.toLowerCase().includes('amt') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('tax') || key.toLowerCase().includes('cgst') || key.toLowerCase().includes('sgst') || key.toLowerCase().includes('igst') || key.toLowerCase().includes('cess') || key.toLowerCase().includes('discount') || key.toLowerCase().includes('charges') || key.toLowerCase().includes('tcs'))
                      ? formatIndianCurrency(val)
                      : typeof val === 'number'
                      ? formatIndianNumber(val)
                      : val}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.summarySubDivider} />
            <View style={styles.summaryBottomRow}>
              <View style={styles.summarySubItem}>
                <Text style={styles.summarySubLabel}>Total Quantity</Text>
                <Text style={styles.summarySubValue}>
                  {formatIndianNumber(summary.total_quentity)} Units
                </Text>
              </View>
              <View style={styles.summarySubDividerVert} />
              <View style={styles.summarySubItem}>
                <Text style={styles.summarySubLabel}>Total Discount</Text>
                <Text style={[styles.summarySubValue, { color: '#D97706' }]}>
                  {formatIndianCurrency(summary.total_discount)}
                </Text>
              </View>
            </View>
          </>
        )}
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
            const totalTax = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0) + (item.cess_amount || 0);
            const totalCharges = (item.other_charges || 0) + (item.freight_charges || 0) + (item.labour_charges || 0);

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.voucherCard}
                activeOpacity={0.85}
                onPress={() => setSelectedVoucher(item)}
              >
                {/* CARD ROW 1: BILL NUMBER + MODE BADGE + PATTERN BADGE + 3-DOT KEBAB */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.billNumberWrap}>
                    <Ionicons name="receipt-outline" size={15} color="#0047AB" style={{ marginRight: 6 }} />
                    <Text style={styles.billNumber}>{item.bill_no}</Text>
                    {item.vch_series ? (
                      <View style={styles.vchSeriesPill}>
                        <Text style={styles.vchSeriesText}>{item.vch_series}</Text>
                      </View>
                    ) : null}
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

                {/* CARD ROW 2: PRIMARY TITLE & BILL DATE (Adaptive to pattern) */}
                <View style={styles.productDateRow}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {activePattern === 'stdInv' || activePattern === 'tfd'
                      ? item.party_name
                      : item.item_name}
                  </Text>
                  <Text style={styles.billDate}>{item.bill_date}</Text>
                </View>

                {/* CARD ROW 3: CONTEXTUAL SECONDARY ROW (Adaptive to pattern) */}
                <View style={styles.contextualRow}>
                  {activePattern === 'tfd' ? (
                    <Text style={styles.hsnText} numberOfLines={1}>
                      {item.party_gstin ? `GSTIN: ${item.party_gstin}` : 'GST: Unregistered'}
                      {item.beat ? ` • Beat: ${item.beat}` : ''}
                      {item.place_of_supply ? ` • POS: ${item.place_of_supply}` : ''}
                    </Text>
                  ) : activePattern === 'stdInv' ? (
                    <Text style={styles.hsnText} numberOfLines={1}>
                      {item.party_gstin ? `GST: ${item.party_gstin}` : `Beat: ${item.beat || 'General'}`}
                      {item.mc_name ? ` • MC: ${item.mc_name}` : ''}
                    </Text>
                  ) : activePattern === 'busy' ? (
                    <Text style={styles.hsnText} numberOfLines={1}>
                      {item.mc_name ? `MC: ${item.mc_name} • ` : ''}
                      {item.party_gstin ? `GST: ${item.party_gstin} • ` : ''}
                      Unit: {item.unit || 'Pcs'}
                    </Text>
                  ) : activePattern === 'tally' ? (
                    <Text style={styles.hsnText} numberOfLines={1}>
                      {item.code ? `Code: ${item.code} • ` : ''}
                      HSN: {item.hsn}
                      {item.category ? ` • Cat: ${item.category}` : ''}
                    </Text>
                  ) : activePattern === 'saral' ? (
                    <Text style={styles.hsnText} numberOfLines={1}>
                      {item.fse_detail ? `FSE: ${item.fse_detail} • ` : ''}
                      Mode: {item.mode_type}
                    </Text>
                  ) : (
                    <Text style={styles.hsnText} numberOfLines={1}>
                      HSN: {item.hsn}
                      {item.code ? ` • Code: ${item.code}` : ''}
                      {item.unit ? ` • Unit: ${item.unit}` : ''}
                    </Text>
                  )}
                </View>

                {/* CARD ROW 4: CUSTOMER / PARTY NAME */}
                <View style={styles.partyRow}>
                  <Feather name="user" size={12} color="#5A6B87" style={{ marginRight: 5 }} />
                  <Text style={styles.partyName} numberOfLines={1}>
                    {activePattern === 'stdInv' || activePattern === 'tfd'
                      ? item.item_name || 'Standard Invoiced Goods'
                      : item.party_name}
                  </Text>
                  {item.party_phone ? (
                    <Text style={styles.partyPhone}>• {item.party_phone}</Text>
                  ) : null}
                </View>

                {/* CARD ROW 5: 4-COLUMN ADAPTIVE ERP METRICS */}
                <View style={styles.metricsRow}>
                  {activePattern === 'tfd' ? (
                    <>
                      <View style={[styles.metricCol, styles.metricColQty]}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(item.taxable_value || item.price * item.quentity)}
                        </Text>
                        <Text style={styles.metricLabel}>Taxable</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(item.cgst || 0)}
                        </Text>
                        <Text style={styles.metricLabel}>CGST</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(item.sgst || 0)}
                        </Text>
                        <Text style={styles.metricLabel}>SGST</Text>
                      </View>
                    </>
                  ) : activePattern === 'stdInv' ? (
                    <>
                      <View style={[styles.metricCol, styles.metricColQty]}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(item.taxable_value || item.net_amount - totalTax)}
                        </Text>
                        <Text style={styles.metricLabel}>Taxable</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(totalTax)}
                        </Text>
                        <Text style={styles.metricLabel}>Taxes</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(totalCharges)}
                        </Text>
                        <Text style={styles.metricLabel}>Charges</Text>
                      </View>
                    </>
                  ) : activePattern === 'busy' ? (
                    <>
                      <View style={[styles.metricCol, styles.metricColQty]}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianNumber(item.quentity)} {item.unit || ''}
                        </Text>
                        <Text style={styles.metricLabel}>Qty</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(item.price)}
                        </Text>
                        <Text style={styles.metricLabel}>Price</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(item.quentity * item.price)}
                        </Text>
                        <Text style={styles.metricLabel}>Amount</Text>
                      </View>
                    </>
                  ) : activePattern === 'saral' ? (
                    <>
                      <View style={[styles.metricCol, styles.metricColQty]}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianNumber(item.quentity)}
                        </Text>
                        <Text style={styles.metricLabel}>Qty</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(item.price)}
                        </Text>
                        <Text style={styles.metricLabel}>Rate</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(item.cash_amount || 0)}
                        </Text>
                        <Text style={styles.metricLabel}>Cash</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[styles.metricCol, styles.metricColQty]}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianNumber(item.quentity)}
                        </Text>
                        <Text style={styles.metricLabel}>Qty</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(item.price)}
                        </Text>
                        <Text style={styles.metricLabel}>Price</Text>
                      </View>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricVal} numberOfLines={1}>
                          {formatIndianCurrency(item.discount)}
                        </Text>
                        <Text style={styles.metricLabel}>Disc</Text>
                      </View>
                    </>
                  )}

                  <View style={[styles.metricCol, styles.metricColNet]}>
                    <Text style={[styles.metricVal, styles.metricValNet]} numberOfLines={1}>
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

      {/* 8. INVOICE DETAIL MODAL - COMPREHENSIVE ERP INSPECTOR MATCHING WEB FRONTEND */}
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

          {selectedVoucher && (() => {
            const badgeStyle = getModeBadgeStyle(selectedVoucher.mode_type);
            const totalTax =
              (selectedVoucher.cgst || 0) +
              (selectedVoucher.sgst || 0) +
              (selectedVoucher.igst || 0) +
              (selectedVoucher.cess_amount || 0);
            const totalCharges =
              (selectedVoucher.other_charges || 0) +
              (selectedVoucher.freight_charges || 0) +
              (selectedVoucher.labour_charges || 0);
            const activePatDef = PATTERN_TABS.find((p) => p.key === activePattern);

            return (
              <View style={styles.detailSheet}>
                <View style={styles.sheetHandle} />

                {/* MODAL HEADER ROW: BILL NO + PATTERN BADGE + CLOSE */}
                <View style={styles.detailHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.detailBillNoRow}>
                      <Ionicons name="receipt-outline" size={17} color="#0047AB" style={{ marginRight: 6 }} />
                      <Text style={styles.detailBillNo}>{selectedVoucher.bill_no}</Text>
                      {selectedVoucher.vch_series ? (
                        <View style={styles.vchSeriesPill}>
                          <Text style={styles.vchSeriesText}>{selectedVoucher.vch_series}</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.detailDateBadgeRow}>
                      <Feather name="calendar" size={12} color="#5A6B87" style={{ marginRight: 4 }} />
                      <Text style={styles.detailBillDate}>Dated: {selectedVoucher.bill_date}</Text>
                      <View style={styles.detailPatternBadge}>
                        <Text style={styles.detailPatternBadgeText}>{activePatDef?.label || 'ERP'}</Text>
                      </View>
                      <View
                        style={[
                          styles.modeBadge,
                          {
                            backgroundColor: badgeStyle.bg,
                            borderColor: badgeStyle.border,
                            paddingVertical: 1,
                            paddingHorizontal: 6,
                          },
                        ]}
                      >
                        <Text style={[styles.modeBadgeText, { color: badgeStyle.text, fontSize: 9 }]}>
                          {selectedVoucher.mode_type}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseCircle}
                    onPress={() => setSelectedVoucher(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={18} color="#5A6B87" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                  {/* SECTION 1: PARTY & COMMERCIAL PROFILE */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeaderRow}>
                      <Feather name="user-check" size={13} color="#0047AB" style={{ marginRight: 6 }} />
                      <Text style={styles.detailSectionHeader}>PARTY & COMMERCIAL PARTICULARS</Text>
                    </View>

                    <View style={styles.detailItemRow}>
                      <Text style={styles.detailItemKey}>Retailer / Party Name</Text>
                      <Text style={[styles.detailItemVal, { color: '#0047AB', fontWeight: '800' }]}>
                        {selectedVoucher.party_name}
                      </Text>
                    </View>

                    {selectedVoucher.party_gstin ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>GSTIN / UIN</Text>
                        <Text style={[styles.detailItemVal, styles.gstinVal]}>
                          {selectedVoucher.party_gstin}
                        </Text>
                      </View>
                    ) : null}

                    {selectedVoucher.party_phone ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Contact Phone</Text>
                        <View style={styles.detailPhoneActions}>
                          <Text style={styles.detailItemVal}>{selectedVoucher.party_phone}</Text>
                          <TouchableOpacity
                            onPress={() => handleCallParty(selectedVoucher.party_phone)}
                            style={styles.inlinePhoneBtn}
                          >
                            <Feather name="phone" size={12} color="#0047AB" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}

                    {selectedVoucher.code ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Party Code</Text>
                        <Text style={styles.detailItemVal}>{selectedVoucher.code}</Text>
                      </View>
                    ) : null}

                    {selectedVoucher.beat ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Beat / Route</Text>
                        <Text style={styles.detailItemVal}>{selectedVoucher.beat}</Text>
                      </View>
                    ) : null}

                    {selectedVoucher.mc_name ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Market Center (MC)</Text>
                        <Text style={styles.detailItemVal}>{selectedVoucher.mc_name}</Text>
                      </View>
                    ) : null}

                    {selectedVoucher.place_of_supply || selectedVoucher.state ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Place of Supply / State</Text>
                        <Text style={styles.detailItemVal}>
                          {[selectedVoucher.place_of_supply, selectedVoucher.state].filter(Boolean).join(', ')}
                        </Text>
                      </View>
                    ) : null}

                    {selectedVoucher.address_1 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Address / Pincode</Text>
                        <Text style={styles.detailItemVal}>
                          {selectedVoucher.address_1} {selectedVoucher.pincode ? `(${selectedVoucher.pincode})` : ''}
                        </Text>
                      </View>
                    ) : null}

                    {selectedVoucher.regn_type ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Registration Type</Text>
                        <Text style={styles.detailItemVal}>{selectedVoucher.regn_type}</Text>
                      </View>
                    ) : null}

                    {selectedVoucher.fse_detail ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Sales Executive (FSE)</Text>
                        <Text style={styles.detailItemVal}>{selectedVoucher.fse_detail}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* SECTION 2: ITEM & INVENTORY DETAILS */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeaderRow}>
                      <Ionicons name="cube-outline" size={13} color="#0047AB" style={{ marginRight: 6 }} />
                      <Text style={styles.detailSectionHeader}>ITEM & INVENTORY PARTICULARS</Text>
                    </View>

                    <View style={styles.detailItemRow}>
                      <Text style={styles.detailItemKey}>Item Name</Text>
                      <Text style={[styles.detailItemVal, { fontWeight: '800' }]}>
                        {selectedVoucher.item_name}
                      </Text>
                    </View>

                    <View style={styles.detailItemRow}>
                      <Text style={styles.detailItemKey}>HSN Code</Text>
                      <Text style={styles.detailItemVal}>{selectedVoucher.hsn || 'N/A'}</Text>
                    </View>

                    {selectedVoucher.category ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Category</Text>
                        <Text style={styles.detailItemVal}>{selectedVoucher.category}</Text>
                      </View>
                    ) : null}

                    {selectedVoucher.godown_name ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Godown / Location</Text>
                        <Text style={styles.detailItemVal}>{selectedVoucher.godown_name}</Text>
                      </View>
                    ) : null}

                    <View style={styles.detailItemRow}>
                      <Text style={styles.detailItemKey}>Billed Quantity</Text>
                      <Text style={styles.detailItemVal}>
                        {formatIndianNumber(selectedVoucher.quentity)} {selectedVoucher.unit || 'Units'}
                      </Text>
                    </View>

                    <View style={styles.detailItemRow}>
                      <Text style={styles.detailItemKey}>Unit Rate / Price</Text>
                      <Text style={styles.detailItemVal}>
                        {formatIndianCurrency(selectedVoucher.price)}
                      </Text>
                    </View>

                    <View style={styles.detailItemRow}>
                      <Text style={styles.detailItemKey}>Gross Item Total</Text>
                      <Text style={styles.detailItemVal}>
                        {formatIndianCurrency(selectedVoucher.price * selectedVoucher.quentity)}
                      </Text>
                    </View>
                  </View>

                  {/* SECTION 3: TAX & COMMERCIAL CHARGES BREAKDOWN */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeaderRow}>
                      <Feather name="percent" size={13} color="#0047AB" style={{ marginRight: 6 }} />
                      <Text style={styles.detailSectionHeader}>TAX & COMMERCIAL CHARGES</Text>
                    </View>

                    <View style={styles.detailItemRow}>
                      <Text style={styles.detailItemKey}>Taxable Value</Text>
                      <Text style={styles.detailItemVal}>
                        {formatIndianCurrency(
                          selectedVoucher.taxable_value ||
                            selectedVoucher.net_amount - totalTax + (selectedVoucher.discount || 0)
                        )}
                      </Text>
                    </View>

                    {(selectedVoucher.cgst || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>CGST Amount</Text>
                        <Text style={styles.detailItemVal}>
                          {formatIndianCurrency(selectedVoucher.cgst || 0)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.sgst || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>SGST Amount</Text>
                        <Text style={styles.detailItemVal}>
                          {formatIndianCurrency(selectedVoucher.sgst || 0)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.igst || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>IGST Amount</Text>
                        <Text style={styles.detailItemVal}>
                          {formatIndianCurrency(selectedVoucher.igst || 0)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.cess_amount || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>CESS Amount</Text>
                        <Text style={styles.detailItemVal}>
                          {formatIndianCurrency(selectedVoucher.cess_amount || 0)}
                        </Text>
                      </View>
                    ) : null}

                    {totalTax > 0 ? (
                      <View style={[styles.detailItemRow, styles.detailHighlightRow]}>
                        <Text style={[styles.detailItemKey, { fontWeight: '700', color: '#0047AB' }]}>
                          Total GST / Taxes
                        </Text>
                        <Text style={[styles.detailItemVal, { color: '#0047AB', fontWeight: '800' }]}>
                          {formatIndianCurrency(totalTax)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.discount || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Trade Discount</Text>
                        <Text style={[styles.detailItemVal, { color: '#D97706', fontWeight: '700' }]}>
                          -{formatIndianCurrency(selectedVoucher.discount)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.tcs_amount || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>TCS Amount</Text>
                        <Text style={styles.detailItemVal}>
                          {formatIndianCurrency(selectedVoucher.tcs_amount || 0)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.tds_amount || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>TDS Amount</Text>
                        <Text style={styles.detailItemVal}>
                          -{formatIndianCurrency(selectedVoucher.tds_amount || 0)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.freight_charges || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Freight Charges</Text>
                        <Text style={styles.detailItemVal}>
                          {formatIndianCurrency(selectedVoucher.freight_charges || 0)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.labour_charges || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Labour Charges</Text>
                        <Text style={styles.detailItemVal}>
                          {formatIndianCurrency(selectedVoucher.labour_charges || 0)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.other_charges || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Other Charges</Text>
                        <Text style={styles.detailItemVal}>
                          {formatIndianCurrency(selectedVoucher.other_charges || 0)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* SECTION 4: SETTLEMENT & AUDIT TRAIL */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailSectionHeaderRow}>
                      <Ionicons name="card-outline" size={13} color="#0047AB" style={{ marginRight: 6 }} />
                      <Text style={styles.detailSectionHeader}>SETTLEMENT & AUDIT TRAIL</Text>
                    </View>

                    <View style={styles.detailItemRow}>
                      <Text style={styles.detailItemKey}>Payment Mode</Text>
                      <Text style={[styles.detailItemVal, { fontWeight: '700' }]}>
                        {selectedVoucher.mode_type}
                      </Text>
                    </View>

                    {(selectedVoucher.cash_amount || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Cash Paid</Text>
                        <Text style={styles.detailItemVal}>
                          {formatIndianCurrency(selectedVoucher.cash_amount || 0)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.online_amount || 0) > 0 ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Online / UPI</Text>
                        <Text style={styles.detailItemVal}>
                          {formatIndianCurrency(selectedVoucher.online_amount || 0)}
                        </Text>
                      </View>
                    ) : null}

                    {(selectedVoucher.cheque_amount || 0) > 0 ? (
                      <>
                        <View style={styles.detailItemRow}>
                          <Text style={styles.detailItemKey}>Cheque Paid</Text>
                          <Text style={styles.detailItemVal}>
                            {formatIndianCurrency(selectedVoucher.cheque_amount || 0)}
                          </Text>
                        </View>
                        {selectedVoucher.cheque_no ? (
                          <View style={styles.detailItemRow}>
                            <Text style={styles.detailItemKey}>Cheque No & Date</Text>
                            <Text style={styles.detailItemVal}>
                              #{selectedVoucher.cheque_no} {selectedVoucher.cheque_date ? `(${selectedVoucher.cheque_date})` : ''}
                            </Text>
                          </View>
                        ) : null}
                        {selectedVoucher.cheque_bank || selectedVoucher.deposit_bank ? (
                          <View style={styles.detailItemRow}>
                            <Text style={styles.detailItemKey}>Bank Name</Text>
                            <Text style={styles.detailItemVal}>
                              {selectedVoucher.cheque_bank || selectedVoucher.deposit_bank}
                            </Text>
                          </View>
                        ) : null}
                      </>
                    ) : null}

                    {selectedVoucher.reverse_charge ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Reverse Charge (RCM)</Text>
                        <Text style={styles.detailItemVal}>
                          {selectedVoucher.reverse_charge === 'Y' || selectedVoucher.reverse_charge === 'Yes' ? 'Yes' : 'No'}
                        </Text>
                      </View>
                    ) : null}

                    {selectedVoucher.message_txn_id ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Message Txn ID</Text>
                        <Text style={styles.detailItemVal}>{selectedVoucher.message_txn_id}</Text>
                      </View>
                    ) : null}

                    {selectedVoucher.source ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Source System</Text>
                        <Text style={styles.detailItemVal}>{selectedVoucher.source}</Text>
                      </View>
                    ) : null}

                    {selectedVoucher.remark ? (
                      <View style={styles.detailItemRow}>
                        <Text style={styles.detailItemKey}>Remark / Narration</Text>
                        <Text style={styles.detailItemVal}>{selectedVoucher.remark}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* HERO NET VALUE CARD */}
                  <View style={styles.detailNetCard}>
                    <Text style={styles.detailNetLabel}>CONSOLIDATED NET BILL AMOUNT</Text>
                    <Text style={styles.detailNetVal}>
                      {formatIndianCurrency(selectedVoucher.net_amount)}
                    </Text>
                    <View style={styles.detailNetBreakupRow}>
                      <Text style={styles.detailNetBreakupText}>
                        Qty: {formatIndianNumber(selectedVoucher.quentity)} Units
                      </Text>
                      <Text style={styles.detailNetBreakupDivider}>•</Text>
                      <Text style={styles.detailNetBreakupText}>
                        Mode: {selectedVoucher.mode_type}
                      </Text>
                      {totalTax > 0 ? (
                        <>
                          <Text style={styles.detailNetBreakupDivider}>•</Text>
                          <Text style={styles.detailNetBreakupText}>
                            Tax: {formatIndianCurrency(totalTax)}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                </ScrollView>

                {/* BOTTOM ACTION BAR */}
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

                  {selectedVoucher.party_phone ? (
                    <TouchableOpacity
                      style={styles.detailCallBtn}
                      onPress={() => handleCallParty(selectedVoucher.party_phone)}
                      activeOpacity={0.8}
                    >
                      <Feather name="phone" size={16} color="#0047AB" />
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.detailCloseBtn}
                    onPress={() => setSelectedVoucher(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.detailCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
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
    paddingHorizontal: 10,
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
  },
  headerActionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F8FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
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
  searchAndDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 5,
  },
  calendarFilterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
    maxWidth: 80,
  },
  searchBox: {
    flex: 1,
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

  // 2.5 ACCOUNTING PATTERN STRIP
  patternSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  patternHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternHeaderTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8FA0B8',
    letterSpacing: 0.6,
  },
  patternActiveBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  patternActiveLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0047AB',
  },
  patternScrollContent: {
    paddingHorizontal: 14,
    gap: 8,
    paddingVertical: 2,
  },
  patternTabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  patternTabBtnActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  patternTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
    letterSpacing: 0.4,
  },
  patternTabTextActive: {
    color: '#FFFFFF',
  },

  // 3. SUMMARY BAR (2-ROW BALANCED DESIGN)
  summaryBar: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryBillsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  summaryBillsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  summaryNetGroup: {
    alignItems: 'flex-end',
  },
  summaryNetLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5A6B87',
    letterSpacing: 0.5,
  },
  summaryNetValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0047AB',
    marginTop: 1,
  },
  summarySubDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  summaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summarySubItem: {
    flex: 1,
    alignItems: 'center',
  },
  summarySubDividerVert: {
    width: 1,
    height: 22,
    backgroundColor: '#DFE7F2',
  },
  summarySubLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5A6B87',
    marginBottom: 2,
  },
  summarySubValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
  },
  summaryTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryTile: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  summaryTileLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8FA0B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  summaryTileVal: {
    fontSize: 12,
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
    paddingHorizontal: 2,
  },
  metricColQty: {
    flex: 0.85,
  },
  metricColNet: {
    flex: 1.35,
    borderLeftWidth: 1,
    borderLeftColor: '#DFE7F2',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingVertical: 2,
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
    maxHeight: '88%',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailBillNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBillNo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: -0.2,
  },
  vchSeriesPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  vchSeriesText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16A34A',
  },
  contextualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailDateBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
    flexWrap: 'wrap',
  },
  detailBillDate: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
  },
  detailPatternBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  detailPatternBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0047AB',
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
  detailSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
  },
  detailSectionHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 0.5,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    alignItems: 'center',
  },
  detailHighlightRow: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailItemKey: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
    flex: 1,
  },
  detailItemVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E204E',
    textAlign: 'right',
    maxWidth: '65%',
  },
  gstinVal: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: '#0E204E',
  },
  detailPhoneActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlinePhoneBtn: {
    padding: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
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
  detailNetBreakupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  detailNetBreakupText: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
  },
  detailNetBreakupDivider: {
    fontSize: 11,
    color: '#94A3B8',
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    alignItems: 'center',
  },
  detailShareBtn: {
    flex: 1,
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
  detailCallBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCloseBtn: {
    paddingHorizontal: 16,
    height: 44,
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
