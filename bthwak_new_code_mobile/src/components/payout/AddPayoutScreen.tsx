import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
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
  getAddPayoutDetailApi,
  saveAddPayoutDetailsApi,
  AddPayoutParty,
  AddPayoutProduct,
} from '@/api/payout';

export const AddPayoutScreen: React.FC = () => {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const { user } = useAuth();
  const distributorState = String((user as any)?.state || '').trim();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [parties, setParties] = useState<AddPayoutParty[]>([]);
  const [rawProducts, setRawProducts] = useState<AddPayoutProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [selectedParty, setSelectedParty] = useState<AddPayoutParty | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(formatYmd(new Date()));
  const [selectedCategory, setSelectedCategory] = useState('');
  const [remark, setRemark] = useState('');
  const [qtyMap, setQtyMap] = useState<Record<number, string>>({});

  const [picker, setPicker] = useState<{
    visible: boolean;
    title: string;
    items: { id: string; label: string; raw?: any }[];
    onSelect: (item: any) => void;
  }>({ visible: false, title: '', items: [], onSelect: () => {} });

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAddPayoutDetailApi();
      setParties(res.party_details);
      setRawProducts(res.product_details);
      setCategories(
        res.product_categories.filter((c) => String(c || '').trim().toLowerCase() !== 'commission')
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load payout details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const commissionProducts = useMemo(
    () =>
      rawProducts.filter(
        (p) => String(p.product_category ?? '').trim().toLowerCase() === 'commission'
      ),
    [rawProducts]
  );

  const isOutOfState = useMemo(() => {
    if (!selectedParty || !distributorState) return false;
    return selectedParty.place_of_supply?.trim().toLowerCase() !== distributorState.toLowerCase();
  }, [selectedParty, distributorState]);

  const computedRows = useMemo(() => {
    return commissionProducts.map((p) => {
      const qty = Number(qtyMap[p.product_id] || 0);
      const price = Number(p.purchase_price || 0);
      const base = qty > 0 ? qty * price : 0;
      const cgstAmt = !isOutOfState ? (base * (Number(p.cgst) || 0)) / 100 : 0;
      const sgstAmt = !isOutOfState ? (base * (Number(p.sgst) || 0)) / 100 : 0;
      const igstAmt = isOutOfState ? (base * (Number(p.igst) || 0)) / 100 : 0;
      return {
        ...p,
        qty,
        base,
        cgstAmt,
        sgstAmt,
        igstAmt,
      };
    });
  }, [commissionProducts, qtyMap, isOutOfState]);

  const grandTotal = useMemo(
    () => computedRows.reduce((acc, r) => acc + r.base + r.cgstAmt + r.sgstAmt + r.igstAmt, 0),
    [computedRows]
  );

  const handleSubmit = async () => {
    if (!selectedParty) return Alert.alert('Validation', 'Please select a Party');
    if (!invoiceNo.trim()) return Alert.alert('Validation', 'Please enter Invoice No');
    if (!selectedCategory) return Alert.alert('Validation', 'Please select Payout Type');

    const filled = computedRows.filter((r) => r.qty > 0);
    if (!filled.length) return Alert.alert('Validation', 'Enter quantity for at least one product');

    setSubmitting(true);
    try {
      const gstFlag: 'Yes' | 'No' = !isOutOfState ? 'Yes' : 'No';
      const msg = await saveAddPayoutDetailsApi({
        party_id: selectedParty.purchase_party_id,
        invoice_date: invoiceDate,
        gst_flag: gstFlag,
        remark: remark.trim(),
        bill_no: invoiceNo.trim(),
        payout_type: selectedCategory,
        product_details: filled.map((r) => ({
          product_id: r.product_id,
          quantity: r.qty,
          total_amount: Number(r.base.toFixed(2)),
        })),
      });
      Alert.alert('Success', msg);
      setQtyMap({});
      setInvoiceNo('');
      setRemark('');
      setSelectedCategory('');
      setSelectedParty(null);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save payout invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Add Payout</Text>
          <Text style={styles.headerSub}>Commission Product Conversion Invoice</Text>
        </View>
      </View>

      <OfflineBanner isOffline={!isOnline} />

      {loading ? (
        <LoadingState message="Loading Commission products..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={loadDetails} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Party *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() =>
                setPicker({
                  visible: true,
                  title: 'Select Party',
                  items: parties.map((p) => ({
                    id: String(p.purchase_party_id),
                    label: `${p.party_name} (${p.place_of_supply})`,
                    raw: p,
                  })),
                  onSelect: (item) => setSelectedParty(item.raw),
                })
              }
            >
              <Text style={selectedParty ? styles.selectVal : styles.selectPlaceholder}>
                {selectedParty ? `${selectedParty.party_name} (${selectedParty.place_of_supply})` : 'Select Party...'}
              </Text>
              <Feather name="chevron-down" size={16} color="#5A6B87" />
            </TouchableOpacity>

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Invoice No *</Text>
                <TextInput
                  style={styles.input}
                  value={invoiceNo}
                  onChangeText={setInvoiceNo}
                  placeholder="Enter Invoice No"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Invoice Date</Text>
                <TextInput
                  style={styles.input}
                  value={invoiceDate}
                  onChangeText={setInvoiceDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Payout Type *</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() =>
                setPicker({
                  visible: true,
                  title: 'Select Payout Type',
                  items: categories.map((c) => ({ id: c, label: c })),
                  onSelect: (item) => setSelectedCategory(item.id),
                })
              }
            >
              <Text style={selectedCategory ? styles.selectVal : styles.selectPlaceholder}>
                {selectedCategory || 'Select Payout Type...'}
              </Text>
              <Feather name="chevron-down" size={16} color="#5A6B87" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Remark (Optional)</Text>
            <TextInput
              style={styles.input}
              value={remark}
              onChangeText={setRemark}
              placeholder="Optional remark..."
            />
          </View>

          <Text style={styles.sectionTitle}>
            Commission Products ({computedRows.length})
          </Text>

          {computedRows.length === 0 ? (
            <EmptyState
              iconName="pricetags-outline"
              title="No Commission products found"
              subtitle="Add Commission category products in Product Master first."
            />
          ) : (
            computedRows.map((row) => (
              <View key={row.product_id} style={[styles.card, row.qty > 0 && styles.cardActive]}>
                <View style={styles.prodHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prodName}>{row.product_name}</Text>
                    <Text style={styles.metaText}>
                      Purchase Price: ₹{row.purchase_price.toFixed(2)}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.qtyInput}
                    keyboardType="numeric"
                    value={qtyMap[row.product_id] ?? ''}
                    onChangeText={(v) =>
                      setQtyMap((prev) => ({
                        ...prev,
                        [row.product_id]: v.replace(/[^0-9]/g, '').slice(0, 7),
                      }))
                    }
                    placeholder="Qty"
                  />
                </View>

                {row.qty > 0 && (
                  <Text style={styles.calcMeta}>
                    Base: ₹{row.base.toFixed(2)}  |{' '}
                    {isOutOfState
                      ? `IGST: ₹${row.igstAmt.toFixed(2)}`
                      : `CGST: ₹${row.cgstAmt.toFixed(2)}  |  SGST: ₹${row.sgstAmt.toFixed(2)}`}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {!loading && (
        <View style={styles.stickyFooter}>
          <View>
            <Text style={styles.metaText}>Grand Total (incl. GST)</Text>
            <Text style={styles.footerTotal}>₹{grandTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Payout</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

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
                    picker.onSelect(item);
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
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardActive: { borderColor: '#0047AB', backgroundColor: '#F8FBFF' },
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0E204E', marginVertical: 8 },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 20 },
  prodHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  prodName: { fontSize: 14, fontWeight: '700', color: '#0E204E' },
  metaText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  qtyInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    textAlign: 'center',
    fontSize: 13,
    color: '#0E204E',
    backgroundColor: '#F8FAFC',
  },
  calcMeta: { fontSize: 11, color: '#0047AB', fontWeight: '600', marginTop: 8 },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerTotal: { fontSize: 16, fontWeight: '800', color: '#0E204E' },
  submitBtn: { backgroundColor: '#FF6E00', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '75%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0E204E' },
  pickerItem: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerItemText: { fontSize: 14, color: '#0E204E', fontWeight: '600' },
});
