import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { formatYmd } from '@/utils/dateUtils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateView';
import {
  getMultiRechargeProductsApi,
  getOperatorListApi,
  addOperatorApi,
  updateOperatorApi,
  updateOperatorStatusApi,
  getMultiRechargeRetailersApi,
  getMultiRechargePurchasePartiesApi,
  getMultiRechargeBanksApi,
  addMultiRechargePurchaseApi,
  addMultiRechargeSaleApi,
  getMultiRechargePurchaseHistoryApi,
  getMultiRechargeSaleHistoryApi,
  cancelMultiRechargeSaleBillApi,
  cancelMultiRechargePurchaseBillApi,
  getMultiRechargeTargetSummaryApi,
  MultiRechargeProduct,
  OperatorItem,
  MultiRechargeParty,
  MultiRechargeBank,
  MultiRechargeHistoryData,
  TargetSummaryData,
} from '@/api/multirecharge';

type MainTab = 'purchase' | 'sale' | 'history' | 'operators' | 'summary';
type BillType = 'Inclusive' | 'Exclusive';

interface RowInput {
  price: string;
  qty: string;
  disc: string;
  total: string;
  gst: string;
  net: string;
}

const computeRow = (cur: RowInput, gstRate: number, billType: BillType): RowInput => {
  const next: RowInput = { ...cur };
  const qty = parseFloat(next.qty || '0') || 0;
  const totalAmt = parseFloat(next.total || '0') || 0;
  let disc = parseFloat(next.disc || '0') || 0;

  if (disc > totalAmt) {
    disc = 0;
    next.disc = '0';
  }

  if (totalAmt > 0 && qty > 0) {
    next.price = (totalAmt / qty).toFixed(4);
    const afterDisc = totalAmt - disc;
    if (billType === 'Inclusive') {
      const taxable = afterDisc / ((100 + gstRate) / 100);
      next.gst = (afterDisc - taxable).toFixed(2);
      next.net = afterDisc.toFixed(2);
    } else {
      const gstAmt = (afterDisc * gstRate) / 100;
      next.gst = gstAmt.toFixed(2);
      next.net = (afterDisc + gstAmt).toFixed(2);
    }
  } else {
    next.price = '';
    next.gst = '0.00';
    next.net = '0.00';
  }
  return next;
};

const emptyHistory: MultiRechargeHistoryData = {
  table: [],
  total_txn: 0,
  total_qty: 0,
  total_taxable: 0,
  total_cgst: 0,
  total_sgst: 0,
  total_amt: 0,
};

export const MultiRechargeScreen: React.FC = () => {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const today = formatYmd(new Date());

  const [activeTab, setActiveTab] = useState<MainTab>('sale');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Master data
  const [products, setProducts] = useState<MultiRechargeProduct[]>([]);
  const [operators, setOperators] = useState<OperatorItem[]>([]);
  const [retailers, setRetailers] = useState<MultiRechargeParty[]>([]);
  const [purchaseParties, setPurchaseParties] = useState<MultiRechargeParty[]>([]);
  const [banks, setBanks] = useState<MultiRechargeBank[]>([]);

  // Purchase form
  const [pParty, setPParty] = useState<MultiRechargeParty | null>(null);
  const [pOperator, setPOperator] = useState('');
  const [pDate, setPDate] = useState(today);
  const [pInvoice, setPInvoice] = useState('');
  const [pMode, setPMode] = useState<'Cash' | 'Credit' | 'Online' | ''>('');
  const [pBank, setPBank] = useState<MultiRechargeBank | null>(null);
  const [pType, setPType] = useState<BillType>('Inclusive');
  const [pRows, setPRows] = useState<Record<string, RowInput>>({});

  // Sale form
  const [sParty, setSParty] = useState<MultiRechargeParty | null>(null);
  const [sOperator, setSOperator] = useState('');
  const [sMode, setSMode] = useState<'Cash' | 'Credit' | 'Online' | ''>('');
  const [sBank, setSBank] = useState<MultiRechargeBank | null>(null);
  const [sType, setSType] = useState<BillType>('Inclusive');
  const [sRows, setSRows] = useState<Record<string, RowInput>>({});

  // History
  const [historyType, setHistoryType] = useState<'sale' | 'purchase'>('sale');
  const [hStartDate, setHStartDate] = useState(today);
  const [hEndDate, setHEndDate] = useState(today);
  const [hOperator, setHOperator] = useState('');
  const [historyData, setHistoryData] = useState<MultiRechargeHistoryData>(emptyHistory);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Operators modal
  const [opModalVisible, setOpModalVisible] = useState(false);
  const [editOp, setEditOp] = useState<OperatorItem | null>(null);
  const [opNameInput, setOpNameInput] = useState('');

  // Target summary
  const [summaryDate, setSummaryDate] = useState(today);
  const [summaryData, setSummaryData] = useState<TargetSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Picker modal
  const [pickerState, setPickerState] = useState<{
    visible: boolean;
    title: string;
    items: { id: string; label: string; sub?: string; raw?: any }[];
    onSelect: (item: any) => void;
  }>({ visible: false, title: '', items: [], onSelect: () => {} });
  const [pickerSearch, setPickerSearch] = useState('');

  const activeOperators = useMemo(
    () => operators.filter((o) => String(o.status).toLowerCase() === 'active'),
    [operators]
  );

  const loadMasterData = useCallback(async (isPull = false) => {
    if (isPull) setRefreshing(true);
    else setLoading(true);
    try {
      const [prodRes, opRes, retRes, purRes, bankRes] = await Promise.all([
        getMultiRechargeProductsApi().catch(() => ({ product_list: [], tax_type: 'GST' })),
        getOperatorListApi().catch(() => []),
        getMultiRechargeRetailersApi().catch(() => []),
        getMultiRechargePurchasePartiesApi().catch(() => []),
        getMultiRechargeBanksApi().catch(() => []),
      ]);
      setProducts(prodRes.product_list);
      setOperators(opRes);
      setRetailers(retRes);
      setPurchaseParties(purRes);
      setBanks(bankRes);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const fn =
        historyType === 'sale' ? getMultiRechargeSaleHistoryApi : getMultiRechargePurchaseHistoryApi;
      const res = await fn({
        operator: hOperator || undefined,
        start_date: hStartDate,
        end_date: hEndDate,
      });
      setHistoryData(res);
    } catch {
      setHistoryData(emptyHistory);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyType, hOperator, hStartDate, hEndDate]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await getMultiRechargeTargetSummaryApi(summaryDate);
      setSummaryData(res);
    } catch {
      setSummaryData(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryDate]);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
    else if (activeTab === 'summary') loadSummary();
  }, [activeTab, loadHistory, loadSummary]);

  const updateFormRow = (
    isSale: boolean,
    product: MultiRechargeProduct,
    field: 'qty' | 'total' | 'disc',
    value: string
  ) => {
    const clean = value.replace(/[^0-9.]/g, '');
    const setter = isSale ? setSRows : setPRows;
    const billType = isSale ? sType : pType;
    setter((prev) => {
      const cur: RowInput = prev[product.product_id] || {
        price: '',
        qty: '',
        disc: '',
        total: '',
        gst: '0.00',
        net: '0.00',
      };
      const updated = computeRow({ ...cur, [field]: clean }, Number(product.tax_rate || 0), billType);
      return { ...prev, [product.product_id]: updated };
    });
  };

  const buildPayloadRows = (rows: Record<string, RowInput>) =>
    Object.entries(rows)
      .map(([pid, r]) => ({
        product_id: Number(pid),
        price: Number(r.price) || 0,
        qty: Number(r.qty) || 0,
        discount: Number(r.disc) || 0,
        total_amount: Number(r.total) || 0,
        gst_amount: Number(r.gst) || 0,
        net_amount: Number(r.net) || 0,
      }))
      .filter((p) => p.qty > 0 && p.total_amount > 0);

  const handleSubmitSale = async () => {
    if (!sParty) return Alert.alert('Validation', 'Please select a Retailer');
    if (!sOperator) return Alert.alert('Validation', 'Please select an Operator');
    if (!sMode) return Alert.alert('Validation', 'Please select Payment Mode');
    if (sMode === 'Online' && !sBank) return Alert.alert('Validation', 'Please select Bank');

    const product_list = buildPayloadRows(sRows);
    if (!product_list.length) return Alert.alert('Validation', 'Enter Qty & Total for at least one product');

    for (const item of product_list) {
      const prod = products.find((p) => Number(p.product_id) === item.product_id);
      const maintainInv = (prod?.maintain_inventory ?? 'Yes') === 'Yes';
      const available = Number(prod?.available_stock ?? 0);
      if (maintainInv && item.qty > available) {
        return Alert.alert(
          'Insufficient Stock',
          `"${prod?.product_name || 'Product'}" has only ${available} available.`
        );
      }
    }

    setSubmitting(true);
    try {
      const msg = await addMultiRechargeSaleApi({
        bill_type: sType,
        operator: sOperator,
        payment_mode: sMode,
        bank_id: sMode === 'Online' ? Number(sBank?.bankMasterId) : 0,
        party_id: Number(sParty.id),
        product_list,
      });
      Alert.alert('Success', msg);
      setSRows({});
      loadMasterData(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create Multi-Recharge Sale');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPurchase = async () => {
    if (!pParty) return Alert.alert('Validation', 'Please select a Supplier Party');
    if (!pOperator) return Alert.alert('Validation', 'Please select an Operator');
    if (!pMode) return Alert.alert('Validation', 'Please select Payment Mode');
    if (pMode === 'Online' && !pBank) return Alert.alert('Validation', 'Please select Bank');

    const product_list = buildPayloadRows(pRows);
    if (!product_list.length) return Alert.alert('Validation', 'Enter Qty & Total for at least one product');

    setSubmitting(true);
    try {
      const msg = await addMultiRechargePurchaseApi({
        bill_type: pType,
        party_id: Number(pParty.id),
        party_place_of_supply: pParty.place_of_supply || '',
        payment_mode: pMode,
        bank_id: pMode === 'Online' ? Number(pBank?.bankMasterId) : 0,
        bill_number: pInvoice,
        bill_date: pDate,
        operator: pOperator,
        product_list,
      });
      Alert.alert('Success', msg);
      setPRows({});
      setPInvoice('');
      loadMasterData(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create Multi-Recharge Purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelHistoryBill = (row: any) => {
    Alert.alert('Cancel Bill', 'Are you sure you want to cancel this bill?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const msg =
              historyType === 'sale'
                ? await cancelMultiRechargeSaleBillApi(Number(row.transaction_id))
                : await cancelMultiRechargePurchaseBillApi(String(row.unique_bill), Number(row.party_id));
            Alert.alert('Cancelled', msg);
            loadHistory();
            loadMasterData(true);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Could not cancel bill');
          }
        },
      },
    ]);
  };

  const handleSaveOperator = async () => {
    if (!opNameInput.trim()) return Alert.alert('Validation', 'Enter operator name');
    setSubmitting(true);
    try {
      const msg = editOp
        ? await updateOperatorApi(editOp.operator_id, opNameInput.trim())
        : await addOperatorApi(opNameInput.trim());
      Alert.alert('Success', msg);
      setOpModalVisible(false);
      setOpNameInput('');
      setEditOp(null);
      loadMasterData(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleOperatorStatus = async (op: OperatorItem) => {
    const nextStatus = op.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const msg = await updateOperatorStatusApi(op.operator_id, nextStatus);
      Alert.alert('Updated', msg);
      loadMasterData(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update status');
    }
  };

  const openPicker = (
    title: string,
    items: { id: string; label: string; sub?: string; raw?: any }[],
    onSelect: (item: any) => void
  ) => {
    setPickerSearch('');
    setPickerState({ visible: true, title, items, onSelect });
  };

  const activeRows = activeTab === 'sale' ? sRows : pRows;
  const activeTotals = useMemo(() => {
    return Object.values(activeRows).reduce(
      (acc, r) => ({
        qty: acc.qty + (parseFloat(r.qty || '0') || 0),
        gst: acc.gst + (parseFloat(r.gst || '0') || 0),
        net: acc.net + (parseFloat(r.net || '0') || 0),
      }),
      { qty: 0, gst: 0, net: 0 }
    );
  }, [activeRows]);

  const filteredPickerItems = useMemo(() => {
    if (!pickerSearch.trim()) return pickerState.items;
    const q = pickerSearch.trim().toLowerCase();
    return pickerState.items.filter(
      (i) => i.label.toLowerCase().includes(q) || (i.sub && i.sub.toLowerCase().includes(q))
    );
  }, [pickerState.items, pickerSearch]);

  const renderEntryForm = (isSale: boolean) => {
    const party = isSale ? sParty : pParty;
    const operator = isSale ? sOperator : pOperator;
    const mode = isSale ? sMode : pMode;
    const bank = isSale ? sBank : pBank;
    const billType = isSale ? sType : pType;
    const rows = isSale ? sRows : pRows;

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadMasterData(true)} />}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {isSale ? 'Multi-Recharge Sale Details' : 'Multi-Recharge Purchase Details'}
          </Text>

          <Text style={styles.fieldLabel}>{isSale ? 'Retailer *' : 'Supplier Party *'}</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() =>
              openPicker(
                isSale ? 'Select Retailer' : 'Select Party',
                (isSale ? retailers : purchaseParties).map((p) => ({
                  id: p.id,
                  label: p.name,
                  sub: p.place_of_supply,
                  raw: p,
                })),
                (item) => (isSale ? setSParty(item.raw) : setPParty(item.raw))
              )
            }
          >
            <Text style={party ? styles.selectVal : styles.selectPlaceholder}>
              {party ? `${party.name}${party.place_of_supply ? ` (${party.place_of_supply})` : ''}` : 'Tap to select...'}
            </Text>
            <Feather name="chevron-down" size={18} color="#5A6B87" />
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Operator *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() =>
              openPicker(
                'Select Operator',
                activeOperators.map((o) => ({ id: String(o.operator_id), label: o.operator_name })),
                (item) => (isSale ? setSOperator(item.label) : setPOperator(item.label))
              )
            }
          >
            <Text style={operator ? styles.selectVal : styles.selectPlaceholder}>
              {operator || 'Select Operator...'}
            </Text>
            <Feather name="chevron-down" size={18} color="#5A6B87" />
          </TouchableOpacity>

          {!isSale && (
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Bill Date</Text>
                <TextInput
                  style={styles.input}
                  value={pDate}
                  onChangeText={setPDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Invoice No</Text>
                <TextInput
                  style={styles.input}
                  value={pInvoice}
                  onChangeText={setPInvoice}
                  placeholder="Optional"
                />
              </View>
            </View>
          )}

          <Text style={styles.fieldLabel}>Payment Mode *</Text>
          <View style={styles.chipRow}>
            {(['Cash', 'Credit', 'Online'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, mode === m && styles.chipActive]}
                onPress={() => (isSale ? setSMode(m) : setPMode(m))}
              >
                <Text style={[styles.chipText, mode === m && styles.chipTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'Online' && (
            <>
              <Text style={styles.fieldLabel}>Select Bank *</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() =>
                  openPicker(
                    'Select Bank',
                    banks.map((b) => ({
                      id: String(b.bankMasterId),
                      label: b.bankName,
                      sub: b.accountNo,
                      raw: b,
                    })),
                    (item) => (isSale ? setSBank(item.raw) : setPBank(item.raw))
                  )
                }
              >
                <Text style={bank ? styles.selectVal : styles.selectPlaceholder}>
                  {bank ? bank.bankName : 'Select Bank...'}
                </Text>
                <Feather name="chevron-down" size={18} color="#5A6B87" />
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.fieldLabel}>GST Calculation Type</Text>
          <View style={styles.chipRow}>
            {(['Inclusive', 'Exclusive'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, billType === t && styles.chipActive]}
                onPress={() => {
                  if (isSale) setSType(t);
                  else setPType(t);
                }}
              >
                <Text style={[styles.chipText, billType === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 14, marginBottom: 8 }]}>
          Products ({products.length})
        </Text>

        {products.map((prod) => {
          const r = rows[prod.product_id] || { price: '', qty: '', disc: '', total: '', gst: '0.00', net: '0.00' };
          const hasQty = Number(r.qty) > 0;
          return (
            <View key={prod.product_id} style={[styles.prodCard, hasQty && styles.prodCardActive]}>
              <View style={styles.prodHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodName}>{prod.product_name}</Text>
                  <Text style={styles.prodMeta}>
                    HSN: {prod.hsn_code || '-'} • GST: {prod.tax_rate}% • Stock: {prod.available_stock}
                  </Text>
                </View>
                {hasQty && (
                  <View style={styles.netBadge}>
                    <Text style={styles.netBadgeText}>₹{r.net}</Text>
                  </View>
                )}
              </View>

              <View style={styles.row3}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>Qty</Text>
                  <TextInput
                    style={styles.miniInput}
                    keyboardType="numeric"
                    value={r.qty}
                    onChangeText={(v) => updateFormRow(isSale, prod, 'qty', v)}
                    placeholder="0"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>Total Amt</Text>
                  <TextInput
                    style={styles.miniInput}
                    keyboardType="numeric"
                    value={r.total}
                    onChangeText={(v) => updateFormRow(isSale, prod, 'total', v)}
                    placeholder="0.00"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniLabel}>Disc</Text>
                  <TextInput
                    style={styles.miniInput}
                    keyboardType="numeric"
                    value={r.disc}
                    onChangeText={(v) => updateFormRow(isSale, prod, 'disc', v)}
                    placeholder="0"
                  />
                </View>
              </View>
              {hasQty && (
                <Text style={styles.calcMeta}>
                  Rate: ₹{r.price || '0'}  |  GST: ₹{r.gst}  |  Net: ₹{r.net}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Multi Recharge</Text>
          <Text style={styles.headerSub}>Sale, Purchase, Operators & Target Summary</Text>
        </View>
        {activeTab === 'operators' && (
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => {
              setEditOp(null);
              setOpNameInput('');
              setOpModalVisible(true);
            }}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Top Tabs */}
      <View style={styles.tabBarWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {(
            [
              { key: 'sale', label: 'Sale' },
              { key: 'purchase', label: 'Purchase' },
              { key: 'history', label: 'History' },
              { key: 'operators', label: 'Operators' },
              { key: 'summary', label: 'Target Summary' },
            ] as { key: MainTab; label: string }[]
          ).map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabPill, activeTab === t.key && styles.tabPillActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <OfflineBanner isOffline={!isOnline} />

      {loading ? (
        <LoadingState message="Loading Multi-Recharge module..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={() => loadMasterData(false)} />
      ) : (
        <>
          {(activeTab === 'sale' || activeTab === 'purchase') && renderEntryForm(activeTab === 'sale')}

          {activeTab === 'history' && (
            <View style={{ flex: 1 }}>
              <View style={styles.filterCard}>
                <View style={styles.chipRow}>
                  {(['sale', 'purchase'] as const).map((ht) => (
                    <TouchableOpacity
                      key={ht}
                      style={[styles.chip, historyType === ht && styles.chipActive]}
                      onPress={() => setHistoryType(ht)}
                    >
                      <Text style={[styles.chipText, historyType === ht && styles.chipTextActive]}>
                        {ht === 'sale' ? 'Sale History' : 'Purchase History'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.row2}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={hStartDate}
                    onChangeText={setHStartDate}
                    placeholder="Start YYYY-MM-DD"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={hEndDate}
                    onChangeText={setHEndDate}
                    placeholder="End YYYY-MM-DD"
                  />
                </View>

                <View style={styles.row2}>
                  <TouchableOpacity
                    style={[styles.selectBox, { flex: 1, marginBottom: 0 }]}
                    onPress={() =>
                      openPicker(
                        'Filter Operator',
                        [{ id: '', label: 'All Operators' }, ...operators.map((o) => ({ id: o.operator_name, label: o.operator_name }))],
                        (item) => setHOperator(item.id)
                      )
                    }
                  >
                    <Text style={styles.selectVal}>{hOperator || 'All Operators'}</Text>
                    <Feather name="chevron-down" size={16} color="#5A6B87" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.goBtn} onPress={loadHistory}>
                    <Text style={styles.goBtnText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.kpiRow}>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>Bills</Text>
                  <Text style={styles.kpiVal}>{historyData.total_txn}</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>Qty</Text>
                  <Text style={styles.kpiVal}>{historyData.total_qty}</Text>
                </View>
                <View style={styles.kpiItem}>
                  <Text style={styles.kpiLabel}>Net Amt</Text>
                  <Text style={[styles.kpiVal, { color: '#0047AB' }]}>
                    ₹{historyData.total_amt.toFixed(2)}
                  </Text>
                </View>
              </View>

              {historyLoading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator color="#0047AB" />
                </View>
              ) : (
                <FlatList
                  data={historyData.table}
                  keyExtractor={(item, idx) => String(item.transaction_id || item.unique_bill || idx)}
                  contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
                  ListEmptyComponent={
                    <EmptyState
                      iconName="receipt-outline"
                      title="No history bills found"
                      subtitle="Try changing the date range or operator filter."
                      actionLabel="Refresh"
                      onAction={loadHistory}
                    />
                  }
                  renderItem={({ item }) => (
                    <View style={styles.card}>
                      <View style={styles.prodHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.prodName}>{item.party_name || item.retailer_name || 'Party'}</Text>
                          <Text style={styles.prodMeta}>
                            {item.bill_number || item.unique_bill || '-'} • {item.bill_date || ''} • {item.operator || ''}
                          </Text>
                        </View>
                        <Text style={styles.amountBig}>₹{Number(item.amount ?? item.net_amount ?? 0).toFixed(2)}</Text>
                      </View>
                      <View style={styles.historyFooter}>
                        <Text style={styles.prodMeta}>
                          Mode: {item.payment_mode || '-'} ({item.bill_type || 'Inclusive'}) • Qty: {item.qty ?? 0}
                        </Text>
                        <TouchableOpacity
                          style={styles.cancelSmallBtn}
                          onPress={() => handleCancelHistoryBill(item)}
                        >
                          <Text style={styles.cancelSmallText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          )}

          {activeTab === 'operators' && (
            <FlatList
              data={operators}
              keyExtractor={(o) => String(o.operator_id)}
              contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No operators found.</Text>}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <View style={styles.prodHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prodName}>{item.operator_name}</Text>
                      <Text
                        style={[
                          styles.statusTag,
                          { color: item.status === 'Active' ? '#16A34A' : '#DC2626' },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={styles.iconActionBtn}
                        onPress={() => {
                          setEditOp(item);
                          setOpNameInput(item.operator_name);
                          setOpModalVisible(true);
                        }}
                      >
                        <Feather name="edit-2" size={16} color="#0047AB" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconActionBtn}
                        onPress={() => handleToggleOperatorStatus(item)}
                      >
                        <Feather
                          name={item.status === 'Active' ? 'toggle-right' : 'toggle-left'}
                          size={18}
                          color={item.status === 'Active' ? '#16A34A' : '#64748B'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            />
          )}

          {activeTab === 'summary' && (
            <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
              <View style={[styles.card, { flexDirection: 'row', gap: 10, alignItems: 'center' }]}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={summaryDate}
                  onChangeText={setSummaryDate}
                  placeholder="YYYY-MM-DD"
                />
                <TouchableOpacity style={styles.goBtn} onPress={loadSummary}>
                  <Text style={styles.goBtnText}>Load</Text>
                </TouchableOpacity>
              </View>

              {summaryLoading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator color="#0047AB" />
                </View>
              ) : summaryData ? (
                <>
                  <View style={styles.kpiGrid}>
                    <View style={styles.kpiBox}>
                      <Text style={styles.kpiLabel}>Opening Stock</Text>
                      <Text style={styles.kpiVal}>₹{summaryData.opening_stock.toFixed(2)}</Text>
                    </View>
                    <View style={styles.kpiBox}>
                      <Text style={styles.kpiLabel}>Total Purchase</Text>
                      <Text style={[styles.kpiVal, { color: '#16A34A' }]}>
                        ₹{summaryData.total_purchase.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.kpiBox}>
                      <Text style={styles.kpiLabel}>Total Sale</Text>
                      <Text style={[styles.kpiVal, { color: '#FF6E00' }]}>
                        ₹{summaryData.total_sale.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.kpiBox}>
                      <Text style={styles.kpiLabel}>Closing Stock</Text>
                      <Text style={[styles.kpiVal, { color: '#0047AB' }]}>
                        ₹{summaryData.closing_stock.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: 14, marginBottom: 8 }]}>
                    Operator-wise Sale
                  </Text>
                  {summaryData.operator_wise_sale.map((s, idx) => (
                    <View key={idx} style={styles.card}>
                      <View style={styles.prodHeader}>
                        <Text style={styles.prodName}>{s.operator_detail}</Text>
                        <Text style={styles.amountBig}>₹{Number(s.total_sale || 0).toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}

                  <Text style={[styles.sectionTitle, { marginTop: 14, marginBottom: 8 }]}>
                    Operator-wise Purchase
                  </Text>
                  {summaryData.operator_wise_purchase.map((p, idx) => (
                    <View key={idx} style={styles.card}>
                      <View style={styles.prodHeader}>
                        <Text style={styles.prodName}>{p.operator_detail}</Text>
                        <Text style={styles.amountBig}>₹{Number(p.total_purchase || 0).toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.emptyText}>No target summary available.</Text>
              )}
            </ScrollView>
          )}
        </>
      )}

      {/* Sticky Submit Footer for Sale / Purchase */}
      {(activeTab === 'sale' || activeTab === 'purchase') && !loading && (
        <View style={styles.stickyFooter}>
          <View>
            <Text style={styles.footerLabel}>
              Qty: {activeTotals.qty}  •  GST: ₹{activeTotals.gst.toFixed(2)}
            </Text>
            <Text style={styles.footerTotal}>Net: ₹{activeTotals.net.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
            disabled={submitting}
            onPress={activeTab === 'sale' ? handleSubmitSale : handleSubmitPurchase}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {activeTab === 'sale' ? 'Submit Sale' : 'Submit Purchase'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Picker Modal */}
      <Modal visible={pickerState.visible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerState.title}</Text>
              <TouchableOpacity onPress={() => setPickerState((p) => ({ ...p, visible: false }))}>
                <Ionicons name="close" size={24} color="#0E204E" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={pickerSearch}
              onChangeText={setPickerSearch}
              placeholder="Search..."
            />
            <FlatList
              data={filteredPickerItems}
              keyExtractor={(item, i) => `${item.id}_${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    pickerState.onSelect(item);
                    setPickerState((p) => ({ ...p, visible: false }));
                  }}
                >
                  <Text style={styles.pickerItemTitle}>{item.label}</Text>
                  {item.sub ? <Text style={styles.pickerItemSub}>{item.sub}</Text> : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Operator Add/Edit Modal */}
      <Modal visible={opModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { maxHeight: 280 }]}>
            <Text style={styles.modalTitle}>{editOp ? 'Edit Operator' : 'Add Operator'}</Text>
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              value={opNameInput}
              onChangeText={setOpNameInput}
              placeholder="Operator Name (e.g. Airtel, Jio)"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.goBtn, { flex: 1, backgroundColor: '#E2E8F0' }]}
                onPress={() => setOpModalVisible(false)}
              >
                <Text style={[styles.goBtnText, { color: '#0E204E' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.goBtn, { flex: 1 }]}
                onPress={handleSaveOperator}
                disabled={submitting}
              >
                <Text style={styles.goBtnText}>{editOp ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
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
  headerActionBtn: { padding: 8, borderRadius: 10, backgroundColor: '#FF6E00' },
  tabBarWrap: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabBar: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabPillActive: { backgroundColor: '#0047AB' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  tabTextActive: { color: '#FFFFFF' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  loadingText: { marginTop: 10, color: '#5A6B87', fontSize: 13 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6EDF7',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0E204E', marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 5, marginTop: 8 },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#F8FAFC',
    marginBottom: 4,
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
    marginBottom: 8,
  },
  row2: { flexDirection: 'row', gap: 10, marginTop: 4 },
  row3: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  chipActive: { backgroundColor: '#0047AB', borderColor: '#0047AB' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },
  prodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prodCardActive: { borderColor: '#0047AB', backgroundColor: '#F8FBFF' },
  prodHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  prodName: { fontSize: 14, fontWeight: '700', color: '#0E204E' },
  prodMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  netBadge: { backgroundColor: '#E6F0FA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  netBadgeText: { fontSize: 12, fontWeight: '700', color: '#0047AB' },
  miniLabel: { fontSize: 11, color: '#64748B', marginBottom: 3 },
  miniInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#0E204E',
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
  footerLabel: { fontSize: 11, color: '#64748B' },
  footerTotal: { fontSize: 16, fontWeight: '800', color: '#0E204E' },
  submitBtn: {
    backgroundColor: '#FF6E00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  filterCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  goBtn: {
    backgroundColor: '#0047AB',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  kpiRow: { flexDirection: 'row', padding: 12, gap: 8 },
  kpiItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: { fontSize: 11, color: '#64748B' },
  kpiVal: { fontSize: 15, fontWeight: '800', color: '#0E204E', marginTop: 2 },
  amountBig: { fontSize: 15, fontWeight: '800', color: '#0047AB' },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelSmallBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelSmallText: { color: '#DC2626', fontSize: 11, fontWeight: '700' },
  statusTag: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  iconActionBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 30, fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '78%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0E204E' },
  pickerItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  pickerItemTitle: { fontSize: 14, fontWeight: '600', color: '#0E204E' },
  pickerItemSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
});
