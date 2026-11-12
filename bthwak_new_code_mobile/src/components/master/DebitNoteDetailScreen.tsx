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
import { CalendarPickerModal } from '@/components/common/CalendarPickerModal';
import {
  PurchasePartyItem,
  fetchPurchasePartyListApi,
} from '@/api/purchase';
import {
  DebitNoteDetailItem,
  fetchDebitNoteDetailListApi,
  deleteDebitNoteDetailApi,
  fetchDebitNoteReceiptDataApi,
} from '@/api/debitNoteDetail';
import { AdjustDebitNoteModal } from './AdjustDebitNoteModal';
import { DebitNoteHistoryModal } from './DebitNoteHistoryModal';

interface DebitNoteDetailScreenProps {
  onBack?: () => void;
}

export const DebitNoteDetailScreen: React.FC<DebitNoteDetailScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();

  // Search & Filters
  const [search, setSearch] = useState('');
  const todayStr = formatYmd(new Date());
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatYmd(d);
  });
  const [toDate, setToDate] = useState(todayStr);

  // Purchase Party Selection
  const [parties, setParties] = useState<PurchasePartyItem[]>([]);
  const [selectedParty, setSelectedParty] = useState<PurchasePartyItem | null>(null);
  const [partyModalVisible, setPartyModalVisible] = useState(false);
  const [partySearchText, setPartySearchText] = useState('');
  const [isLoadingParties, setIsLoadingParties] = useState(false);

  // Calendar Pickers & History Modal
  const [fromDateVisible, setFromDateVisible] = useState(false);
  const [toDateVisible, setToDateVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  // List & Status
  const [items, setItems] = useState<DebitNoteDetailItem[]>([]);
  const [totalNetAmt, setTotalNetAmt] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Action Menu & Adjust Modal
  const [menuTargetItem, setMenuTargetItem] = useState<DebitNoteDetailItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<DebitNoteDetailItem | null>(null);

  // Load parties on mount
  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    try {
      setIsLoadingParties(true);
      const list = await fetchPurchasePartyListApi();
      setParties(list || []);
    } catch (err: any) {
      console.warn('Failed to load purchase parties:', err?.message);
    } finally {
      setIsLoadingParties(false);
    }
  };

  // Filtered parties list for modal
  const filteredParties = useMemo(() => {
    if (!partySearchText.trim()) return parties;
    const q = partySearchText.trim().toLowerCase();
    return parties.filter(
      (p) =>
        (p.partyName || '').toLowerCase().includes(q) ||
        (p.partyPhone || '').includes(q)
    );
  }, [parties, partySearchText]);

  // Load Debit Notes
  const loadDebitNotes = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const res = await fetchDebitNoteDetailListApi({
          start_date: fromDate,
          end_date: toDate,
          party_name: selectedParty?.partyName || '',
          party_mobile_no: selectedParty?.partyPhone || '',
          party_id: selectedParty?.purchasePartyId,
        });

        setItems(res.items || []);
        setTotalNetAmt(res.total_net_amt || 0);
      } catch (err: any) {
        console.warn('Error loading debit note list:', err?.message);
        setItems([]);
        setTotalNetAmt(0);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [fromDate, toDate, selectedParty]
  );

  useEffect(() => {
    loadDebitNotes();
  }, [loadDebitNotes]);

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

  // Handle Delete Debit Note
  const handleDeleteItem = (it: DebitNoteDetailItem) => {
    setMenuTargetItem(null);
    Alert.alert(
      'Delete Debit Note',
      `Are you sure you want to delete Debit Note ${it.bill_no}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteDebitNoteDetailApi({
                unique_bill: it.unique_bill,
                bill_no: it.bill_no,
                party_id: it.party_id || 0,
              });
              Alert.alert('Success', res?.message || 'Debit note deleted successfully.');
              loadDebitNotes();
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete transaction.');
            }
          },
        },
      ]
    );
  };

  // Handle Share / Print Summary
  const handleGeneratePdf = async (it: DebitNoteDetailItem) => {
    setMenuTargetItem(null);
    try {
      let receiptText = '';
      try {
        const receiptData = await fetchDebitNoteReceiptDataApi({
          unique_bill: String(it.unique_bill),
          bill_no: String(it.bill_no),
          type: it.type === 'Direct' ? 'Direct' : 'Return Stock',
        });
        if (receiptData?.distributor_info?.name) {
          receiptText = `Issued By: ${receiptData.distributor_info.name}\nGSTIN: ${receiptData.distributor_info.gstin || 'N/A'}\n\n`;
        }
      } catch {
        // use fallback string
      }

      const billAmt = parseFloat(String(it.final_bill_amt || 0)).toFixed(2);
      const pendingAmt = parseFloat(String(it.pending_amount || 0)).toFixed(2);
      const adjustedAmt = parseFloat(String(it.final_adjust_amt || 0)).toFixed(2);
      const text = `${receiptText}=== DEBIT NOTE (PURCHASE RETURN) ===\nDebit Note No: ${it.bill_no}\nVendor: ${it.party_name}\nType: ${it.type}\nDate: ${it.bill_date}\nTotal Amount: ₹${billAmt}\nAdjusted: ₹${adjustedAmt}\nPending Amount: ₹${pendingAmt}\nStatus: ${it.status}`;

      await Share.share({
        title: `Debit Note ${it.bill_no}`,
        message: text,
      });
    } catch {
      // User cancelled
    }
  };

  // Open Adjust Modal
  const handleOpenAdjust = (it: DebitNoteDetailItem) => {
    setMenuTargetItem(null);
    setAdjustItem(it);
  };

  // Render Debit Note Card
  const renderItem = ({ item }: { item: DebitNoteDetailItem }) => {
    const isPending =
      (typeof item.pending_amount === 'number'
        ? item.pending_amount > 0
        : parseFloat(String(item.pending_amount || 0)) > 0) || item.status === 'Pending';

    const billAmt = parseFloat(String(item.final_bill_amt || 0)) || 0;
    const adjustedAmt = parseFloat(String(item.final_adjust_amt || 0)) || 0;
    const pendingAmt = parseFloat(String(item.pending_amount || 0)) || 0;

    const initial = (item.party_name || 'D').trim().charAt(0).toUpperCase();

    return (
      <View style={styles.card}>
        {/* Top Header Row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.partyAvatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.partyNameText} numberOfLines={1}>
                {item.party_name}
              </Text>
              {item.bill_date ? (
                <Text style={styles.dateSubtext}>{item.bill_date}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.headerRightRow}>
            <View
              style={[
                styles.statusBadge,
                isPending ? styles.badgePending : styles.badgeComplete,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isPending ? styles.textPending : styles.textComplete,
                ]}
              >
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
          <View style={styles.billTag}>
            <Feather name="file-text" size={13} color="#0047AB" />
            <Text style={styles.billTypeNoText}>
              {item.bill_no} <Text style={{ color: '#94A3B8' }}>•</Text> {item.type}
            </Text>
          </View>
          {item.org_billno ? (
            <Text style={styles.orgBillText}>Ref: {item.org_billno}</Text>
          ) : null}
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
            <Text
              style={[
                styles.metricValPending,
                !isPending && { color: '#16A34A' },
              ]}
            >
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
        <Text style={styles.screenTitle}>Debit Note Detail</Text>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => router.push('/purchase/generate_debit_note' as any)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="plus-circle" size={20} color="#0047AB" />
        </TouchableOpacity>
      </View>

      {/* FILTER CARD */}
      <View style={styles.filterCard}>
        {/* Row 1: Search & History Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={15} color="#5A6B87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by party, bill no, type..."
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

        {/* Row 2: Select Purchase Party */}
        <View style={styles.filterFieldGroup}>
          <Text style={styles.filterLabel}>Vendor / Party</Text>
          <TouchableOpacity
            style={styles.pickerBox}
            onPress={() => setPartyModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pickerText,
                !selectedParty && styles.pickerPlaceholder,
              ]}
              numberOfLines={1}
            >
              {selectedParty ? selectedParty.partyName : 'All Parties (All Vendors)'}
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
            <Text style={styles.filterLabel}>From Date</Text>
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
            <Text style={styles.filterLabel}>To Date</Text>
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

      {/* KPI METRIC STRIP */}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiItem}>
          <Text style={styles.kpiLabel}>TOTAL NOTES</Text>
          <Text style={styles.kpiValue}>{filteredItems.length}</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiItem}>
          <Text style={styles.kpiLabel}>TOTAL VALUE</Text>
          <Text style={[styles.kpiValue, { color: '#0047AB' }]}>
            ₹{totalNetAmt ? totalNetAmt.toFixed(1) : filteredItems.reduce((acc, it) => acc + (parseFloat(String(it.final_bill_amt)) || 0), 0).toFixed(1)}
          </Text>
        </View>
      </View>

      {/* LIST OF DEBIT NOTES */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0047AB" />
          <Text style={styles.loadingText}>Loading debit notes...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={48} color="#5A6B87" />
          <Text style={styles.emptyTitle}>No debit note records found</Text>
          <Text style={styles.emptySubtitle}>
            Adjust date filters or select another vendor party
          </Text>
          <TouchableOpacity
            style={styles.createEmptyBtn}
            onPress={() => router.push('/purchase/generate_debit_note' as any)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.createEmptyBtnText}>Generate Debit Note</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) =>
            `${item.bill_no}_${item.unique_bill}_${index}`
          }
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadDebitNotes(true)}
              tintColor="#0047AB"
              colors={['#0047AB']}
            />
          }
        />
      )}

      {/* POPUP ACTION MENU */}
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

            {/* Share / PDF */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => menuTargetItem && handleGeneratePdf(menuTargetItem)}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={16} color="#0047AB" />
              <Text style={styles.menuRowText}>Share Note Summary</Text>
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

      {/* Adjust Modal */}
      <AdjustDebitNoteModal
        visible={Boolean(adjustItem)}
        onClose={() => setAdjustItem(null)}
        item={adjustItem}
        onSuccess={() => loadDebitNotes()}
      />

      {/* History Modal */}
      <DebitNoteHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        startDate={fromDate}
        endDate={toDate}
        partyName={selectedParty?.partyName}
      />

      {/* Party Selection Modal */}
      <Modal
        visible={partyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPartyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setPartyModalVisible(false)}
          />
          <View style={styles.partySheetCard}>
            <View style={styles.partySheetHeader}>
              <Text style={styles.partySheetTitle}>Select Vendor / Party</Text>
              <TouchableOpacity
                onPress={() => setPartyModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={20} color="#0E204E" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Feather name="search" size={15} color="#5A6B87" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search vendor by name or phone..."
                placeholderTextColor="#94A3B8"
                value={partySearchText}
                onChangeText={setPartySearchText}
              />
            </View>

            {/* Option to clear / all parties */}
            <TouchableOpacity
              style={[
                styles.partyOption,
                !selectedParty && styles.partyOptionSelected,
              ]}
              onPress={() => {
                setSelectedParty(null);
                setPartyModalVisible(false);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.partyOptionName,
                    !selectedParty && styles.partyOptionNameSelected,
                  ]}
                >
                  All Vendors / Parties
                </Text>
                <Text style={styles.partyOptionSub}>Show all records</Text>
              </View>
              {!selectedParty && <Feather name="check" size={17} color="#0047AB" />}
            </TouchableOpacity>

            {isLoadingParties ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
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
                      style={[
                        styles.partyOption,
                        isSelected && styles.partyOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedParty(item);
                        setPartyModalVisible(false);
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
                        <Text style={styles.partyBal}>
                          Bal: ₹{Number(item.creaditAmount).toFixed(0)}
                        </Text>
                      ) : null}
                      {isSelected && <Feather name="check" size={17} color="#0047AB" />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#64748B', fontSize: 13 }}>No vendors found</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* From Date Calendar Modal */}
      <CalendarPickerModal
        visible={fromDateVisible}
        onClose={() => setFromDateVisible(false)}
        selectedDate={fromDate}
        onSelectDate={(date) => {
          setFromDate(date);
          setFromDateVisible(false);
        }}
      />

      {/* To Date Calendar Modal */}
      <CalendarPickerModal
        visible={toDateVisible}
        onClose={() => setToDateVisible(false)}
        selectedDate={toDate}
        onSelectDate={(date) => {
          setToDate(date);
          setToDateVisible(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E204E',
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0047AB',
  },
  filterFieldGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
  },
  pickerText: {
    fontSize: 13,
    color: '#0E204E',
    fontWeight: '500',
    flex: 1,
  },
  pickerPlaceholder: {
    color: '#64748B',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCol: {
    flex: 1,
    gap: 6,
  },
  kpiStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  kpiItem: {
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0047AB',
  },
  partyNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  dateSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeComplete: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textPending: {
    color: '#B45309',
  },
  textComplete: {
    color: '#15803D',
  },
  moreBtn: {
    padding: 4,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billTypeNoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0047AB',
  },
  orgBillText: {
    fontSize: 11,
    color: '#64748B',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#0E204E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  metricCol: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  metricValWhite: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricValPending: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E204E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  createEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0047AB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
  },
  createEmptyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  menuCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 12,
  },
  menuRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  partySheetCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  partySheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  partySheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
  },
  partyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  partyOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  partyOptionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  partyOptionNameSelected: {
    color: '#0047AB',
  },
  partyOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  partyBal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginRight: 8,
  },
});
