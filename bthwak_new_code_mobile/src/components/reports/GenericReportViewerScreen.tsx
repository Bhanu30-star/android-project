import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  fetchPurchaseRegisterApi,
  fetchSaleReturnRegisterApi,
  fetchDistStockRegisterApi,
  fetchDamageStockRegisterApi,
  fetchSalesExecSaleSummaryApi,
  fetchStockSummaryReportApi,
  fetchExpenseMasterApi,
} from '@/api/reports';
import { formatIndianCurrency, formatIndianNumber } from '@/utils/formatters';
import {
  DateRangePickerModal,
  DatePresetKey,
  formatDateToIso,
  formatReadableDate,
} from '@/components/common/DateRangePickerModal';

export interface GenericRecord {
  id: string | number;
  voucher_no: string;
  voucher_date: string;
  title: string;
  subtitle: string;
  code?: string;
  party_phone?: string;
  quantity: number;
  rate: number;
  tax_or_disc: number;
  net_amount: number;
  status: string;
  statusColor?: string;
  mode?: string;
  details?: Record<string, string | number>;
}

export const GenericReportViewerScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);

  const params = useLocalSearchParams<{ id?: string; title?: string; category?: string }>();
  const reportId = (params.id || 'report').toLowerCase();
  const reportTitle = params.title || 'Report Statement';
  const reportCategory = params.category || 'General';

  // Dates state
  const [datePreset, setDatePreset] = useState<DatePresetKey>('last_7_days');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDateToIso(d);
  });
  const [toDate, setToDate] = useState(() => formatDateToIso(new Date()));

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Modals state
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [actionSheetRecord, setActionSheetRecord] = useState<GenericRecord | null>(null);
  const [selectedItem, setSelectedItem] = useState<GenericRecord | null>(null);

  // Data state
  const [records, setRecords] = useState<GenericRecord[]>([]);

  // Load records based on report type
  const loadData = useCallback(async (isPull = false) => {
    if (isPull) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (reportId.includes('distributor_stock')) {
        const res = await fetchDistStockRegisterApi({
          date: toDate,
          search: search.trim(),
        });
        const mapped: GenericRecord[] = (res.data || []).map((s) => ({
          id: s.id,
          voucher_no: `GST: ${s.gst}%`,
          voucher_date: formatReadableDate(toDate),
          title: s.product_name,
          subtitle: s.category || 'General',
          code: `Open: ${s.opening_stock} | Inward: ${s.add_stock}`,
          quantity: s.closing_stock,
          rate: 0,
          tax_or_disc: s.transfer_stock + s.purchase_return,
          net_amount: s.total_stock,
          status: s.closing_stock > 10 ? 'In Stock' : s.closing_stock > 0 ? 'Low Stock' : 'Out of Stock',
          statusColor: s.closing_stock > 10 ? '#16A34A' : s.closing_stock > 0 ? '#D97706' : '#DC2626',
          mode: 'Warehouse Stock',
          details: {
            'Product': s.product_name,
            'Category': s.category,
            'Opening Stock': `${s.opening_stock} Units`,
            'Added Inward': `${s.add_stock} Units`,
            'Transfer Stock': `${s.transfer_stock} Units`,
            'FSE Return': `${s.fse_return} Units`,
            'Purchase Return': `${s.purchase_return} Units`,
            'Total Stock': `${s.total_stock} Units`,
            'Closing Balance': `${s.closing_stock} Units`,
          },
        }));
        setRecords(mapped);
      } else if (reportId.includes('damage') || reportId.includes('waste')) {
        const res = await fetchDamageStockRegisterApi({
          from_date: fromDate,
          to_date: toDate,
        });
        const mapped: GenericRecord[] = (res.data || []).map((d) => ({
          id: d.id,
          voucher_no: d.reference_no,
          voucher_date: d.transaction_date,
          title: d.product_name,
          subtitle: d.remark || 'Scrap / Damage Stock',
          code: d.transaction_time ? `Time: ${d.transaction_time}` : undefined,
          quantity: d.quantity,
          rate: d.rate,
          tax_or_disc: 0,
          net_amount: d.amount,
          status: 'Damage Logged',
          statusColor: '#DC2626',
          mode: 'Scrap Write-off',
          details: {
            'Product Name': d.product_name,
            'Reference No': d.reference_no,
            'Date': d.transaction_date,
            'Time': d.transaction_time || 'N/A',
            'Quantity': `${d.quantity} Units`,
            'Rate': formatIndianCurrency(d.rate),
            'Total Loss Amount': formatIndianCurrency(d.amount),
            'Remarks': d.remark || 'Damage / Waste item',
          },
        }));
        setRecords(mapped);
      } else if (reportId.includes('sale_return') || reportId.includes('return')) {
        const res = await fetchSaleReturnRegisterApi({
          from_date: fromDate,
          to_date: toDate,
          search: search.trim(),
        });
        const mapped: GenericRecord[] = (res.data || []).map((r) => ({
          id: r.id,
          voucher_no: r.bill_no,
          voucher_date: r.bill_date,
          title: r.party_name,
          subtitle: `Credit Note • ${r.credit_note_type}`,
          code: r.bill_time ? `Time: ${r.bill_time}` : undefined,
          quantity: 1,
          rate: r.final_net_amt,
          tax_or_disc: r.adjust_amount,
          net_amount: r.final_net_amt,
          status: r.pending_amount > 0 ? 'Pending' : 'Adjusted',
          statusColor: r.pending_amount > 0 ? '#D97706' : '#16A34A',
          mode: 'Credit Note',
          details: {
            'Party Name': r.party_name,
            'Credit Note No': r.bill_no,
            'Date': r.bill_date,
            'Net Amount': formatIndianCurrency(r.final_net_amt),
            'Adjusted Amount': formatIndianCurrency(r.adjust_amount),
            'Pending Amount': formatIndianCurrency(r.pending_amount),
            'Note Type': r.credit_note_type || 'Credit Note',
          },
        }));
        setRecords(mapped);
      } else if (reportId.includes('sales_exec') || reportId.includes('executive')) {
        const res = await fetchSalesExecSaleSummaryApi({
          year_month: toDate.slice(0, 7),
        });
        const mapped: GenericRecord[] = (res.rows || []).map((r) => {
          const userDetails: Record<string, string | number> = {
            'Day': `Day ${r.day}`,
            'Month': toDate.slice(0, 7),
            'Total Daily Sales': formatIndianCurrency(r.total),
          };
          (res.headers || []).forEach((h, idx) => {
            const val = r.values?.[idx] ?? 0;
            if (val > 0) {
              userDetails[h.user_name] = formatIndianCurrency(val);
            }
          });
          return {
            id: r.day,
            voucher_no: `Day ${r.day}`,
            voucher_date: `${toDate.slice(0, 7)}-${String(r.day).padStart(2, '0')}`,
            title: `Day ${r.day} Sales Summary`,
            subtitle: `${res.headers?.length || 0} Executives Field Record`,
            quantity: 1,
            rate: r.total,
            tax_or_disc: 0,
            net_amount: r.total,
            status: r.total > 0 ? 'Achieved' : 'No Sales',
            statusColor: r.total > 0 ? '#16A34A' : '#94A3B8',
            mode: 'Field Sales',
            details: userDetails,
          };
        });
        setRecords(mapped);
      } else if (reportId.includes('purchase')) {
        const res = await fetchPurchaseRegisterApi({
          from_date: fromDate,
          to_date: toDate,
          search: search.trim(),
        });
        const mapped: GenericRecord[] = (res.data || []).map((p) => ({
          id: p.id,
          voucher_no: p.bill_no,
          voucher_date: p.bill_date,
          title: p.item_name || 'Purchase Entry',
          subtitle: p.supplier_name,
          party_phone: p.supplier_phone,
          code: p.hsn ? `HSN: ${p.hsn}` : undefined,
          quantity: p.quantity,
          rate: p.purchase_rate,
          tax_or_disc: p.tax_amount,
          net_amount: p.net_amount,
          status: 'Audited',
          statusColor: '#16A34A',
          mode: p.mode_type,
          details: {
            'Supplier': p.supplier_name,
            'Bill No': p.bill_no,
            'Bill Date': p.bill_date,
            'Item': p.item_name,
            'Purchase Type': p.invoice_type || 'Inward Purchase',
            'Payment Mode': p.mode_type || 'Credit',
            'HSN': p.hsn || 'N/A',
            'Tax Amount': formatIndianCurrency(p.tax_amount),
            'Net Amount': formatIndianCurrency(p.net_amount),
          },
        }));
        setRecords(mapped);
      } else if (reportId.includes('stock')) {
        const res = await fetchStockSummaryReportApi({
          search: search.trim(),
        });
        const mapped: GenericRecord[] = (res.data || []).map((s) => ({
          id: s.id,
          voucher_no: s.sku,
          voucher_date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          title: s.product_name,
          subtitle: s.category_name,
          code: `SKU: ${s.sku}`,
          quantity: s.closing_stock,
          rate: s.closing_stock > 0 ? Math.round(s.valuation_amount / s.closing_stock) : 0,
          tax_or_disc: s.outward_qty,
          net_amount: s.valuation_amount,
          status: s.status,
          statusColor: s.status === 'In Stock' ? '#16A34A' : s.status === 'Low Stock' ? '#D97706' : '#DC2626',
          mode: 'Warehouse',
          details: {
            Category: s.category_name,
            OpeningStock: `${s.opening_stock} Units`,
            InwardReceipts: `${s.inward_qty} Units`,
            OutwardSales: `${s.outward_qty} Units`,
            StockBalance: `${s.closing_stock} Units`,
          },
        }));
        setRecords(mapped);
      } else if (reportId.includes('expense')) {
        const res = await fetchExpenseMasterApi({
          from_date: fromDate,
          to_date: toDate,
          search: search.trim(),
        });
        const mapped: GenericRecord[] = (res.data || []).map((e) => ({
          id: e.id,
          voucher_no: e.voucher_no,
          voucher_date: e.voucher_date,
          title: e.head_name,
          subtitle: `Paid to: ${e.paid_to}`,
          code: e.bank_name || 'Cash Till',
          quantity: 1,
          rate: e.amount,
          tax_or_disc: 0,
          net_amount: e.amount,
          status: 'Paid',
          statusColor: '#16A34A',
          mode: e.payment_mode,
          details: {
            Head: e.head_name,
            Payee: e.paid_to,
            Account: e.bank_name || 'Cash Till',
            Remarks: e.remark || 'Audited commercial expense',
          },
        }));
        setRecords(mapped);
      } else {
        // No fake mock data - return clean empty list
        setRecords([]);
      }
    } catch {
      setRecords([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [reportId, fromDate, toDate, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(t);
  }, [loadData]);

  const getDateLabel = () => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'last_7_days') return '7 Days';
    if (datePreset === 'this_month') return 'This Month';
    if (datePreset === 'last_30_days') return '30 Days';
    if (datePreset === 'this_year') return 'FY Year';
    return `${fromDate.slice(5)} - ${toDate.slice(5)}`;
  };

  // Client search filter
  const displayedRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.trim().toLowerCase();
    return records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.voucher_no.toLowerCase().includes(q) ||
        (r.code && r.code.toLowerCase().includes(q))
    );
  }, [records, search]);

  // Aggregate Metrics
  const summary = useMemo(() => {
    const totalEntries = displayedRecords.length;
    let totalQty = 0;
    let totalTaxOrDisc = 0;
    let totalNet = 0;

    displayedRecords.forEach((r) => {
      totalQty += r.quantity;
      totalTaxOrDisc += r.tax_or_disc;
      totalNet += r.net_amount;
    });

    return { totalEntries, totalQty, totalTaxOrDisc, totalNet };
  }, [displayedRecords]);

  // Scroll to Top
  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Share
  const handleShareVoucher = async (item: GenericRecord) => {
    const msg =
      `*${reportTitle.toUpperCase()}* 🧾\n` +
      `--------------------------------\n` +
      `*Voucher:* ${item.voucher_no}\n` +
      `*Date:* ${item.voucher_date}\n` +
      `*Title:* ${item.title}\n` +
      `*Entity:* ${item.subtitle}\n` +
      (item.code ? `*Code:* ${item.code}\n` : '') +
      `*Quantity:* ${item.quantity}\n` +
      `*Net Amount:* ${formatIndianCurrency(item.net_amount)}\n` +
      `*Status:* ${item.status}\n` +
      `--------------------------------\n` +
      `BTHAWK Enterprise ERP Statement.`;

    try {
      await Share.share({ message: msg, title: item.voucher_no });
    } catch {}
  };

  const handleCallParty = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No contact number available for this entry.');
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
          >
            <Feather name="arrow-left" size={22} color="#0E204E" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {reportTitle}
            </Text>
            <Text style={styles.headerCategory}>{reportCategory} • ERP Register</Text>
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
            style={styles.headerRefreshBtn}
            onPress={() => loadData(true)}
            activeOpacity={0.7}
          >
            <Feather name="rotate-cw" size={16} color="#0E204E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. FULL-WIDTH SEARCH BAR */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#8FA0B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reference, party, product, voucher..."
            placeholderTextColor="#8FA0B8"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x-circle" size={15} color="#8FA0B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 3. METRIC SUMMARY BAR */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Entries</Text>
          <Text style={styles.summaryValue}>{summary.totalEntries}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Qty</Text>
          <Text style={styles.summaryValue}>{formatIndianNumber(summary.totalQty)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Tax/Disc</Text>
          <Text style={[styles.summaryValue, { color: '#D97706' }]}>
            {formatIndianCurrency(summary.totalTaxOrDisc)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Consolidated</Text>
          <Text style={[styles.summaryValue, { color: '#0047AB' }]}>
            {formatIndianCurrency(summary.totalNet)}
          </Text>
        </View>
      </View>

      {/* 4. MAIN SCROLLVIEW & CARDS */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
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
            <Text style={styles.loaderText}>Compiling statement register...</Text>
          </View>
        ) : displayedRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="file-text" size={32} color="#8FA0B8" />
            </View>
            <Text style={styles.emptyTitle}>No Entries Recorded</Text>
            <Text style={styles.emptySubtitle}>No records match the current filter range.</Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearch('');
                setDatePreset('last_7_days');
                const now = new Date();
                const d = new Date();
                d.setDate(d.getDate() - 7);
                setFromDate(formatDateToIso(d));
                setToDate(formatDateToIso(now));
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.resetFilterBtnText}>Reset Filter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedRecords.map((item) => (
            <TouchableOpacity
              key={`${item.id}-${item.voucher_no}`}
              style={styles.voucherCard}
              activeOpacity={0.9}
              onPress={() => setActionSheetRecord(item)}
            >
              {/* CARD ROW 1: BILL/VOUCHER NUMBER + STATUS BADGE + 3-DOT KEBAB */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.voucherNoWrap}>
                  <Ionicons name="receipt-outline" size={15} color="#0047AB" style={{ marginRight: 6 }} />
                  <Text style={styles.billNumber}>{item.voucher_no}</Text>
                </View>

                <View style={styles.cardHeaderRight}>
                  <View
                    style={[
                      styles.modeBadge,
                      {
                        backgroundColor:
                          item.status === 'Cancelled' ? '#FEF2F2' : '#EFF6FF',
                        borderColor:
                          item.status === 'Cancelled' ? '#FECACA' : '#BFDBFE',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeBadgeText,
                        { color: item.statusColor || '#0047AB' },
                      ]}
                    >
                      {item.mode || item.status}
                    </Text>
                  </View>

                  {/* 3-DOT KEBAB BUTTON */}
                  <TouchableOpacity
                    style={styles.kebabBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setActionSheetRecord(item);
                    }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.7}
                  >
                    <Feather name="more-vertical" size={18} color="#5A6B87" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CARD ROW 2: TITLE & DATE */}
              <View style={styles.productDateRow}>
                <Text style={styles.productName} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.billDate}>{item.voucher_date}</Text>
              </View>

              {/* CARD ROW 3: REFERENCE CODE */}
              {item.code ? <Text style={styles.hsnText}>{item.code}</Text> : null}

              {/* CARD ROW 4: SUBTITLE / PARTY NAME */}
              <View style={styles.partyRow}>
                <Feather name="user" size={12} color="#5A6B87" style={{ marginRight: 5 }} />
                <Text style={styles.partyName} numberOfLines={1}>
                  {item.subtitle}
                </Text>
                {item.party_phone ? (
                  <Text style={styles.partyPhone}>• {item.party_phone}</Text>
                ) : null}
              </View>

              {/* CARD ROW 5: 4-COLUMN METRICS */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>{formatIndianNumber(item.quantity)}</Text>
                  <Text style={styles.metricLabel}>Qty</Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>{formatIndianCurrency(item.rate)}</Text>
                  <Text style={styles.metricLabel}>Rate</Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricVal}>{formatIndianCurrency(item.tax_or_disc)}</Text>
                  <Text style={styles.metricLabel}>Tax/Disc</Text>
                </View>

                <View style={[styles.metricCol, styles.metricColNet]}>
                  <Text style={[styles.metricVal, styles.metricValNet]}>
                    {formatIndianCurrency(item.net_amount)}
                  </Text>
                  <Text style={styles.metricLabelNet}>Net</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 5. FLOATING SCROLL TOP BUTTON */}
      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopFab}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <Feather name="chevron-up" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* 6. ACTION SHEET BOTTOM MODAL (Triggered by 3-dot kebab menu) */}
      <Modal
        visible={!!actionSheetRecord}
        transparent
        animationType="slide"
        onRequestClose={() => setActionSheetRecord(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setActionSheetRecord(null)}
          />

          {actionSheetRecord && (
            <View style={styles.actionSheetContent}>
              <View style={styles.sheetHandle} />

              <View style={styles.actionSheetHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionSheetVoucherNo}>{actionSheetRecord.voucher_no}</Text>
                  <Text style={styles.actionSheetPartyName} numberOfLines={1}>
                    {actionSheetRecord.title}
                  </Text>
                </View>
                <View style={styles.actionSheetAmountBadge}>
                  <Text style={styles.actionSheetAmountText}>
                    {formatIndianCurrency(actionSheetRecord.net_amount)}
                  </Text>
                </View>
              </View>

              <View style={styles.actionSheetDivider} />

              {/* Option 1: View Details */}
              <TouchableOpacity
                style={styles.actionSheetRow}
                onPress={() => {
                  const r = actionSheetRecord;
                  setActionSheetRecord(null);
                  setSelectedItem(r);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="document-text-outline" size={20} color="#0047AB" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionRowTitle}>View Detailed Statement</Text>
                  <Text style={styles.actionRowSub}>Full breakdown, ledger details & audit log</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#8FA0B8" />
              </TouchableOpacity>

              {/* Option 2: WhatsApp Share */}
              <TouchableOpacity
                style={styles.actionSheetRow}
                onPress={() => {
                  const r = actionSheetRecord;
                  setActionSheetRecord(null);
                  handleShareVoucher(r);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="#059669" />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text style={styles.actionRowTitle}>Share on WhatsApp</Text>
                  <Text style={styles.actionRowSub}>Send formatted statement record to recipient</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#8FA0B8" />
              </TouchableOpacity>

              {/* Option 3: Call Contact */}
              {actionSheetRecord.party_phone ? (
                <TouchableOpacity
                  style={styles.actionSheetRow}
                  onPress={() => {
                    const phone = actionSheetRecord.party_phone;
                    setActionSheetRecord(null);
                    handleCallParty(phone);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: '#F0F9FF' }]}>
                    <Feather name="phone-call" size={18} color="#0284C7" />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionRowTitle}>Call Contact</Text>
                    <Text style={styles.actionRowSub}>{actionSheetRecord.party_phone}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#8FA0B8" />
                </TouchableOpacity>
              ) : null}

              {/* Dismiss Button */}
              <TouchableOpacity
                style={styles.actionSheetCancelBtn}
                onPress={() => setActionSheetRecord(null)}
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
        title={`${reportTitle} Date Filter`}
      />

      {/* 8. DETAIL PREVIEW MODAL */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setSelectedItem(null)}
          />

          {selectedItem && (
            <View style={styles.detailSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.detailHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailVoucherNo}>{selectedItem.voucher_no}</Text>
                  <Text style={styles.detailDate}>{selectedItem.voucher_date}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseCircle}
                  onPress={() => setSelectedItem(null)}
                >
                  <Feather name="x" size={18} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>ENTRY PARTICULARS</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Title / Item</Text>
                    <Text style={styles.detailVal}>{selectedItem.title}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Entity / Party</Text>
                    <Text style={styles.detailVal}>{selectedItem.subtitle}</Text>
                  </View>
                  {selectedItem.code ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Reference Code</Text>
                      <Text style={styles.detailVal}>{selectedItem.code}</Text>
                    </View>
                  ) : null}
                  {selectedItem.party_phone ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailKey}>Phone</Text>
                      <Text style={styles.detailVal}>{selectedItem.party_phone}</Text>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Payment / Mode</Text>
                    <Text style={styles.detailVal}>{selectedItem.mode || '-'}</Text>
                  </View>
                </View>

                {selectedItem.details && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>LEDGER DETAILS</Text>
                    {Object.entries(selectedItem.details).map(([k, v]) => (
                      <View key={k} style={styles.detailRow}>
                        <Text style={styles.detailKey}>{k}</Text>
                        <Text style={styles.detailVal}>{String(v)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.detailNetCard}>
                  <Text style={styles.detailNetLabel}>NET VALUE</Text>
                  <Text style={styles.detailNetVal}>
                    {formatIndianCurrency(selectedItem.net_amount)}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.detailActionsRow}>
                <TouchableOpacity
                  style={styles.detailShareBtn}
                  onPress={() => handleShareVoucher(selectedItem)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.detailShareBtnText}>Share on WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={() => setSelectedItem(null)}
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
  headerCategory: {
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

  // 2. SEARCH BAR
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
  emptySubtitle: {
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
  voucherNoWrap: {
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

  // DETAIL SHEET
  detailSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '85%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailVoucherNo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0047AB',
  },
  detailDate: {
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
  detailSectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8FA0B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  detailKey: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
  },
  detailVal: {
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
