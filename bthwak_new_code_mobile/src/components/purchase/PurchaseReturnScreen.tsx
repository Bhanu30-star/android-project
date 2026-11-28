import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { LoadingState, ErrorState } from '@/components/common/StateView';
import {
  getPurchaseReturnDataApi,
  getPurchaseReturnCartSummaryApi,
  getPurchaseReturnImeiApi,
  addPurchaseReturnCartApi,
  deletePurchaseReturnCartApi,
  submitPurchaseReturnFinalApi,
  PurchaseReturnCartRow,
} from '@/api/purchaseReturn';
import { getMultiRechargePurchasePartiesApi, MultiRechargeParty } from '@/api/multirecharge';

export const PurchaseReturnScreen: React.FC = () => {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const params = useLocalSearchParams<{ pid?: string; uid?: string }>();

  const [partyId, setPartyId] = useState(String(params.pid || ''));
  const [uniqueBill, setUniqueBill] = useState(String(params.uid || ''));
  const [parties, setParties] = useState<MultiRechargeParty[]>([]);
  const [partyPickerOpen, setPartyPickerOpen] = useState(false);

  const [billData, setBillData] = useState<any>(null);
  const [cartRows, setCartRows] = useState<PurchaseReturnCartRow[]>([]);
  const [cartTotalAmt, setCartTotalAmt] = useState(0);
  const [qtyEdits, setQtyEdits] = useState<Record<number, string>>({});
  const [imeiEdits, setImeiEdits] = useState<Record<number, string[]>>({});
  const [imeiOptions, setImeiOptions] = useState<Record<number, string[]>>({});
  const [imeiModalProd, setImeiModalProd] = useState<any | null>(null);

  const [tcsChecked, setTcsChecked] = useState(false);
  const [tcsAmount, setTcsAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getMultiRechargePurchasePartiesApi()
      .then(setParties)
      .catch(() => {});
  }, []);

  const loadBill = useCallback(async () => {
    if (!partyId || !uniqueBill.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [data, cart] = await Promise.all([
        getPurchaseReturnDataApi(partyId, uniqueBill.trim()),
        getPurchaseReturnCartSummaryApi(partyId, uniqueBill.trim()).catch(() => ({
          table_data: [],
          final_paid_amt: 0,
        })),
      ]);
      setBillData(data);
      setCartRows(cart.table_data);
      setCartTotalAmt(cart.final_paid_amt);

      const items: any[] = data?.purchase_detail_data || [];
      const serialItems = items.filter((it) => {
        const t = String(it.product_type || it.distributor_category || data?.final_bill_type || '')
          .trim()
          .toLowerCase();
        return t === 'serial no';
      });
      if (serialItems.length) {
        const imeiPairs = await Promise.all(
          serialItems.map(async (it) => {
            const pId = Number(it.productId || it.product_id);
            const list = await getPurchaseReturnImeiApi(partyId, uniqueBill.trim(), pId);
            return [pId, list] as const;
          })
        );
        const map: Record<number, string[]> = {};
        imeiPairs.forEach(([pid, list]) => {
          map[pid] = list;
        });
        setImeiOptions(map);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not load purchase bill for return.');
      setBillData(null);
    } finally {
      setLoading(false);
    }
  }, [partyId, uniqueBill]);

  useEffect(() => {
    if (params.pid && params.uid) {
      loadBill();
    }
  }, [params.pid, params.uid, loadBill]);

  const itemsList: any[] = billData?.purchase_detail_data || [];
  const isFrozen = billData?.freeze_return === 1;
  const finalNetAmount = useMemo(
    () => (tcsChecked ? cartTotalAmt - (parseFloat(tcsAmount) || 0) : cartTotalAmt),
    [tcsChecked, tcsAmount, cartTotalAmt]
  );

  const isImeiItem = (item: any) => {
    const t = String(item.product_type || item.distributor_category || billData?.final_bill_type || '')
      .trim()
      .toLowerCase();
    return t === 'serial no';
  };

  const handleAddToCart = async () => {
    const selectedItems = itemsList.filter((it) => {
      const pid = Number(it.productId || it.product_id);
      if (isImeiItem(it)) return (imeiEdits[pid]?.length || 0) > 0;
      return Number(qtyEdits[pid] || 0) > 0;
    });

    if (!selectedItems.length) {
      return Alert.alert('Validation', 'Enter return quantity or select IMEIs for at least one item.');
    }

    for (const it of selectedItems) {
      const pid = Number(it.productId || it.product_id);
      const maxQty = Number(it.qty || 0);
      if (isImeiItem(it)) {
        if ((imeiEdits[pid]?.length || 0) > maxQty) {
          return Alert.alert('Quantity Exceeded', `${it.productName}: Cannot return more than ${maxQty}.`);
        }
      } else {
        const bagVal = Number(it.bag) || 0;
        const retQty = Number(qtyEdits[pid] || 0);
        const totalUnits = bagVal > 0 ? bagVal * retQty : retQty;
        if (totalUnits > maxQty) {
          return Alert.alert('Quantity Exceeded', `${it.productName}: Return qty (${totalUnits}) exceeds remaining qty (${maxQty}).`);
        }
      }
    }

    setSubmitting(true);
    try {
      const msg = await addPurchaseReturnCartApi({
        party_id: billData?.partyId || partyId,
        unique_bill: billData?.uniqueBill || uniqueBill.trim(),
        items: selectedItems.map((it) => {
          const pid = Number(it.productId || it.product_id);
          const txnId = it.temp_txn_id || it.transactionId;
          if (isImeiItem(it)) {
            return { product_id: pid, transaction_id: txnId, imeis: imeiEdits[pid] || [] };
          }
          const bagVal = Number(it.bag) || 0;
          const retQty = Number(qtyEdits[pid] || 0);
          return {
            product_id: pid,
            transaction_id: txnId,
            quantity: bagVal > 0 ? bagVal * retQty : retQty,
          };
        }),
      });
      Alert.alert('Success', msg);
      setQtyEdits({});
      setImeiEdits({});
      loadBill();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add items to return cart');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCart = async (cartId: number) => {
    try {
      await deletePurchaseReturnCartApi(cartId);
      loadBill();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to remove item');
    }
  };

  const handleFinalSubmit = async () => {
    if (!cartRows.length) return Alert.alert('Validation', 'Return cart is empty.');
    setSubmitting(true);
    try {
      const msg = await submitPurchaseReturnFinalApi({
        temp_party_id: billData?.partyId || partyId,
        bNo: billData?.uniqueBill || uniqueBill.trim(),
        net_amount: finalNetAmount,
        tcs_amount: Number(tcsAmount || 0),
        tcs_applicable: tcsChecked ? 'Yes' : 'No',
        remark: remark.trim(),
        discount_on_total: 0,
      });
      Alert.alert('Success', msg);
      loadBill();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit purchase return');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPartyObj = parties.find((p) => p.id === partyId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Purchase Return</Text>
          <Text style={styles.headerSub}>Load Purchase Bill & Submit Return</Text>
        </View>
      </View>

      <OfflineBanner isOffline={!isOnline} />

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 110 }}>
        {/* Bill Lookup Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lookup Purchase Bill</Text>
          <TouchableOpacity style={styles.selectBox} onPress={() => setPartyPickerOpen(true)}>
            <Text style={selectedPartyObj ? styles.selectVal : styles.selectPlaceholder}>
              {selectedPartyObj ? selectedPartyObj.name : partyId ? `Party #${partyId}` : 'Select Supplier Party...'}
            </Text>
            <Feather name="chevron-down" size={16} color="#5A6B87" />
          </TouchableOpacity>

          <View style={styles.row2}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={uniqueBill}
              onChangeText={setUniqueBill}
              placeholder="Unique Bill / Invoice ID"
            />
            <TouchableOpacity style={styles.goBtn} onPress={loadBill}>
              <Text style={styles.goBtnText}>Load Bill</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading && <LoadingState message="Loading purchase bill..." />}
        {!loading && errorMsg && <ErrorState message={errorMsg} onRetry={loadBill} />}

        {billData && !loading && (
          <>
            {isFrozen && (
              <View style={styles.frozenBanner}>
                <Text style={styles.frozenText}>This bill return is frozen and cannot be modified.</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Bill Items ({itemsList.length})</Text>
            {itemsList.map((item, idx) => {
              const pid = Number(item.productId || item.product_id);
              const isSerial = isImeiItem(item);
              const selectedImeis = imeiEdits[pid] || [];
              return (
                <View key={`${pid}_${idx}`} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item.productName || item.product_name}</Text>
                      <Text style={styles.metaText}>
                        Remaining Qty: {item.qty}  •  Rate: ₹{Number(item.price || 0).toFixed(2)}
                      </Text>
                    </View>
                    {!isFrozen &&
                      (isSerial ? (
                        <TouchableOpacity
                          style={styles.imeiBtn}
                          onPress={() => setImeiModalProd({ ...item, pid })}
                        >
                          <Text style={styles.imeiBtnText}>
                            IMEIs ({selectedImeis.length})
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TextInput
                          style={styles.qtyInput}
                          keyboardType="numeric"
                          value={qtyEdits[pid] ?? ''}
                          onChangeText={(v) =>
                            setQtyEdits((prev) => ({ ...prev, [pid]: v.replace(/[^0-9]/g, '') }))
                          }
                          placeholder="Ret Qty"
                        />
                      ))}
                  </View>
                </View>
              );
            })}

            {!isFrozen && itemsList.length > 0 && (
              <TouchableOpacity
                style={styles.addCartBtn}
                onPress={handleAddToCart}
                disabled={submitting}
              >
                <Text style={styles.addCartBtnText}>Add Selected Items to Return Cart</Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
              Return Cart ({cartRows.length})
            </Text>
            {cartRows.map((c) => (
              <View key={c.c_cart_id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{c.c_product_name || c.product_name || 'Item'}</Text>
                    <Text style={styles.metaText}>
                      Qty: {c.c_quantity ?? 0}  •  Amt: ₹{Number(c.c_amount ?? 0).toFixed(2)}
                    </Text>
                  </View>
                  {!isFrozen && (
                    <TouchableOpacity onPress={() => handleRemoveCart(c.c_cart_id)}>
                      <Feather name="trash-2" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            {cartRows.length > 0 && !isFrozen && (
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.tcsRow}
                  onPress={() => setTcsChecked((v) => !v)}
                >
                  <Feather
                    name={tcsChecked ? 'check-square' : 'square'}
                    size={18}
                    color="#0047AB"
                  />
                  <Text style={styles.itemTitle}>Apply TCS Adjustment</Text>
                </TouchableOpacity>
                {tcsChecked && (
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    keyboardType="numeric"
                    value={tcsAmount}
                    onChangeText={setTcsAmount}
                    placeholder="TCS Amount"
                  />
                )}
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={remark}
                  onChangeText={setRemark}
                  placeholder="Return Remark (Optional)"
                />
                <TouchableOpacity
                  style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                  onPress={handleFinalSubmit}
                  disabled={submitting}
                >
                  <Text style={styles.submitBtnText}>
                    Submit Final Return (₹{finalNetAmount.toFixed(2)})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Party Picker Modal */}
      <Modal visible={partyPickerOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Supplier Party</Text>
              <TouchableOpacity onPress={() => setPartyPickerOpen(false)}>
                <Ionicons name="close" size={24} color="#0E204E" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={parties}
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setPartyId(item.id);
                    setPartyPickerOpen(false);
                  }}
                >
                  <Text style={styles.itemTitle}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* IMEI Selector Modal */}
      <Modal visible={Boolean(imeiModalProd)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select IMEIs ({imeiModalProd?.productName || ''})
              </Text>
              <TouchableOpacity onPress={() => setImeiModalProd(null)}>
                <Ionicons name="close" size={24} color="#0E204E" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={imeiOptions[imeiModalProd?.pid] || []}
              keyExtractor={(imei) => imei}
              ListEmptyComponent={<Text style={styles.metaText}>No available IMEIs found.</Text>}
              renderItem={({ item: imei }) => {
                const pid = imeiModalProd?.pid;
                const selected = (imeiEdits[pid] || []).includes(imei);
                return (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setImeiEdits((prev) => {
                        const cur = prev[pid] || [];
                        return {
                          ...prev,
                          [pid]: selected ? cur.filter((x) => x !== imei) : [...cur, imei],
                        };
                      });
                    }}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={styles.itemTitle}>{imei}</Text>
                      <Feather
                        name={selected ? 'check-circle' : 'circle'}
                        size={18}
                        color={selected ? '#16A34A' : '#94A3B8'}
                      />
                    </View>
                  </TouchableOpacity>
                );
              }}
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0E204E', marginBottom: 8 },
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
    marginBottom: 10,
  },
  selectVal: { fontSize: 13, color: '#0E204E', fontWeight: '600' },
  selectPlaceholder: { fontSize: 13, color: '#94A3B8' },
  row2: { flexDirection: 'row', gap: 10, alignItems: 'center' },
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
  goBtn: { backgroundColor: '#0047AB', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  goBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  centerBox: { padding: 30, alignItems: 'center' },
  frozenBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  frozenText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#0E204E' },
  metaText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  qtyInput: {
    width: 78,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    textAlign: 'center',
    fontSize: 13,
    color: '#0E204E',
    backgroundColor: '#F8FAFC',
  },
  imeiBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  imeiBtnText: { color: '#0047AB', fontSize: 12, fontWeight: '700' },
  addCartBtn: {
    backgroundColor: '#0047AB',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  addCartBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  tcsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitBtn: {
    backgroundColor: '#FF6E00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
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
});
