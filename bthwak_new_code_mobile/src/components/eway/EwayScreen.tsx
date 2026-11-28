import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { formatYmd } from '@/utils/dateUtils';
import { DateRangePickerModal } from '@/components/common/DateRangePickerModal';
import {
  getEwayBillsApi,
  getEwayBillGenerateDetailApi,
  generateEwayBillApi,
  getEwayHistoryApi,
  uploadPendingEwayApi,
  deletePendingEwayApi,
  deleteErrorEwayApi,
  cancelCompleteEwayApi,
  getEwayErrorsApi,
  getEwayProfileApi,
  updateEwayProfileGstApi,
  EwayBillRow,
  EwayHistoryRow,
} from '@/api/eway';

type MainTab = 'invoices' | 'history' | 'errors' | 'profile';
type HistoryTab = 'pending' | 'complete' | 'error' | 'cancelled';

export const EwayScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('invoices');
  const [historyTab, setHistoryTab] = useState<HistoryTab>('pending');

  // Date range (default: 1st of month to today)
  const todayStr = formatYmd(new Date());
  const monthStartStr = `${todayStr.slice(0, 8)}01`;
  const [fromDate, setFromDate] = useState(monthStartStr);
  const [toDate, setToDate] = useState(todayStr);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filters
  const [searchParty, setSearchParty] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');

  // Data
  const [invoices, setInvoices] = useState<EwayBillRow[]>([]);
  const [historyRows, setHistoryRows] = useState<EwayHistoryRow[]>([]);
  const [errorRows, setErrorRows] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [gstInput, setGstInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Generate Modal
  const [genModalVisible, setGenModalVisible] = useState(false);
  const [genDetailLoading, setGenDetailLoading] = useState(false);
  const [genSubmitting, setGenSubmitting] = useState(false);
  const [selectedBill, setSelectedBill] = useState<EwayBillRow | null>(null);
  const [genDetail, setGenDetail] = useState<any>(null);
  const [transMode, setTransMode] = useState<'1' | '2' | '3' | '4'>('1');
  const [transDistance, setTransDistance] = useState('10');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transporterId, setTransporterId] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [transDocNo, setTransDocNo] = useState('');

  const loadData = useCallback(
    async (isPull = false) => {
      if (isPull) setRefreshing(true);
      else setLoading(true);
      const dateRange = `${fromDate} - ${toDate}`;

      try {
        if (mainTab === 'invoices') {
          const res = await getEwayBillsApi({
            party_phone: searchParty,
            invoice_no: invoiceNo,
            date_range: dateRange,
            page: 1,
            limit: 50,
          });
          setInvoices(res?.finalRows || res?.data_set || []);
        } else if (mainTab === 'history') {
          const res = await getEwayHistoryApi({
            date_range: dateRange,
            search_party: searchParty,
            bill_no: invoiceNo,
            type: historyTab,
          });
          setHistoryRows(res?.finalRows || []);
        } else if (mainTab === 'errors') {
          const res = await getEwayErrorsApi();
          setErrorRows(Array.isArray(res) ? res : res?.rows || res?.finalRows || []);
        } else if (mainTab === 'profile') {
          const res = await getEwayProfileApi();
          const prof = res?.profile || res;
          setProfile(prof);
          setGstInput(prof?.gst_no || prof?.gstin_no || '');
        }
      } catch (err: any) {
        if (mainTab === 'invoices') setInvoices([]);
        if (mainTab === 'history') setHistoryRows([]);
        if (mainTab === 'errors') setErrorRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mainTab, historyTab, fromDate, toDate, searchParty, invoiceNo],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openGenerateModal = async (bill: EwayBillRow) => {
    setSelectedBill(bill);
    setGenModalVisible(true);
    setGenDetailLoading(true);
    setVehicleNo('');
    setTransDistance('10');
    setTransporterId('');
    setTransporterName('');
    setTransDocNo('');
    try {
      const detail = await getEwayBillGenerateDetailApi(bill.transaction_id, 'Sale');
      setGenDetail(detail);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Could not load E-Way bill details.',
      );
      setGenModalVisible(false);
    } finally {
      setGenDetailLoading(false);
    }
  };

  const handleGenerateSubmit = async () => {
    if (!selectedBill || !genDetail) return;
    if (transMode === '1' && !vehicleNo.trim()) {
      Alert.alert('Validation', 'Vehicle number is required for Road transport.');
      return;
    }

    const txn = genDetail?.transaction || genDetail?.txn || {};
    const dist = genDetail?.distributor || {};
    const party = genDetail?.party || {};
    const totals = genDetail?.totals || {};

    setGenSubmitting(true);
    try {
      const payload = {
        transaction_id: selectedBill.transaction_id,
        supply_type: '1',
        sub_supply_type: '1',
        doc_type: 'INV',
        doc_no: txn.transaction_bill_number || selectedBill.bill_no || '',
        doc_date: txn.bill_date || selectedBill.bill_date || todayStr,
        from_gstin: dist.gstin_no || '',
        from_tname: dist.trade_name || '',
        from_address1: dist.distributor_address || '',
        from_location: dist.Location || '',
        from_pin: dist.pin_code || '',
        from_statecode: dist.state_code || '',
        buyer_gstin: party.gstin_no || '',
        buyer_legal_name: party.legal_name || party.trade_name || selectedBill.party_name || '',
        buyer_trade_name: party.trade_name || selectedBill.party_name || '',
        buyer_address1: party.party_address || '',
        buyer_location: party.location || '',
        buyer_pin: party.party_pincode || '',
        buyer_statecode: party.state_code || '',
        buyer_phone: party.party_phone || '',
        txn_type: 1,
        transporter_id: transporterId.trim(),
        transporter_name: transporterName.trim(),
        trans_doc_no_1: transDocNo.trim(),
        trans_mode: Number(transMode),
        trans_distance: Number(transDistance) || 0,
        trans_doc_date_1: todayStr,
        vehicle_type_1: 'R',
        vehicle_no_1: vehicleNo.trim().toUpperCase(),
        total_value: totals.total_value ?? 0,
        cgst_value: totals.cgst_value ?? 0,
        sgst_value: totals.sgst_value ?? 0,
        igst_value: totals.igst_value ?? 0,
        cess_value: totals.cess_value ?? 0,
        cess_non_advalue: 0,
        other_value: totals.other_value ?? 0,
        tot_invoice_value: totals.total_invoice_value ?? selectedBill.final_amt ?? 0,
      };

      const res = await generateEwayBillApi(payload);
      if (res?.success !== false && res?.status !== false) {
        Alert.alert('Success', res?.message || 'E-Way Bill generated successfully!');
        setGenModalVisible(false);
        setMainTab('history');
        setHistoryTab('pending');
      } else {
        Alert.alert('Failed', res?.message || 'Failed to generate E-Way Bill.');
      }
    } catch (err: any) {
      Alert.alert(
        'E-Way Error',
        err?.response?.data?.message || 'Failed to generate E-Way Bill.',
      );
    } finally {
      setGenSubmitting(false);
    }
  };

  const handleHistoryAction = (
    action: 'upload' | 'delete_pending' | 'delete_error' | 'cancel_complete',
    item: EwayHistoryRow,
  ) => {
    const id = item.transaction_id;
    const msgMap = {
      upload: 'Upload this pending E-Way JSON to GST portal?',
      delete_pending: 'Delete this pending E-Way record?',
      delete_error: 'Delete this error E-Way record?',
      cancel_complete: 'Cancel this completed E-Way Bill?',
    };

    Alert.alert('Confirm Action', msgMap[action], [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: action === 'upload' ? 'default' : 'destructive',
        onPress: async () => {
          try {
            let res: any;
            if (action === 'upload') res = await uploadPendingEwayApi(id);
            else if (action === 'delete_pending') res = await deletePendingEwayApi(id);
            else if (action === 'delete_error') res = await deleteErrorEwayApi(id);
            else {
              res = await cancelCompleteEwayApi({
                transaction_id: id,
                dist_id: Number(user?.distributor_id || 0),
              });
            }
            Alert.alert('Done', res?.message || 'Action completed successfully.');
            void loadData();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Action failed.');
          }
        },
      },
    ]);
  };

  const handleSaveGst = async () => {
    if (!gstInput.trim()) {
      Alert.alert('Validation', 'Please enter GSTIN number.');
      return;
    }
    try {
      const res = await updateEwayProfileGstApi(gstInput.trim().toUpperCase());
      Alert.alert('Updated', res?.message || 'GSTIN updated successfully.');
      void loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update GSTIN.');
    }
  };

  const renderInvoiceCard = ({ item }: { item: EwayBillRow }) => {
    const amt = Number(item.final_amt ?? item.net_amount ?? item.total_amount ?? 0);
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.billNo}>#{item.bill_no || item.invoice_no || item.transaction_id}</Text>
            <Text style={styles.partyName}>{item.party_name || 'Unknown Party'}</Text>
            <Text style={styles.subText}>
              Date: {item.bill_date || '-'} {item.gstin_no ? `• GST: ${item.gstin_no}` : ''}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amount}>₹ {amt.toLocaleString('en-IN')}</Text>
            {item.ewb_no || item.eway_bill_no ? (
              <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.badgeText, { color: '#16A34A' }]}>
                  EWB: {item.ewb_no || item.eway_bill_no}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openGenerateModal(item)}
              >
                <MaterialCommunityIcons name="truck-fast-outline" size={14} color="#FFF" />
                <Text style={styles.actionBtnText}>Generate</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderHistoryCard = ({ item }: { item: EwayHistoryRow }) => {
    const amt = Number(item.total_amount ?? 0);
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.billNo}>
              {item.document_no || item.doc_no || item.bill_no || `#${item.transaction_id}`}
            </Text>
            <Text style={styles.partyName}>{item.buyer_name || item.party_name || 'N/A'}</Text>
            <Text style={styles.subText}>
              {item.document_date || '-'} {item.ewb_no ? `• EWB: ${item.ewb_no}` : ''}
            </Text>
            {(item.error_msg || item.error_message) && (
              <Text style={styles.errorText}>{item.error_msg || item.error_message}</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.amount}>₹ {amt.toLocaleString('en-IN')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {historyTab === 'pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.miniBtn, { backgroundColor: '#0047AB' }]}
                    onPress={() => handleHistoryAction('upload', item)}
                  >
                    <Text style={styles.miniBtnText}>Upload</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.miniBtn, { backgroundColor: '#DC2626' }]}
                    onPress={() => handleHistoryAction('delete_pending', item)}
                  >
                    <Text style={styles.miniBtnText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
              {historyTab === 'error' && (
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: '#DC2626' }]}
                  onPress={() => handleHistoryAction('delete_error', item)}
                >
                  <Text style={styles.miniBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
              {historyTab === 'complete' && (
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: '#EA580C' }]}
                  onPress={() => handleHistoryAction('cancel_complete', item)}
                >
                  <Text style={styles.miniBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#0E204E" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>E-Way Bill</Text>
          <Text style={styles.headerSub}>Generate, Upload & Track E-Way Bills</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.datePill}
        >
          <Feather name="calendar" size={14} color="#0047AB" />
          <Text style={styles.datePillText}>{fromDate.slice(5)} - {toDate.slice(5)}</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN TABS */}
      <View style={styles.tabRow}>
        {(['invoices', 'history', 'errors', 'profile'] as MainTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setMainTab(t)}
            style={[styles.tabBtn, mainTab === t && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, mainTab === t && styles.tabTextActive]}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SEARCH BAR FOR INVOICES & HISTORY */}
      {(mainTab === 'invoices' || mainTab === 'history') && (
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Party / Phone..."
            value={searchParty}
            onChangeText={setSearchParty}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Bill / Doc No..."
            value={invoiceNo}
            onChangeText={setInvoiceNo}
          />
        </View>
      )}

      {/* HISTORY SUB-TABS */}
      {mainTab === 'history' && (
        <View style={styles.subTabRow}>
          {(['pending', 'complete', 'error', 'cancelled'] as HistoryTab[]).map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setHistoryTab(st)}
              style={[styles.subTab, historyTab === st && styles.subTabActive]}
            >
              <Text style={[styles.subTabText, historyTab === st && styles.subTabTextActive]}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0047AB" />
        </View>
      ) : mainTab === 'invoices' ? (
        <FlatList
          data={invoices}
          keyExtractor={(item, idx) => `${item.transaction_id}-${idx}`}
          renderItem={renderInvoiceCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No E-Way eligible invoices found for selected period.</Text>
          }
        />
      ) : mainTab === 'history' ? (
        <FlatList
          data={historyRows}
          keyExtractor={(item, idx) => `${item.transaction_id}-${idx}`}
          renderItem={renderHistoryCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No {historyTab} E-Way records found.</Text>
          }
        />
      ) : mainTab === 'errors' ? (
        <FlatList
          data={errorRows}
          keyExtractor={(_, idx) => `err-${idx}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.billNo}>{item.bill_no || item.document_no || 'E-Way Error'}</Text>
              <Text style={styles.errorText}>{item.error_message || item.error_msg || JSON.stringify(item)}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No E-Way errors found.</Text>}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.card}>
            <Text style={styles.billNo}>E-Way Client GSTIN Profile</Text>
            <Text style={styles.subText}>
              Trade Name: {profile?.trade_name || profile?.firm_name || user?.distributor_name || '-'}
            </Text>
            <TextInput
              style={[styles.searchInput, { marginTop: 12, flex: 0 }]}
              placeholder="Enter GSTIN"
              value={gstInput}
              onChangeText={setGstInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={[styles.actionBtn, { marginTop: 12, alignSelf: 'flex-start' }]} onPress={handleSaveGst}>
              <Text style={styles.actionBtnText}>Update GSTIN</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* GENERATE E-WAY MODAL */}
      <Modal visible={genModalVisible} transparent animationType="slide" onRequestClose={() => setGenModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate E-Way Bill</Text>
              <TouchableOpacity onPress={() => setGenModalVisible(false)}>
                <Feather name="x" size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            {genDetailLoading ? (
              <ActivityIndicator size="large" color="#0047AB" style={{ marginVertical: 24 }} />
            ) : (
              <ScrollView>
                <Text style={styles.subText}>
                  Bill: #{selectedBill?.bill_no} • {selectedBill?.party_name}
                </Text>

                <Text style={styles.fieldLabel}>Transport Mode</Text>
                <View style={styles.subTabRow}>
                  {[
                    { k: '1', l: 'Road' },
                    { k: '2', l: 'Rail' },
                    { k: '3', l: 'Air' },
                    { k: '4', l: 'Ship' },
                  ].map((m) => (
                    <TouchableOpacity
                      key={m.k}
                      onPress={() => setTransMode(m.k as any)}
                      style={[styles.subTab, transMode === m.k && styles.subTabActive]}
                    >
                      <Text style={[styles.subTabText, transMode === m.k && styles.subTabTextActive]}>
                        {m.l}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Vehicle Number *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. RJ14AB1234"
                  value={vehicleNo}
                  onChangeText={setVehicleNo}
                  autoCapitalize="characters"
                />

                <Text style={styles.fieldLabel}>Distance (km)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={transDistance}
                  onChangeText={setTransDistance}
                />

                <Text style={styles.fieldLabel}>Transporter ID (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={transporterId}
                  onChangeText={setTransporterId}
                />

                <Text style={styles.fieldLabel}>Transporter Name (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={transporterName}
                  onChangeText={setTransporterName}
                />

                <Text style={styles.fieldLabel}>Transport Doc No (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={transDocNo}
                  onChangeText={setTransDocNo}
                />

                <TouchableOpacity
                  disabled={genSubmitting}
                  onPress={handleGenerateSubmit}
                  style={styles.submitBtn}
                >
                  <Text style={styles.submitBtnText}>
                    {genSubmitting ? 'Generating...' : 'Generate E-Way Bill'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <DateRangePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        fromDate={fromDate}
        toDate={toDate}
        onApply={(f, t) => {
          setFromDate(f);
          setToDate(t);
          setShowDatePicker(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FD' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: { padding: 6, borderRadius: 10, backgroundColor: '#F1F5F9' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0E204E' },
  headerSub: { fontSize: 11, color: '#64748B' },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  datePillText: { fontSize: 11, fontWeight: '600', color: '#0047AB' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: { backgroundColor: '#211C6A' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  tabTextActive: { color: '#FFF' },
  searchRow: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 4 },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  subTabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  subTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  subTabActive: { backgroundColor: '#0047AB' },
  subTabText: { fontSize: 11, fontWeight: '600', color: '#334155', textTransform: 'capitalize' },
  subTabTextActive: { color: '#FFF' },
  list: { padding: 12, gap: 10 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  billNo: { fontSize: 14, fontWeight: '700', color: '#0E204E' },
  partyName: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 2 },
  subText: { fontSize: 11, color: '#64748B', marginTop: 3 },
  amount: { fontSize: 15, fontWeight: '800', color: '#0E204E', marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#211C6A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  miniBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  miniBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  errorText: { fontSize: 11, color: '#DC2626', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#0E204E' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#334155', marginTop: 10, marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
  },
  submitBtn: {
    marginTop: 18,
    backgroundColor: '#211C6A',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
