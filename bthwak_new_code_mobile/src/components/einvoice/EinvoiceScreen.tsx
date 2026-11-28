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
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { formatYmd } from '@/utils/dateUtils';
import {
  getEinvoiceBillsApi,
  generateEinvoiceApi,
  toggleEinvoiceHoldApi,
  updateBillMoveToBackDateApi,
  getEinvoiceHistoryApi,
  uploadEinvoiceToPortalApi,
  deleteEinvoiceApi,
  generateEinvoiceCreditNoteApi,
  getEinvoiceErrorsApi,
  getEinvoiceProfileApi,
  updateEinvoiceProfileGstApi,
  EinvoiceBillRow,
  EinvoiceHistoryRow,
} from '@/api/einvoice';

type MainTab = 'bills' | 'history' | 'errors' | 'profile';
type BillSubTab = 'pending' | 'in_process' | 'hold';
type HistorySubTab = 'pending' | 'complete' | 'error' | 'cancelled' | 'hold';

export const EinvoiceScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('bills');
  const [billTab, setBillTab] = useState<BillSubTab>('pending');
  const [historyTab, setHistoryTab] = useState<HistorySubTab>('pending');

  const todayStr = formatYmd(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [retailerSearch, setRetailerSearch] = useState('');
  const [billNoSearch, setBillNoSearch] = useState('');

  // Data
  const [bills, setBills] = useState<EinvoiceBillRow[]>([]);
  const [counts, setCounts] = useState({ pending: 0, in_process: 0, hold: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [historyRows, setHistoryRows] = useState<EinvoiceHistoryRow[]>([]);
  const [errorRows, setErrorRows] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [gstInput, setGstInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Bill Modal
  const [editBill, setEditBill] = useState<{
    visible: boolean;
    transaction_id: string;
    bill_no: string;
    bill_date: string;
  }>({ visible: false, transaction_id: '', bill_no: '', bill_date: todayStr });

  const loadData = useCallback(
    async (isPull = false) => {
      if (isPull) setRefreshing(true);
      else setLoading(true);
      try {
        if (mainTab === 'bills') {
          const res = await getEinvoiceBillsApi({
            date: selectedDate,
            status: billTab,
            retailer: retailerSearch,
            bill_no: billNoSearch,
          });
          setBills(res?.data_set || []);
          setCounts(res?.counts || { pending: 0, in_process: 0, hold: 0 });
        } else if (mainTab === 'history') {
          const res = await getEinvoiceHistoryApi({
            tab: historyTab,
            buyer_detail: retailerSearch,
            document_no: billNoSearch,
            month: selectedDate.slice(0, 7),
          });
          setHistoryRows(res?.data_set || res?.finalRows || []);
        } else if (mainTab === 'errors') {
          const res = await getEinvoiceErrorsApi();
          setErrorRows(Array.isArray(res) ? res : res?.data_set || res?.finalRows || []);
        } else if (mainTab === 'profile') {
          const res = await getEinvoiceProfileApi();
          const prof = res?.profile || res;
          setProfile(prof);
          setGstInput(prof?.gst_no || prof?.gstin_no || '');
        }
      } catch {
        if (mainTab === 'bills') setBills([]);
        if (mainTab === 'history') setHistoryRows([]);
        if (mainTab === 'errors') setErrorRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mainTab, billTab, historyTab, selectedDate, retailerSearch, billNoSearch],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleGenerate = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      const res = await generateEinvoiceApi(ids);
      Alert.alert('Success', res?.message || 'E-Invoice request initiated!');
      setSelectedIds([]);
      void loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to generate E-Invoice.');
    }
  };

  const handleToggleHold = async (
    txnId: string,
    action: 'hold' | 'unhold',
    sourceTab: string,
  ) => {
    try {
      const res = await toggleEinvoiceHoldApi({
        transaction_id: txnId,
        action,
        source_tab: sourceTab,
      });
      Alert.alert('Success', res?.message || `Bill ${action}ed successfully.`);
      void loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update hold status.');
    }
  };

  const handleSaveBillEdit = async () => {
    if (!editBill.bill_no.trim()) {
      Alert.alert('Validation', 'Bill number is required.');
      return;
    }
    try {
      const res = await updateBillMoveToBackDateApi({
        transaction_id: editBill.transaction_id,
        bill_no: editBill.bill_no.trim(),
        bill_date: editBill.bill_date,
      });
      Alert.alert('Updated', res?.message || 'Bill updated successfully!');
      setEditBill((prev) => ({ ...prev, visible: false }));
      void loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update bill.');
    }
  };

  const handleHistoryAction = (
    action: 'upload' | 'delete' | 'credit_note',
    item: EinvoiceHistoryRow,
  ) => {
    const id = item.transaction_id || String(item.id || '');
    const msg =
      action === 'upload'
        ? `Upload ${item.document_no || 'document'} to GST Portal?`
        : action === 'credit_note'
          ? 'Generate E-Invoice Credit Note for this bill?'
          : 'Delete/Cancel this E-Invoice record?';

    Alert.alert('Confirm', msg, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: action === 'delete' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            let res: any;
            if (action === 'upload') res = await uploadEinvoiceToPortalApi(id);
            else if (action === 'credit_note') res = await generateEinvoiceCreditNoteApi(id);
            else res = await deleteEinvoiceApi(id);
            Alert.alert('Done', res?.message || 'Completed successfully.');
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
      Alert.alert('Validation', 'Enter GSTIN number.');
      return;
    }
    try {
      const res = await updateEinvoiceProfileGstApi(gstInput.trim().toUpperCase());
      Alert.alert('Updated', res?.message || 'E-Invoice GSTIN updated.');
      void loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update GSTIN.');
    }
  };

  const renderBillCard = ({ item }: { item: EinvoiceBillRow }) => {
    const isChecked = selectedIds.includes(item.transaction_id);
    const amt = Number(item.final_amt ?? item.total_amount ?? 0);
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          {billTab === 'pending' && (
            <TouchableOpacity
              onPress={() => toggleSelect(item.transaction_id)}
              style={[styles.checkbox, isChecked && styles.checkboxActive]}
            >
              {isChecked && <Feather name="check" size={13} color="#FFF" />}
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.billNo}>#{item.bill_no || item.transaction_id}</Text>
            <Text style={styles.partyName}>{item.party_name || 'N/A'}</Text>
            <Text style={styles.subText}>
              {item.bill_date || '-'} • GST: {item.party_gstin || item.gstin_no || 'Unregistered'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.amount}>₹ {amt.toLocaleString('en-IN')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {billTab === 'pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.miniBtn, { backgroundColor: '#211C6A' }]}
                    onPress={() => handleGenerate([item.transaction_id])}
                  >
                    <Text style={styles.miniBtnText}>Generate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.miniBtn, { backgroundColor: '#EA580C' }]}
                    onPress={() => handleToggleHold(item.transaction_id, 'hold', 'pending')}
                  >
                    <Text style={styles.miniBtnText}>Hold</Text>
                  </TouchableOpacity>
                </>
              )}
              {billTab === 'hold' && (
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: '#0047AB' }]}
                  onPress={() => handleToggleHold(item.transaction_id, 'unhold', 'hold')}
                >
                  <Text style={styles.miniBtnText}>Unhold</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.miniBtn, { backgroundColor: '#475569' }]}
                onPress={() =>
                  setEditBill({
                    visible: true,
                    transaction_id: item.transaction_id,
                    bill_no: item.bill_no || '',
                    bill_date: item.bill_date || todayStr,
                  })
                }
              >
                <Feather name="edit-2" size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHistoryCard = ({ item }: { item: EinvoiceHistoryRow }) => {
    const amt = Number(item.total_amount ?? item.doc_item_amount ?? 0);
    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.billNo}>{item.document_no || `#${item.transaction_id}`}</Text>
            <Text style={styles.partyName}>{item.buyer_name || 'N/A'}</Text>
            <Text style={styles.subText}>
              {item.document_date || '-'} {item.buyer_gstin ? `• ${item.buyer_gstin}` : ''}
            </Text>
            {item.irn && (
              <Text style={styles.irnText} numberOfLines={1}>
                IRN: {item.irn}
              </Text>
            )}
            {item.error_message && <Text style={styles.errorText}>{item.error_message}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={styles.amount}>₹ {amt.toLocaleString('en-IN')}</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {historyTab === 'pending' && (
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: '#0047AB' }]}
                  onPress={() => handleHistoryAction('upload', item)}
                >
                  <Text style={styles.miniBtnText}>Upload Portal</Text>
                </TouchableOpacity>
              )}
              {historyTab === 'complete' && (
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: '#16A34A' }]}
                  onPress={() => handleHistoryAction('credit_note', item)}
                >
                  <Text style={styles.miniBtnText}>Credit Note</Text>
                </TouchableOpacity>
              )}
              {['pending', 'error', 'complete'].includes(historyTab) && (
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: '#DC2626' }]}
                  onPress={() => handleHistoryAction('delete', item)}
                >
                  <Text style={styles.miniBtnText}>Delete</Text>
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
          <Text style={styles.headerTitle}>E-Invoice</Text>
          <Text style={styles.headerSub}>IRN Generation, GST Portal Upload & History</Text>
        </View>
        {selectedIds.length > 0 && mainTab === 'bills' && (
          <TouchableOpacity
            style={styles.bulkBtn}
            onPress={() => handleGenerate(selectedIds)}
          >
            <Text style={styles.bulkBtnText}>Generate ({selectedIds.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* MAIN TABS */}
      <View style={styles.tabRow}>
        {(['bills', 'history', 'errors', 'profile'] as MainTab[]).map((t) => (
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

      {/* FILTERS */}
      {(mainTab === 'bills' || mainTab === 'history') && (
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="YYYY-MM-DD"
            value={selectedDate}
            onChangeText={setSelectedDate}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Retailer..."
            value={retailerSearch}
            onChangeText={setRetailerSearch}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Bill No..."
            value={billNoSearch}
            onChangeText={setBillNoSearch}
          />
        </View>
      )}

      {/* SUB-TABS */}
      {mainTab === 'bills' && (
        <View style={styles.subTabRow}>
          {([
            { k: 'pending', l: `Pending (${counts.pending})` },
            { k: 'in_process', l: `In Process (${counts.in_process})` },
            { k: 'hold', l: `Hold (${counts.hold})` },
          ] as { k: BillSubTab; l: string }[]).map((st) => (
            <TouchableOpacity
              key={st.k}
              onPress={() => setBillTab(st.k)}
              style={[styles.subTab, billTab === st.k && styles.subTabActive]}
            >
              <Text style={[styles.subTabText, billTab === st.k && styles.subTabTextActive]}>
                {st.l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {mainTab === 'history' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }} contentContainerStyle={styles.subTabRow}>
          {(['pending', 'complete', 'error', 'cancelled', 'hold'] as HistorySubTab[]).map((st) => (
            <TouchableOpacity
              key={st}
              onPress={() => setHistoryTab(st)}
              style={[styles.subTab, { minWidth: 80 }, historyTab === st && styles.subTabActive]}
            >
              <Text style={[styles.subTabText, historyTab === st && styles.subTabTextActive]}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0047AB" />
        </View>
      ) : mainTab === 'bills' ? (
        <FlatList
          data={bills}
          keyExtractor={(item, idx) => `${item.transaction_id}-${idx}`}
          renderItem={renderBillCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No {billTab} E-Invoice bills found for {selectedDate}.</Text>
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
            <Text style={styles.emptyText}>No {historyTab} E-Invoice history found.</Text>
          }
        />
      ) : mainTab === 'errors' ? (
        <FlatList
          data={errorRows}
          keyExtractor={(_, idx) => `err-${idx}`}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.billNo}>{item.document_no || item.bill_no || 'E-Invoice Error'}</Text>
              <Text style={styles.errorText}>{item.error_message || item.error_msg || JSON.stringify(item)}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No E-Invoice errors found.</Text>}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.card}>
            <Text style={styles.billNo}>E-Invoice Client GSTIN Profile</Text>
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
            <TouchableOpacity
              style={[styles.bulkBtn, { marginTop: 12, alignSelf: 'flex-start' }]}
              onPress={handleSaveGst}
            >
              <Text style={styles.bulkBtnText}>Update GSTIN</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* EDIT BILL MODAL */}
      <Modal visible={editBill.visible} transparent animationType="fade" onRequestClose={() => setEditBill((p) => ({ ...p, visible: false }))}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Bill No & Date</Text>
            <Text style={styles.fieldLabel}>Bill Number</Text>
            <TextInput
              style={styles.modalInput}
              value={editBill.bill_no}
              onChangeText={(v) => setEditBill((p) => ({ ...p, bill_no: v }))}
            />
            <Text style={styles.fieldLabel}>Bill Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={editBill.bill_date}
              onChangeText={(v) => setEditBill((p) => ({ ...p, bill_date: v }))}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 1, backgroundColor: '#64748B' }]}
                onPress={() => setEditBill((p) => ({ ...p, visible: false }))}
              >
                <Text style={styles.submitBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 1 }]}
                onPress={handleSaveBillEdit}
              >
                <Text style={styles.submitBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  bulkBtn: {
    backgroundColor: '#211C6A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bulkBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
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
  searchRow: { flexDirection: 'row', gap: 6, padding: 12, paddingBottom: 4 },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
    fontSize: 12,
  },
  subTabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  subTab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
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
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: { backgroundColor: '#0047AB', borderColor: '#0047AB' },
  billNo: { fontSize: 14, fontWeight: '700', color: '#0E204E' },
  partyName: { fontSize: 13, fontWeight: '600', color: '#334155', marginTop: 2 },
  subText: { fontSize: 11, color: '#64748B', marginTop: 3 },
  irnText: { fontSize: 10, color: '#059669', marginTop: 3, fontWeight: '600' },
  amount: { fontSize: 15, fontWeight: '800', color: '#0E204E' },
  miniBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  miniBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  errorText: { fontSize: 11, color: '#DC2626', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0E204E', marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#334155', marginTop: 10, marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: '#211C6A',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
