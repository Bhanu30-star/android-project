import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  fetchInvoiceListApi,
  InvoiceRecord,
  InvoiceFilters,
} from '@/api/invoiceList';
import { BillMoveBackDateModal } from './BillMoveBackDateModal';
import { InvoiceFiltersModal } from './InvoiceFiltersModal';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import { CancelBillModal } from './CancelBillModal';
import { FseLocationModal } from './FseLocationModal';

export const InvoiceListScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Search input state
  const [search, setSearch] = useState('');

  // Default filters
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [filters, setFilters] = useState<InvoiceFilters>({
    type: 'get_bill_book_data',
    party: '',
    fos_user_id: '',
    bill_no: '',
    start_date: todayStr,
    end_date: todayStr,
    page: 1,
    limit: 50,
  });

  // Data state
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [activeBackDateTxn, setActiveBackDateTxn] = useState<number | string | null>(null);
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState<InvoiceRecord | null>(null);
  const [activeDeleteInvoice, setActiveDeleteInvoice] = useState<InvoiceRecord | null>(null);
  const [activeLocationInvoice, setActiveLocationInvoice] = useState<InvoiceRecord | null>(null);

  // Load Invoices
  const loadInvoices = useCallback(
    async (isPull = false, customFilters?: InvoiceFilters) => {
      const activeF = customFilters || filters;
      if (isPull) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const { rows, total } = await fetchInvoiceListApi(activeF);
        setInvoices(rows);
        setTotalRecords(total);
      } catch {
        setInvoices([]);
        setTotalRecords(0);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Client-side quick search filtering
  const filteredInvoices = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase().trim();
    return invoices.filter(
      (inv) =>
        (inv.party_name && inv.party_name.toLowerCase().includes(q)) ||
        (inv.transaction_bill_number &&
          inv.transaction_bill_number.toLowerCase().includes(q)) ||
        (inv.user_name && inv.user_name.toLowerCase().includes(q)) ||
        (inv.payment_mode && inv.payment_mode.toLowerCase().includes(q))
    );
  }, [invoices, search]);

  const hasActiveFilters = Boolean(
    filters.party ||
      filters.fos_user_id ||
      filters.bill_no ||
      filters.type === 'get_challan_book_data' ||
      filters.start_date !== todayStr ||
      filters.end_date !== todayStr
  );

  // Render individual card (Pixel-perfect match to Screenshot 1)
  const renderItem = ({ item }: { item: InvoiceRecord }) => {
    const partyInitial = (item.party_name || 'C').charAt(0).toUpperCase();
    const billNo = item.transaction_bill_number || `H0000${item.transaction_id}`;
    const amount = Number(item.final_amt || item.total_amount || 0).toFixed(1);
    const fosName = item.user_name || 'FOS1';
    const dateTime = item.bill_date_time || item.bill_date || '01-Nov-2026 00:00:00';
    const billType = item.bill_type || 'Tax Invoice';
    const paymentMode = item.payment_mode || 'Cash';

    const cashAmt = Number(item.r_cash_amt ?? 0).toFixed(1);
    const chequeAmt = Number(item.r_cheque_amt ?? 0).toFixed(1);
    const adjustAmt = Number(item.r_adjust_amt ?? 0).toFixed(1);

    return (
      <View style={styles.card}>
        {/* Top Line: Avatar circle, Bill No, Amount */}
        <View style={styles.cardTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{partyInitial}</Text>
          </View>

          <View style={styles.cardHeaderInfo}>
            <Text style={styles.billNoText}>{billNo}</Text>
            <Text style={styles.fosText}>{fosName}</Text>
          </View>

          <Text style={styles.amountText}>₹{amount}</Text>
        </View>

        {/* Storefront party name & Date-Time */}
        <View style={styles.storeDateRow}>
          <View style={styles.storeContainer}>
            <Feather name="home" size={14} color="#94A3B8" />
            <Text style={styles.partyNameText} numberOfLines={1}>
              {item.party_name}
            </Text>
          </View>

          <Text style={styles.dateText}>{dateTime}</Text>
        </View>

        {/* Badges: Tax Invoice & Cash */}
        <View style={styles.badgeRow}>
          <View style={styles.taxInvoiceBadge}>
            <View style={styles.dotPurple} />
            <Text style={styles.taxInvoiceText}>{billType}</Text>
          </View>

          <View style={styles.paymentModeBadge}>
            <View style={styles.dotTeal} />
            <Text style={styles.paymentModeText}>{paymentMode}</Text>
          </View>
        </View>

        {/* Divider line inside card */}
        <View style={styles.cardDivider} />

        {/* Bottom Line: Cash / Cheque / Adjust & Action Buttons */}
        <View style={styles.cardBottomRow}>
          <View style={styles.breakdownBox}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Cash</Text>
              <Text style={styles.breakdownVal}>₹{cashAmt}</Text>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Cheque</Text>
              <Text style={styles.breakdownVal}>₹{chequeAmt}</Text>
            </View>

            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Adjust</Text>
              <Text style={styles.breakdownVal}>₹{adjustAmt}</Text>
            </View>
          </View>

          {/* Action Buttons: ⇄, 📍, 📄, ✏️, 🗑️ */}
          <View style={styles.actionButtonsRow}>
            {/* 1. Move Back Date */}
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => setActiveBackDateTxn(item.transaction_id)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="swap-horizontal" size={19} color="#0047AB" />
            </TouchableOpacity>

            {/* 2. Location */}
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => setActiveLocationInvoice(item)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <Ionicons name="location-sharp" size={17} color="#0D9488" />
            </TouchableOpacity>

            {/* 3. Document / Receipt PDF */}
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => setActiveReceiptInvoice(item)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text" size={17} color="#2563EB" />
            </TouchableOpacity>

            {/* 4. Edit Bill */}
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => {
                router.push({
                  pathname: '/edit-invoice',
                  params: {
                    transaction_id: String(item.transaction_id),
                    bill_no: billNo,
                    party_name: item.party_name,
                  },
                } as any);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={16} color="#D97706" />
            </TouchableOpacity>

            {/* 5. Delete Bill */}
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={() => setActiveDeleteInvoice(item)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/dashboard');
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color="#0E204E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Invoice</Text>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setIsFiltersOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="filter" size={22} color="#0047AB" />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#5A6B87" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#5A6B87"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={16} color="#5A6B87" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Card List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0047AB" />
          <Text style={styles.loadingText}>Fetching invoices & bills...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => String(item.transaction_id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 24, 40) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadInvoices(true)}
              tintColor="#0047AB"
              colors={['#0047AB']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="file-text" size={40} color="#5A6B87" />
              <Text style={styles.emptyTitle}>No Invoices Found</Text>
              <Text style={styles.emptySubtitle}>
                {search.trim()
                  ? `No matching invoices for "${search}".`
                  : 'No invoices recorded for this date range. Tap + to generate one.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            filteredInvoices.length > 0 ? (
              <View style={styles.footerInfo}>
                <Text style={styles.footerText}>No more records</Text>
              </View>
            ) : (
              <View />
            )
          }
        />
      )}

      {/* MODAL 1: Bill Move To Back Date (Screenshot 4) */}
      <BillMoveBackDateModal
        visible={Boolean(activeBackDateTxn)}
        transactionId={activeBackDateTxn}
        onClose={() => setActiveBackDateTxn(null)}
        onSuccess={() => loadInvoices()}
      />

      {/* MODAL 2: Filter Bottom Sheet (Screenshot 2) */}
      <InvoiceFiltersModal
        visible={isFiltersOpen}
        filters={filters}
        onClose={() => setIsFiltersOpen(false)}
        onApply={(newF) => {
          setFilters(newF);
          loadInvoices(false, newF);
        }}
        onReset={() => {
          const resetF: InvoiceFilters = {
            type: 'get_bill_book_data',
            party: '',
            fos_user_id: '',
            bill_no: '',
            start_date: todayStr,
            end_date: todayStr,
            page: 1,
            limit: 50,
          };
          setFilters(resetF);
          loadInvoices(false, resetF);
        }}
      />

      {/* MODAL 3: Receipt PDF Details Modal */}
      <InvoiceReceiptModal
        visible={Boolean(activeReceiptInvoice)}
        invoice={activeReceiptInvoice}
        onClose={() => setActiveReceiptInvoice(null)}
      />

      {/* MODAL 4: Cancel / Delete Bill Modal */}
      <CancelBillModal
        visible={Boolean(activeDeleteInvoice)}
        invoice={activeDeleteInvoice}
        onClose={() => setActiveDeleteInvoice(null)}
        onSuccess={() => loadInvoices()}
      />

      {/* MODAL 5: FSE Location Modal */}
      <FseLocationModal
        visible={Boolean(activeLocationInvoice)}
        invoice={activeLocationInvoice}
        onClose={() => setActiveLocationInvoice(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
    height: 48,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F1FC',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0047AB',
  },
  cardHeaderInfo: {
    flex: 1,
  },
  billNoText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: 0.3,
  },
  fosText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
    marginTop: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0047AB',
  },
  storeDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  storeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  partyNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#5A6B87',
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  taxInvoiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dotPurple: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0047AB',
  },
  taxInvoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  paymentModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dotTeal: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  paymentModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownBox: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownItem: {
    alignItems: 'flex-start',
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#5A6B87',
    fontWeight: '600',
    marginBottom: 2,
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconActionBtn: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  footerText: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '600',
  },
});
