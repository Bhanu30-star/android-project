import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateView';
import {
  getPayoutRetailerListApi,
  getTurboInvoiceListApi,
  getPayoutProductsApi,
  addPayoutApi,
  updateTurboInvoiceApi,
  deleteTurboInvoiceApi,
  acceptTurboInvoiceApi,
  deleteAcceptedInvoiceApi,
  PayoutParty,
  PayoutProduct,
  TurboInvoiceRow,
} from '@/api/payout';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PayoutInvoiceScreen: React.FC = () => {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear().toString();

  const [activeTab, setActiveTab] = useState<'pending' | 'accepted'>('pending');
  const [partyName, setPartyName] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(currentYear);

  const [parties, setParties] = useState<PayoutParty[]>([]);
  const [rows, setRows] = useState<TurboInvoiceRow[]>([]);
  const [products, setProducts] = useState<PayoutProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add/Edit Modal
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editItem, setEditItem] = useState<TurboInvoiceRow | null>(null);
  const [formPartyId, setFormPartyId] = useState('');
  const [formTxnRef, setFormTxnRef] = useState('');
  const [formInvDate, setFormInvDate] = useState(formatYmd(new Date()));
  const [formMonth, setFormMonth] = useState(MONTHS[new Date().getMonth()]);
  const [formYear, setFormYear] = useState(currentYear);
  const [inputMap, setInputMap] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Picker modal
  const [picker, setPicker] = useState<{
    visible: boolean;
    title: string;
    items: { id: string; label: string }[];
    onSelect: (id: string, label: string) => void;
  }>({ visible: false, title: '', items: [], onSelect: () => {} });

  const distributorState = String((user as any)?.state || '').trim().toLowerCase();

  const selectedFormParty = useMemo(
    () => parties.find((p) => String(p.purchasePartyId) === formPartyId),
    [parties, formPartyId]
  );

  const isIGST = useMemo(() => {
    if (!selectedFormParty || !distributorState) return false;
    return selectedFormParty.placeOfSupply?.trim().toLowerCase() !== distributorState;
  }, [selectedFormParty, distributorState]);

  const loadList = useCallback(
    async (isPull = false) => {
      if (isPull) setRefreshing(true);
      else setLoading(true);
      setErrorMsg(null);
      try {
        const [partyList, listData] = await Promise.all([
          parties.length ? Promise.resolve(parties) : getPayoutRetailerListApi().catch(() => []),
          getTurboInvoiceListApi({
            type: activeTab,
            month: month === 'ALL' ? '' : month,
            year,
            party: partyName,
          }),
        ]);
        if (!parties.length) setParties(partyList);
        setRows(listData);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to load payout invoices.');
        setRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, month, year, partyName, parties]
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openGenerateModal = async (editRow: TurboInvoiceRow | null = null) => {
    setEditItem(editRow);
    if (!products.length) {
      const prods = await getPayoutProductsApi().catch(() => []);
      setProducts(prods);
    }
    if (editRow) {
      const found = parties.find((p) => p.partyName === editRow.retailer_name);
      setFormPartyId(found ? String(found.purchasePartyId) : '');
      setFormTxnRef(editRow.txn_ref_no || '');
      setFormInvDate(editRow.invoice_date || formatYmd(new Date()));
      if (editRow.period) {
        const [m, y] = editRow.period.split(' ');
        const matched = MONTHS.find((mm) => mm.toLowerCase().startsWith((m || '').toLowerCase()));
        if (matched) setFormMonth(matched);
        if (y) setFormYear(y);
      }
      setInputMap({});
    } else {
      setFormPartyId('');
      setFormTxnRef('');
      setFormInvDate(formatYmd(new Date()));
      setFormMonth(MONTHS[new Date().getMonth()]);
      setFormYear(currentYear);
      setInputMap({});
    }
    setSheetVisible(true);
  };

  useEffect(() => {
    if (editItem && products.length) {
      const prod = products.find((p) => p.productName === editItem.productName);
      if (prod) {
        setInputMap({ [prod.productId]: String(editItem.grand_total || '') });
      }
    }
  }, [editItem, products]);

  const calcGst = (product: PayoutProduct, gross: number) => {
    if (!gross) return { cgst: 0, sgst: 0, igst: 0 };
    if (isIGST) {
      const rate = Number(product.igstPercent) || 0;
      const base = gross / ((100 + rate) / 100);
      return { cgst: 0, sgst: 0, igst: Number((gross - base).toFixed(2)) };
    }
    const gstRate = (Number(product.cgstPercent) || 0) + (Number(product.sgstPercent) || 0);
    const base = gross / ((100 + gstRate) / 100);
    const half = Number(((gross - base) / 2).toFixed(2));
    return { cgst: half, sgst: half, igst: 0 };
  };

  const handleSaveTurboBill = async () => {
    if (!formPartyId || !formInvDate || !formTxnRef.trim()) {
      return Alert.alert('Validation', 'Please select Party, Invoice Date and Txn Ref No.');
    }
    const payout_detail = products
      .map((p) => {
        const amount = Number(inputMap[p.productId] || 0);
        const gst = calcGst(p, amount);
        return { product_id: p.productId, amount, ...gst };
      })
      .filter((d) => d.amount > 0);

    if (!payout_detail.length) {
      return Alert.alert('Validation', 'Enter an amount for at least one product.');
    }

    setSubmitting(true);
    try {
      const msg = editItem
        ? await updateTurboInvoiceApi({
            invbillno: editItem.invoice_id,
            partyId: Number(formPartyId),
            txnref: formTxnRef.trim(),
            invdate: formInvDate,
            getmonth: formMonth.substring(0, 3),
            getyear: formYear,
            proquan: payout_detail.reduce((s, d) => s + d.amount, 0),
          })
        : await addPayoutApi({
            party_id: Number(formPartyId),
            year: Number(formYear),
            month: formMonth,
            txn_ref: formTxnRef.trim(),
            invoice_date: formInvDate,
            payout_detail,
          });
      Alert.alert('Success', msg);
      setSheetVisible(false);
      loadList(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save Turbo Bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = (item: TurboInvoiceRow) => {
    if (!item.accept_allowed) {
      return Alert.alert('Cannot Accept', item.accept_reason || item.reason || 'Not allowed');
    }
    Alert.alert('Accept Invoice', `Accept Turbo invoice ${item.txn_ref_no}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          try {
            const msg = await acceptTurboInvoiceApi(item.txn_ref_no);
            Alert.alert('Accepted', msg);
            loadList(true);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Accept failed');
          }
        },
      },
    ]);
  };

  const handleDelete = (item: TurboInvoiceRow) => {
    Alert.alert('Delete Invoice', 'Are you sure you want to delete this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const msg =
              activeTab === 'pending'
                ? await deleteTurboInvoiceApi(item.invoice_id)
                : await deleteAcceptedInvoiceApi(item.invoice_id);
            Alert.alert('Deleted', msg);
            loadList(true);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Delete failed');
          }
        },
      },
    ]);
  };

  const years = Array.from({ length: Number(currentYear) - 2017 + 1 }, (_, i) => String(2017 + i)).reverse();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Payout Invoice</Text>
          <Text style={styles.headerSub}>Turbo Bills • Pending & Accepted</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => openGenerateModal(null)}>
          <Feather name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Turbo Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Pending / Accepted Tabs */}
      <View style={styles.tabRow}>
        {(['pending', 'accepted'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'pending' ? 'Pending Invoices' : 'Accepted Invoices'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterPill, { flex: 1.4 }]}
          onPress={() =>
            setPicker({
              visible: true,
              title: 'Filter Party',
              items: [{ id: '', label: 'All Parties' }, ...parties.map((p) => ({ id: p.partyName, label: p.partyName }))],
              onSelect: (id) => setPartyName(id),
            })
          }
        >
          <Text numberOfLines={1} style={styles.filterText}>{partyName || 'All Parties'}</Text>
          <Feather name="chevron-down" size={14} color="#5A6B87" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, { flex: 0.9 }]}
          onPress={() =>
            setPicker({
              visible: true,
              title: 'Select Month',
              items: [{ id: 'ALL', label: 'All Months' }, ...MONTHS.map((m) => ({ id: m, label: m }))],
              onSelect: (id) => setMonth(id),
            })
          }
        >
          <Text style={styles.filterText}>{month || 'Month'}</Text>
          <Feather name="chevron-down" size={14} color="#5A6B87" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterPill, { flex: 0.8 }]}
          onPress={() =>
            setPicker({
              visible: true,
              title: 'Select Year',
              items: years.map((y) => ({ id: y, label: y })),
              onSelect: (id) => setYear(id),
            })
          }
        >
          <Text style={styles.filterText}>{year}</Text>
          <Feather name="chevron-down" size={14} color="#5A6B87" />
        </TouchableOpacity>
      </View>

      <OfflineBanner isOffline={!isOnline} />

      {loading ? (
        <LoadingState message="Loading payout invoices..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={() => loadList(false)} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, idx) => String(item.invoice_id || item.txn_ref_no || idx)}
          contentContainerStyle={{ padding: 14, paddingBottom: 40, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadList(true)} />}
          ListEmptyComponent={
            <EmptyState
              iconName="document-text-outline"
              title={`No ${activeTab} payout invoices`}
              subtitle="Tap + Turbo Bill above to create a new payout invoice."
              actionLabel="+ Create Turbo Bill"
              onAction={() => openGenerateModal(null)}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partyTitle}>{item.retailer_name || 'Party'}</Text>
                  <Text style={styles.metaText}>
                    Ref: {item.txn_ref_no || '-'} • Date: {item.invoice_date || '-'}
                  </Text>
                  {item.productName ? (
                    <Text style={styles.metaText}>
                      Product: {item.productName} {item.period ? `(${item.period})` : ''}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.amountText}>₹{Number(item.grand_total || 0).toFixed(2)}</Text>
              </View>

              <View style={styles.actionsRow}>
                {activeTab === 'pending' && (
                  <>
                    <TouchableOpacity
                      style={[styles.acceptBtn, !item.accept_allowed && { opacity: 0.45 }]}
                      onPress={() => handleAccept(item)}
                    >
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => openGenerateModal(item)}
                    >
                      <Feather name="edit-2" size={15} color="#0047AB" />
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity style={styles.iconBtnDanger} onPress={() => handleDelete(item)}>
                  <Feather name="trash-2" size={15} color="#DC2626" />
                </TouchableOpacity>
              </View>
              {activeTab === 'pending' && !item.accept_allowed && item.accept_reason ? (
                <Text style={styles.reasonText}>{item.accept_reason}</Text>
              ) : null}
            </View>
          )}
        />
      )}

      {/* Generate / Edit Turbo Bill Modal */}
      <Modal visible={sheetVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editItem ? 'Edit Turbo Bill' : 'Generate Turbo Bill'}
              </Text>
              <TouchableOpacity onPress={() => setSheetVisible(false)}>
                <Ionicons name="close" size={24} color="#0E204E" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Party *</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() =>
                  setPicker({
                    visible: true,
                    title: 'Select Party',
                    items: parties.map((p) => ({
                      id: String(p.purchasePartyId),
                      label: `${p.partyName} (${p.placeOfSupply})`,
                    })),
                    onSelect: (id) => setFormPartyId(id),
                  })
                }
              >
                <Text style={selectedFormParty ? styles.selectVal : styles.selectPlaceholder}>
                  {selectedFormParty ? selectedFormParty.partyName : 'Select Party...'}
                </Text>
                <Feather name="chevron-down" size={16} color="#5A6B87" />
              </TouchableOpacity>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Txn Ref No *</Text>
                  <TextInput
                    style={styles.input}
                    value={formTxnRef}
                    onChangeText={setFormTxnRef}
                    placeholder="Reference No"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Invoice Date *</Text>
                  <TextInput
                    style={styles.input}
                    value={formInvDate}
                    onChangeText={setFormInvDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Period Month</Text>
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() =>
                      setPicker({
                        visible: true,
                        title: 'Select Month',
                        items: MONTHS.map((m) => ({ id: m, label: m })),
                        onSelect: (id) => setFormMonth(id),
                      })
                    }
                  >
                    <Text style={styles.selectVal}>{formMonth}</Text>
                    <Feather name="chevron-down" size={16} color="#5A6B87" />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Period Year</Text>
                  <TextInput style={styles.input} value={formYear} onChangeText={setFormYear} keyboardType="numeric" />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                Payout Products ({isIGST ? 'IGST' : 'CGST + SGST'})
              </Text>
              {products.map((prod) => {
                const amt = Number(inputMap[prod.productId] || 0);
                const gst = calcGst(prod, amt);
                return (
                  <View key={prod.productId} style={styles.prodInputRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prodName}>{prod.productName}</Text>
                      <Text style={styles.metaText}>
                        {isIGST
                          ? `IGST ${prod.igstPercent}%: ₹${gst.igst}`
                          : `CGST ${prod.cgstPercent}%: ₹${gst.cgst} | SGST ${prod.sgstPercent}%: ₹${gst.sgst}`}
                      </Text>
                    </View>
                    <TextInput
                      style={styles.amtInput}
                      keyboardType="numeric"
                      value={inputMap[prod.productId] ?? ''}
                      onChangeText={(v) =>
                        setInputMap((prev) => ({
                          ...prev,
                          [prod.productId]: v.replace(/[^0-9.]/g, ''),
                        }))
                      }
                      placeholder="Amount"
                    />
                  </View>
                );
              })}

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSaveTurboBill}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{editItem ? 'Update Turbo Bill' : 'Submit Turbo Bill'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Generic Picker Modal */}
      <Modal visible={picker.visible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{picker.title}</Text>
              <TouchableOpacity onPress={() => setPicker((p) => ({ ...p, visible: false }))}>
                <Ionicons name="close" size={24} color="#0E204E" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={picker.items}
              keyExtractor={(item, i) => `${item.id}_${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    picker.onSelect(item.id, item.label);
                    setPicker((p) => ({ ...p, visible: false }));
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E204E',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: { padding: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#CBD5E1', fontSize: 11, marginTop: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FF6E00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', backgroundColor: '#F1F5F9' },
  tabBtnActive: { backgroundColor: '#0047AB' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  tabTextActive: { color: '#FFFFFF' },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  filterText: { fontSize: 12, color: '#0E204E', fontWeight: '600', flex: 1 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 30, fontSize: 13 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  partyTitle: { fontSize: 14, fontWeight: '700', color: '#0E204E' },
  metaText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  amountText: { fontSize: 15, fontWeight: '800', color: '#0047AB' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  acceptBtn: { backgroundColor: '#16A34A', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  acceptBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#EFF6FF' },
  iconBtnDanger: { padding: 8, borderRadius: 8, backgroundColor: '#FEF2F2', marginLeft: 'auto' },
  reasonText: { fontSize: 11, color: '#D97706', marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0E204E' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4, marginTop: 8 },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
  },
  selectVal: { fontSize: 13, color: '#0E204E', fontWeight: '600' },
  selectPlaceholder: { fontSize: 13, color: '#94A3B8' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0E204E',
    backgroundColor: '#F8FAFC',
  },
  row2: { flexDirection: 'row', gap: 10 },
  prodInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  prodName: { fontSize: 13, fontWeight: '700', color: '#0E204E' },
  amtInput: {
    width: 100,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    textAlign: 'right',
    color: '#0E204E',
    backgroundColor: '#F8FAFC',
  },
  submitBtn: {
    backgroundColor: '#FF6E00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pickerItem: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerItemText: { fontSize: 14, color: '#0E204E', fontWeight: '600' },
});
