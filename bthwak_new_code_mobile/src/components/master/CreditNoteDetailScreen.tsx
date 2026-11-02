import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
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
  CreditNoteDetailItem,
  fetchCreditNoteDetailListApi,
  deleteCreditNoteDetailApi,
} from '@/api/creditNoteDetail';
import { AdjustCreditNoteModal } from './AdjustCreditNoteModal';
import { CreditNoteHistoryModal } from './CreditNoteHistoryModal';

interface CreditNoteDetailScreenProps {
  onBack?: () => void;
}

export const CreditNoteDetailScreen: React.FC<CreditNoteDetailScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();

  // Search & Filters
  const [search, setSearch] = useState('');
  const todayStr = formatYmd(new Date());
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [selectedParty, setSelectedParty] = useState<RetailerParty | null>(null);

  // Pickers & Modals
  const [partySheetVisible, setPartySheetVisible] = useState(false);
  const [fromDateVisible, setFromDateVisible] = useState(false);
  const [toDateVisible, setToDateVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // List & Status
  const [items, setItems] = useState<CreditNoteDetailItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Action Menu & Adjust Modal
  const [menuTargetItem, setMenuTargetItem] = useState<CreditNoteDetailItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<CreditNoteDetailItem | null>(null);

  // Load Credit Notes
  const loadCreditNotes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const res = await fetchCreditNoteDetailListApi({
        start_date: fromDate,
        end_date: toDate,
        party_name: selectedParty?.partyName || '',
        party_mobile_no: selectedParty?.partyPhone || '',
      });

      setItems(res.items || []);
    } catch (err: any) {
      console.warn('Error loading credit note list:', err?.message);
      setItems([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fromDate, toDate, selectedParty]);

  useEffect(() => {
    loadCreditNotes();
  }, [loadCreditNotes]);

  // Client-side search filtering
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (it) =>
        (it.party_name || '').toLowerCase().includes(q) ||
        (it.bill_no || '').toLowerCase().includes(q) ||
        (it.type || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  // Handle Delete Credit Note
  const handleDeleteItem = (it: CreditNoteDetailItem) => {
    setMenuTargetItem(null);
    Alert.alert(
      'Delete Credit Note',
      `Are you sure you want to delete Credit Note ${it.bill_no}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteCreditNoteDetailApi({
                unique_bill: it.unique_bill,
                bill_no: it.bill_no,
                party_id: it.party_id,
                credit_note_id: it.type === 'Direct' ? it.creditnote_id : undefined,
              });
              Alert.alert('Success', res?.message || 'Credit note deleted successfully.');
              loadCreditNotes();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete transaction.');
            }
          },
        },
      ]
    );
  };

  // Handle Share / Generate PDF
  const handleGeneratePdf = async (it: CreditNoteDetailItem) => {
    setMenuTargetItem(null);
    try {
      const billAmt = parseFloat(String(it.final_bill_amt || 0)).toFixed(2);
      const pendingAmt = parseFloat(String(it.pending_amount || 0)).toFixed(2);
      const text = `Credit Note: ${it.bill_no}\nParty: ${it.party_name}\nType: ${it.type}\nDate: ${it.bill_date}\nBill Amount: ₹${billAmt}\nPending Amount: ₹${pendingAmt}\nStatus: ${it.status}`;

      await Share.share({
        title: `Credit Note ${it.bill_no}`,
        message: text,
      });
    } catch {
      // User cancelled
    }
  };

  // Open Adjust Modal
  const handleOpenAdjust = (it: CreditNoteDetailItem) => {
    setMenuTargetItem(null);
    setAdjustItem(it);
  };

  // Render Credit Note Card
  const renderItem = ({ item }: { item: CreditNoteDetailItem }) => {
    const isPending =
      (typeof item.pending_amount === 'number'
        ? item.pending_amount > 0
        : parseFloat(String(item.pending_amount || 0)) > 0) || item.status === 'Pending';

    const billAmt = parseFloat(String(item.final_bill_amt || 0)) || 0;
    const adjustedAmt = parseFloat(String(item.final_adjust_amt || 0)) || 0;
    const pendingAmt = parseFloat(String(item.pending_amount || 0)) || 0;

    const initial = (item.party_name || '0').trim().charAt(0).toUpperCase();

    return (
      <View style={styles.card}>
        {/* Top Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.partyAvatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={styles.partyNameText} numberOfLines={1}>
              {item.party_name}
            </Text>
          </View>

          <View style={styles.headerRightRow}>
            <View style={[styles.statusBadge, isPending ? styles.badgePending : styles.badgeComplete]}>
              <Text style={[styles.statusBadgeText, isPending ? styles.textPending : styles.textComplete]}>
                {isPending ? 'PENDING' : 'COMPLETED'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setMenuTargetItem(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="more-vertical" size={18} color="#5A6B87" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sub-header: Bill No & Type */}
        <View style={styles.subHeaderRow}>
          <Feather name="file-text" size={14} color="#0047AB" />
          <Text style={styles.billTypeNoText}>
            {item.bill_no} <Text style={{ color: '#94A3B8' }}>•</Text> {item.type}
          </Text>
        </View>

        {/* KPI Metrics: 3 Columns */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Bill Amt</Text>
            <Text style={styles.metricValWhite}>₹{billAmt.toFixed(1)}</Text>
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Adjusted</Text>
            <Text style={styles.metricValWhite}>₹{adjustedAmt.toFixed(1)}</Text>
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Pending</Text>
            <Text style={[styles.metricValPending, !isPending && { color: '#16A34A' }]}>
              ₹{pendingAmt.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (onBack ? onBack() : router.back())}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color="#0E204E" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Credit Note Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* FILTER CARD */}
      <View style={styles.filterCard}>
        {/* Row 1: Search & History Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={15} color="#5A6B87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x" size={14} color="#5A6B87" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => setHistoryModalVisible(true)}
            activeOpacity={0.7}
          >
            <Feather name="clock" size={15} color="#0047AB" />
            <Text style={styles.historyBtnText}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Select Party */}
        <View style={styles.filterFieldGroup}>
          <Text style={styles.filterLabel}>
            Select Party <Text style={styles.star}>*</Text>
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
              {selectedParty ? selectedParty.partyName : '-- Select --'}
            </Text>
            {selectedParty ? (
              <TouchableOpacity
                onPress={() => setSelectedParty(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={15} color="#5A6B87" />
              </TouchableOpacity>
            ) : (
              <Feather name="chevron-down" size={16} color="#5A6B87" />
            )}
          </TouchableOpacity>
        </View>

        {/* Row 3: From Date & To Date */}
        <View style={styles.datesRow}>
          <View style={styles.dateCol}>
            <Text style={styles.filterLabel}>
              From Date <Text style={styles.star}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerBox}
              onPress={() => setFromDateVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerText} numberOfLines={1}>
                {formatReadable(fromDate)}
              </Text>
              <Feather name="calendar" size={15} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateCol}>
            <Text style={styles.filterLabel}>
              To Date <Text style={styles.star}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.pickerBox}
              onPress={() => setToDateVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerText} numberOfLines={1}>
                {formatReadable(toDate)}
              </Text>
              <Feather name="calendar" size={15} color="#5A6B87" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* LIST OF CREDIT NOTES */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0047AB" />
          <Text style={styles.loadingText}>Loading credit notes...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="receipt-outline" size={48} color="#5A6B87" />
          <Text style={styles.emptyTitle}>No credit note records found</Text>
          <Text style={styles.emptySubtitle}>
            Adjust date filters or select another party
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `${item.bill_no}_${item.unique_bill}_${index}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadCreditNotes(true)}
              tintColor="#0047AB"
              colors={['#0047AB']}
            />
          }
        />
      )}

      {/* POPUP ACTION MENU (Screenshot 2) */}
      <Modal
        visible={Boolean(menuTargetItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuTargetItem(null)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuTargetItem(null)}
        >
          <View style={styles.menuCard}>
            {/* Adjust Item */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => menuTargetItem && handleOpenAdjust(menuTargetItem)}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={16} color="#0047AB" />
              <Text style={styles.menuRowText}>Adjust</Text>
            </TouchableOpacity>

            {/* Generate PDF */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => menuTargetItem && handleGeneratePdf(menuTargetItem)}
              activeOpacity={0.7}
            >
              <Feather name="file-text" size={16} color="#0047AB" />
              <Text style={styles.menuRowText}>Generate PDF</Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => menuTargetItem && handleDeleteItem(menuTargetItem)}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={16} color="#DC2626" />
              <Text style={[styles.menuRowText, { color: '#DC2626' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Adjust Modal (Screenshot 3) */}
      <AdjustCreditNoteModal
        visible={Boolean(adjustItem)}
        onClose={() => setAdjustItem(null)}
        item={adjustItem}
        onSuccess={() => loadCreditNotes()}
      />

      {/* History Modal */}
      <CreditNoteHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        startDate={fromDate}
        endDate={toDate}
        partyName={selectedParty?.partyName}
      />

      {/* Party Search Sheet */}
      <PartySearchSheet
        visible={partySheetVisible}
        onClose={() => setPartySheetVisible(false)}
        onSelect={(p) => {
          setSelectedParty(p);
          setPartySheetVisible(false);
        }}
        selectedPartyId={selectedParty?.partyId}
      />

      {/* From Date Calendar Modal */}
      <CalendarPickerModal
        visible={fromDateVisible}
        onClose={() => setFromDateVisible(false)}
        selectedDate={fromDate}
        onSelectDate={(d) => {
          setFromDate(d.split('T')[0]);
          setFromDateVisible(false);
        }}
        title="Select From Date"
      />

      {/* To Date Calendar Modal */}
      <CalendarPickerModal
        visible={toDateVisible}
        onClose={() => setToDateVisible(false)}
        selectedDate={toDate}
        onSelectDate={(d) => {
          setToDate(d.split('T')[0]);
          setToDateVisible(false);
        }}
        title="Select To Date"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  screenHeader: {
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
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E204E',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 14,
    gap: 12,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  historyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0047AB',
  },
  filterFieldGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
  },
  star: {
    color: '#DC2626',
  },
  pickerBox: {
    height: 42,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '400',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
    gap: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0047AB',
  },
  partyNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgePending: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeComplete: {
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textPending: {
    color: '#DC2626',
  },
  textComplete: {
    color: '#16A34A',
  },
  moreBtn: {
    padding: 4,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billTypeNoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#5A6B87',
  },
  metricValWhite: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
    marginTop: 2,
  },
  metricValPending: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#5A6B87',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingVertical: 6,
    elevation: 10,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
});
