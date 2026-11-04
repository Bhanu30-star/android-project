import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  PendingStockRow,
  TransferredStockRow,
  CancelledStockRow,
  FosUserOption,
  ExecutiveProductItem,
  StockProductDetail,
  fetchPendingStockRequestsApi,
  approveStockRequestApi,
  rejectStockRequestApi,
  fetchTransferredStockApi,
  fetchCancelledStockApi,
  fetchAllFosUsersApi,
  fetchExecutiveProductsApi,
  fetchSerialProductImeisApi,
  saveExecutiveStockTransferApi,
} from '@/api/stockRequest';
import {
  DateRangePickerModal,
  DatePresetKey,
  formatDateToIso,
  formatReadableDate,
} from '@/components/common/DateRangePickerModal';
import { formatIndianCurrency } from '@/utils/formatters';
import { BarcodeScannerModal } from '@/components/invoice/BarcodeScannerModal';

export type StockRequestTab = 'pending' | 'transferred' | 'cancelled' | 'executive';

interface StockRequestMasterScreenProps {
  initialTab?: StockRequestTab;
}

interface TransferCartItem {
  product: ExecutiveProductItem;
  quantity: number;
  price: number;
  selectedImeis: string[];
}

export const StockRequestMasterScreen: React.FC<StockRequestMasterScreenProps> = ({
  initialTab = 'pending',
}) => {
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<StockRequestTab>(initialTab);

  // Common Search & Loading
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DatePresetKey>('today');
  const [selectedDate, setSelectedDate] = useState(() => formatDateToIso(new Date()));
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // FOS Executive Users
  const [fosUsers, setFosUsers] = useState<FosUserOption[]>([]);
  const [selectedFosId, setSelectedFosId] = useState<number>(0);
  const [isFosModalOpen, setIsFosModalOpen] = useState(false);

  // --- TAB 1: PENDING REQUESTS DATA ---
  const [pendingRequests, setPendingRequests] = useState<PendingStockRow[]>([]);
  const [expandedPendingRows, setExpandedPendingRows] = useState<Set<number>>(new Set());
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // IMEI selection for Pending Requests: { [detailId]: string[] }
  const [pendingImeis, setPendingImeis] = useState<Record<number, string[]>>({});
  const [pendingManualImei, setPendingManualImei] = useState<Record<number, string>>({});

  // --- TAB 2: TRANSFERRED STOCK DATA ---
  const [transferredStock, setTransferredStock] = useState<TransferredStockRow[]>([]);
  const [expandedTransferredRows, setExpandedTransferredRows] = useState<Set<number>>(new Set());

  // --- TAB 3: CANCELLED STOCK DATA ---
  const [cancelledStock, setCancelledStock] = useState<CancelledStockRow[]>([]);

  // --- TAB 4: EXECUTIVE STOCK TRANSFER (NEW TRANSFER) ---
  const [execProducts, setExecProducts] = useState<ExecutiveProductItem[]>([]);
  const [selectedExecFosId, setSelectedExecFosId] = useState<number | null>(null);
  const [transferCart, setTransferCart] = useState<TransferCartItem[]>([]);
  const [productPickerVisible, setProductPickerVisible] = useState(false);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // IMEI Selector Modal for Cart Items (Tab 4)
  const [activeImeiCartIndex, setActiveImeiCartIndex] = useState<number | null>(null);
  const [imeiSearchQuery, setImeiSearchQuery] = useState('');
  const [manualImeiInput, setManualImeiInput] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  // Load FOS Users
  useEffect(() => {
    fetchAllFosUsersApi().then(setFosUsers).catch(() => {});
  }, []);

  // Main Data Loader
  const loadData = useCallback(async (isPull = false) => {
    if (isPull) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      if (activeTab === 'pending') {
        const data = await fetchPendingStockRequestsApi({ search: searchQuery.trim() });
        setPendingRequests(data);
      } else if (activeTab === 'transferred') {
        const res = await fetchTransferredStockApi({
          date: selectedDate,
          user_id: selectedFosId,
          search: searchQuery.trim(),
        });
        setTransferredStock(res.rows);
      } else if (activeTab === 'cancelled') {
        const res = await fetchCancelledStockApi({
          date: selectedDate,
          user_id: selectedFosId,
        });
        setCancelledStock(res.rows);
      } else if (activeTab === 'executive') {
        const prods = await fetchExecutiveProductsApi({ search: searchQuery.trim() });
        setExecProducts(prods);

        // Pre-fetch warehouse in-hand IMEIs for serial products if empty
        const serialsNeedingImeis = prods.filter(
          (p) => p.productType === 'Serial No' && (!p.stock_imei || p.stock_imei.length === 0)
        );
        if (serialsNeedingImeis.length > 0) {
          Promise.all(
            serialsNeedingImeis.map(async (sp) => {
              const res = await fetchSerialProductImeisApi(sp.productId);
              return { productId: sp.productId, imeis: res.imeis };
            })
          ).then((results) => {
            setExecProducts((prev) =>
              prev.map((p) => {
                const match = results.find((r) => r.productId === p.productId);
                if (match && match.imeis.length > 0) {
                  return {
                    ...p,
                    stock_imei: match.imeis,
                    newQuantity: Math.max(p.newQuantity, match.imeis.length),
                  };
                }
                return p;
              })
            );
          });
        }
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, searchQuery, selectedDate, selectedFosId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle Row Expand
  const togglePendingRow = (id: number) => {
    setExpandedPendingRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTransferredRow = (id: number) => {
    setExpandedTransferredRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper to get selected IMEIs for a pending request product detail
  const getPendingSelectedImeis = (item: StockProductDetail): string[] => {
    const detailId = item.transaction_detail_id;
    if (pendingImeis[detailId] !== undefined) {
      return pendingImeis[detailId];
    }
    // Default to first requested_quantity available serials
    const available = item.issue_detail?.available_serials || [];
    return available.slice(0, item.requested_quantity || 1);
  };

  const togglePendingImei = (detailId: number, imei: string, item: StockProductDetail) => {
    const current = getPendingSelectedImeis(item);
    let next: string[];
    if (current.includes(imei)) {
      next = current.filter((x) => x !== imei);
    } else {
      next = [...current, imei];
    }
    setPendingImeis((prev) => ({ ...prev, [detailId]: next }));
  };

  const addManualPendingImei = (item: StockProductDetail) => {
    const detailId = item.transaction_detail_id;
    const text = (pendingManualImei[detailId] || '').trim();
    if (!text) return;
    const current = getPendingSelectedImeis(item);
    if (!current.includes(text)) {
      setPendingImeis((prev) => ({ ...prev, [detailId]: [...current, text] }));
    }
    setPendingManualImei((prev) => ({ ...prev, [detailId]: '' }));
  };

  // Handle Approve Request
  const handleApprovePending = async (row: PendingStockRow) => {
    const isSerial = row.request_type === 'Serial No';
    const firstItem = row.product_details?.[0];

    // Validate IMEI for Serial No
    let imeisToAssign: string[] = [];
    if (isSerial && firstItem) {
      imeisToAssign = getPendingSelectedImeis(firstItem);
      if (imeisToAssign.length === 0) {
        Alert.alert(
          'IMEI Required',
          `Request #${row.user_transaction_id || row.transaction_id} ke liye kam se kam 1 IMEI number select ya enter karein.`
        );
        // Auto expand row so user sees IMEI list
        setExpandedPendingRows((prev) => new Set(prev).add(row.transaction_id));
        return;
      }
    }

    Alert.alert(
      'Approve Stock Request',
      `Approve request #${row.user_transaction_id || row.transaction_id} from ${row.user_name}${
        isSerial ? ` with ${imeisToAssign.length} IMEI(s)` : ''
      }?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Transfer',
          style: 'default',
          onPress: async () => {
            setActionLoadingId(row.transaction_id);
            try {
              if (isSerial && firstItem) {
                await approveStockRequestApi({
                  request_id: row.transaction_id,
                  request_type: 'Serial No',
                  imeis: imeisToAssign,
                  transaction_detail_id: firstItem.transaction_detail_id,
                  quantity: imeisToAssign.length,
                  user_id: row.user_id,
                  sale_price: firstItem.product_price || 0,
                });
              } else {
                const itemIds = (row.product_details || []).map((p) => p.transaction_detail_id);
                await approveStockRequestApi({
                  request_id: row.transaction_id,
                  request_type: row.request_type || 'FMCG',
                  transaction_detail_ids: itemIds,
                  quantity: firstItem?.requested_quantity || 1,
                  sale_price: firstItem?.product_price || 0,
                  negative_allow: 'No',
                  bill_generation: 'No',
                  bill_discount: 0,
                });
              }

              Alert.alert('Approved', `Request #${row.user_transaction_id || row.transaction_id} approved successfully.`);
              // Remove locally
              setPendingRequests((prev) => prev.filter((r) => r.transaction_id !== row.transaction_id));
            } catch (err: any) {
              Alert.alert('Approval Failed', err.message || 'Could not approve request');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // Handle Reject Request
  const handleRejectPending = async (row: PendingStockRow) => {
    Alert.alert(
      'Reject Stock Request',
      `Are you sure you want to reject request #${row.user_transaction_id || row.transaction_id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(row.transaction_id);
            try {
              await rejectStockRequestApi(row.transaction_id);
              Alert.alert('Rejected', `Request #${row.user_transaction_id || row.transaction_id} rejected.`);
              setPendingRequests((prev) => prev.filter((r) => r.transaction_id !== row.transaction_id));
            } catch (err: any) {
              Alert.alert('Rejection Failed', err.message || 'Could not reject request');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // Add Product To Executive Cart
  const handleAddProductToCart = async (prod: ExecutiveProductItem) => {
    setProductPickerVisible(false);
    const isSerial = prod.productType === 'Serial No';
    let availableImeis = prod.stock_imei || [];

    // If serial product and stock_imei is empty, fetch warehouse stock IMEIs
    if (isSerial && availableImeis.length === 0) {
      const res = await fetchSerialProductImeisApi(prod.productId);
      if (res.imeis.length > 0) {
        availableImeis = res.imeis;
        prod = {
          ...prod,
          stock_imei: res.imeis,
          newQuantity: Math.max(prod.newQuantity, res.imeis.length),
        };
      }
    }

    const defaultImeis = isSerial && availableImeis[0] ? [availableImeis[0]] : [];

    const existingIdx = transferCart.findIndex((c) => c.product.productId === prod.productId);
    if (existingIdx >= 0) {
      setTransferCart((prev) =>
        prev.map((c, idx) => {
          if (idx !== existingIdx) return c;
          const nextQty = c.quantity + 1;
          let nextImeis = [...c.selectedImeis];
          if (isSerial && availableImeis.length > 0) {
            const unselected = availableImeis.find((im) => !nextImeis.includes(im));
            if (unselected) nextImeis.push(unselected);
          }
          return {
            ...c,
            quantity: nextQty,
            selectedImeis: nextImeis,
          };
        })
      );
    } else {
      setTransferCart((prev) => [
        ...prev,
        {
          product: prod,
          quantity: 1,
          price: prod.productPrice || 0,
          selectedImeis: defaultImeis,
        },
      ]);
    }
  };

  // Open IMEI Modal and dynamically fetch available warehouse in-hand IMEIs if not loaded
  const [isLoadingImeis, setIsLoadingImeis] = useState(false);

  const openImeiModalForCartItem = async (idx: number) => {
    setActiveImeiCartIndex(idx);
    setImeiSearchQuery('');
    setManualImeiInput('');

    const item = transferCart[idx];
    if (item && item.product.productType === 'Serial No') {
      if (!item.product.stock_imei || item.product.stock_imei.length === 0) {
        setIsLoadingImeis(true);
        try {
          const res = await fetchSerialProductImeisApi(item.product.productId);
          if (res.imeis.length > 0) {
            setTransferCart((prev) =>
              prev.map((c, cIdx) => {
                if (cIdx !== idx) return c;
                return {
                  ...c,
                  product: {
                    ...c.product,
                    stock_imei: res.imeis,
                    newQuantity: Math.max(c.product.newQuantity, res.imeis.length),
                  },
                };
              })
            );
            setExecProducts((prev) =>
              prev.map((p) =>
                p.productId === item.product.productId
                  ? { ...p, stock_imei: res.imeis, newQuantity: Math.max(p.newQuantity, res.imeis.length) }
                  : p
              )
            );
          }
        } finally {
          setIsLoadingImeis(false);
        }
      }
    }
  };

  const selectAllCartImeis = () => {
    if (activeImeiCartIndex === null) return;
    const item = transferCart[activeImeiCartIndex];
    if (!item) return;
    const allAvailable = item.product.stock_imei || [];
    if (allAvailable.length === 0) return;
    setTransferCart((prev) =>
      prev.map((c, idx) => {
        if (idx !== activeImeiCartIndex) return c;
        return {
          ...c,
          selectedImeis: [...allAvailable],
          quantity: Math.max(1, allAvailable.length),
        };
      })
    );
  };

  const clearAllCartImeis = () => {
    if (activeImeiCartIndex === null) return;
    setTransferCart((prev) =>
      prev.map((c, idx) => {
        if (idx !== activeImeiCartIndex) return c;
        return {
          ...c,
          selectedImeis: [],
          quantity: 1,
        };
      })
    );
  };

  // Quantity Stepper for Cart
  const handleCartQtyStep = (idx: number, delta: number) => {
    setTransferCart((prev) => {
      const item = prev[idx];
      if (!item) return prev;
      const isSerial = item.product.productType === 'Serial No';

      if (delta > 0) {
        const nextQty = item.quantity + 1;
        let nextImeis = [...item.selectedImeis];
        if (isSerial && item.product.stock_imei) {
          const unselected = item.product.stock_imei.find((im) => !nextImeis.includes(im));
          if (unselected) {
            nextImeis.push(unselected);
          }
        }
        return prev.map((c, i) => (i === idx ? { ...c, quantity: nextQty, selectedImeis: nextImeis } : c));
      } else {
        if (item.quantity <= 1) {
          return prev.filter((_, i) => i !== idx);
        }
        const nextQty = item.quantity - 1;
        const nextImeis = isSerial ? item.selectedImeis.slice(0, nextQty) : item.selectedImeis;
        return prev.map((c, i) => (i === idx ? { ...c, quantity: nextQty, selectedImeis: nextImeis } : c));
      }
    });
  };

  // Toggle IMEI inside Active Modal
  const toggleActiveCartImei = (imei: string) => {
    if (activeImeiCartIndex === null) return;
    setTransferCart((prev) =>
      prev.map((c, idx) => {
        if (idx !== activeImeiCartIndex) return c;
        let nextImeis: string[];
        if (c.selectedImeis.includes(imei)) {
          nextImeis = c.selectedImeis.filter((x) => x !== imei);
        } else {
          nextImeis = [...c.selectedImeis, imei];
        }
        return {
          ...c,
          selectedImeis: nextImeis,
          quantity: Math.max(1, nextImeis.length),
        };
      })
    );
  };

  // Add Manual IMEI inside Modal
  const addManualCartImei = () => {
    if (activeImeiCartIndex === null) return;
    const text = manualImeiInput.trim();
    if (!text) return;
    setTransferCart((prev) =>
      prev.map((c, idx) => {
        if (idx !== activeImeiCartIndex) return c;
        if (c.selectedImeis.includes(text)) return c;
        const nextImeis = [...c.selectedImeis, text];
        return {
          ...c,
          selectedImeis: nextImeis,
          quantity: Math.max(1, nextImeis.length),
        };
      })
    );
    setManualImeiInput('');
  };

  // Submit Executive Transfer
  const handleSubmitExecutiveTransfer = async () => {
    if (!selectedExecFosId) {
      Alert.alert('Select Executive', 'Please select a Sales Executive to transfer stock to.');
      return;
    }
    if (transferCart.length === 0) {
      Alert.alert('Cart Empty', 'Please add at least one product to transfer.');
      return;
    }

    // Validate Serial IMEIs
    for (let i = 0; i < transferCart.length; i++) {
      const item = transferCart[i];
      if (item.product.productType === 'Serial No') {
        if (item.selectedImeis.length === 0) {
          Alert.alert(
            'IMEI Required',
            `Product "${item.product.productName}" ke liye kam se kam 1 IMEI number select ya enter karein.`
          );
          setActiveImeiCartIndex(i);
          return;
        }
      }
    }

    setIsSubmittingTransfer(true);
    try {
      const totalAmount = transferCart.reduce((sum, item) => sum + item.quantity * item.price, 0);
      const payloadDetails = transferCart.map((item) => {
        const isSerial = item.product.productType === 'Serial No';
        const finalQty = isSerial ? item.selectedImeis.length : item.quantity;
        return {
          product_id: item.product.productId,
          product_type: item.product.productType || 'FMCG',
          price: item.price,
          quantity: finalQty,
          imei_ids: item.selectedImeis,
        };
      });

      await saveExecutiveStockTransferApi({
        sale_id: selectedExecFosId,
        total_amount: totalAmount,
        product_cart_details: payloadDetails,
      });

      Alert.alert('Success', 'Stock transferred to executive successfully.');
      setTransferCart([]);
      setActiveTab('transferred');
    } catch (err: any) {
      Alert.alert('Transfer Failed', err.message || 'Failed to submit transfer.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const getFosName = (id: number) => {
    if (id === 0) return 'All Executives';
    const f = fosUsers.find((u) => u.userId === id);
    return f ? f.userName : 'Selected Executive';
  };

  // Filtered pending requests
  const filteredPending = useMemo(() => {
    if (!searchQuery.trim()) return pendingRequests;
    const q = searchQuery.toLowerCase().trim();
    return pendingRequests.filter(
      (r) =>
        r.user_name.toLowerCase().includes(q) ||
        r.user_phone.includes(q) ||
        String(r.transaction_id).includes(q) ||
        (r.user_transaction_id && r.user_transaction_id.toLowerCase().includes(q))
    );
  }, [pendingRequests, searchQuery]);

  const activeCartItem = activeImeiCartIndex !== null ? transferCart[activeImeiCartIndex] : null;

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      {/* 1. TOP HEADER */}
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
            <Text style={styles.headerTitle} numberOfLines={1}>Stock Request Master</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {activeTab === 'pending'
                ? `${pendingRequests.length} Pending Approval`
                : activeTab === 'transferred'
                ? 'Completed Stock Dispatches'
                : activeTab === 'cancelled'
                ? 'Cancelled Stock Requests'
                : 'Direct Executive Transfer'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerRefreshBtn}
            onPress={() => loadData(true)}
            activeOpacity={0.7}
          >
            <Feather name="refresh-cw" size={16} color="#0047AB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. TAB NAVIGATION STRIP */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'pending' && styles.tabItemActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabItemText, activeTab === 'pending' && styles.tabItemTextActive]}>
            Pending
          </Text>
          {pendingRequests.length > 0 && (
            <View style={[styles.tabBadge, activeTab === 'pending' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'pending' && styles.tabBadgeTextActive]}>
                {pendingRequests.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'transferred' && styles.tabItemActive]}
          onPress={() => setActiveTab('transferred')}
        >
          <Text style={[styles.tabItemText, activeTab === 'transferred' && styles.tabItemTextActive]}>
            Transferred
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'cancelled' && styles.tabItemActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabItemText, activeTab === 'cancelled' && styles.tabItemTextActive]}>
            Cancelled
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'executive' && styles.tabItemActive]}
          onPress={() => setActiveTab('executive')}
        >
          <Text style={[styles.tabItemText, activeTab === 'executive' && styles.tabItemTextActive]}>
            Dispatch
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. SEARCH & DATE FILTER ROW */}
      <View style={styles.filterSection}>
        <View style={styles.searchAndFilterRow}>
          <View style={styles.searchBox}>
            <Feather name="search" size={15} color="#94A3B8" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'executive' ? 'Search products...' : 'Search executive / ID...'}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={14} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {activeTab !== 'pending' && activeTab !== 'executive' && (
            <>
              <TouchableOpacity
                style={styles.dateFilterPill}
                onPress={() => setIsDateModalOpen(true)}
                activeOpacity={0.8}
              >
                <Feather name="calendar" size={13} color="#0047AB" />
                <Text style={styles.dateFilterPillText} numberOfLines={1}>
                  {formatReadableDate(selectedDate)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fosFilterPill}
                onPress={() => setIsFosModalOpen(true)}
                activeOpacity={0.8}
              >
                <Feather name="user" size={13} color="#475569" />
                <Text style={styles.fosFilterPillText} numberOfLines={1}>
                  {getFosName(selectedFosId)}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* 4. MAIN CONTENT AREA */}
      {isLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#0047AB" />
          <Text style={styles.loaderText}>Loading stock details...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.contentScrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadData(true)} />}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* TAB 1: PENDING REQUESTS */}
          {activeTab === 'pending' && (
            <>
              {filteredPending.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <Feather name="inbox" size={32} color="#0047AB" />
                  </View>
                  <Text style={styles.emptyTitle}>No Pending Requests</Text>
                  <Text style={styles.emptySubtitle}>All field requests have been processed.</Text>
                </View>
              ) : (
                filteredPending.map((row) => {
                  const isExpanded = expandedPendingRows.has(row.transaction_id);
                  const isActionLoading = actionLoadingId === row.transaction_id;
                  const isSerial = row.request_type === 'Serial No';

                  return (
                    <View key={row.transaction_id} style={styles.requestCard}>
                      <TouchableOpacity
                        style={styles.cardHeader}
                        onPress={() => togglePendingRow(row.transaction_id)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.cardTitleRow}>
                            <Text style={styles.executiveNameText}>{row.user_name}</Text>
                            <View
                              style={[
                                styles.typeBadge,
                                { backgroundColor: isSerial ? '#FFF2E5' : '#E8F1FC' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.typeBadgeText,
                                  { color: isSerial ? '#FF6E00' : '#0047AB' },
                                ]}
                              >
                                {row.request_type || 'FMCG'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.cardMetaRow}>
                            <Text style={styles.metaText}>
                              <Feather name="phone" size={11} color="#64748B" /> {row.user_phone}
                            </Text>
                            <Text style={styles.metaDot}>•</Text>
                            <Text style={styles.metaText}>
                              <Feather name="calendar" size={11} color="#64748B" />{' '}
                              {row.transaction_date} {row.transaction_time}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.expandIconBox}>
                          <Feather
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#0047AB"
                          />
                        </View>
                      </TouchableOpacity>

                      <View style={styles.cardMetricRow}>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>REQUEST ID</Text>
                          <Text style={styles.metricValue}>#{row.user_transaction_id || row.transaction_id}</Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>ITEMS</Text>
                          <Text style={[styles.metricValue, { color: '#0047AB' }]}>
                            {row.total_products || row.product_details?.length || 0} Products
                          </Text>
                        </View>
                        <View style={styles.metricDivider} />
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>STATUS</Text>
                          <Text style={[styles.metricValue, { color: '#D97706' }]}>
                            {row.status || 'Pending'}
                          </Text>
                        </View>
                      </View>

                      {/* EXPANDED CONTENT WITH IMEI SELECTION */}
                      {isExpanded && (
                        <View style={styles.expandedContent}>
                          <Text style={styles.expandedSectionTitle}>Requested Products List</Text>
                          {(row.product_details || []).map((prod, idx) => {
                            const isProdSerial = isSerial || prod.serial_type === 'Serial No';
                            const availableSerials = prod.issue_detail?.available_serials || [];
                            const selectedImeis = getPendingSelectedImeis(prod);
                            const reqQty = prod.requested_quantity || 1;

                            return (
                              <View key={idx} style={styles.productItemCard}>
                                <View style={styles.productItemHeader}>
                                  <View style={styles.productIndexCircle}>
                                    <Text style={styles.productIndexText}>{idx + 1}</Text>
                                  </View>
                                  <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={styles.productNameText}>{prod.product_name}</Text>
                                    <View style={styles.productSubRow}>
                                      <Text style={styles.productStockText}>
                                        Available: {prod.stock_quantity ?? 0}
                                      </Text>
                                      <Text style={styles.productRequestedText}>
                                        Requested: {reqQty}
                                      </Text>
                                    </View>
                                  </View>
                                </View>

                                {/* IMEI ALLOCATION AREA FOR SERIAL PRODUCTS */}
                                {isProdSerial && (
                                  <View style={styles.imeiAllocationBox}>
                                    <View style={styles.imeiAllocationHeader}>
                                      <Text style={styles.imeiAllocationTitle}>
                                        Assign IMEIs ({selectedImeis.length}/{reqQty})
                                      </Text>
                                      {availableSerials.length > 0 && (
                                        <TouchableOpacity
                                          style={styles.autoSelectImeiBtn}
                                          onPress={() => {
                                            setPendingImeis((prev) => ({
                                              ...prev,
                                              [prod.transaction_detail_id]: availableSerials.slice(0, reqQty),
                                            }));
                                          }}
                                        >
                                          <Text style={styles.autoSelectImeiBtnText}>Auto-Pick ({reqQty})</Text>
                                        </TouchableOpacity>
                                      )}
                                    </View>

                                    {/* Available IMEI Chips */}
                                    {availableSerials.length > 0 ? (
                                      <View style={styles.imeiChipsGrid}>
                                        {availableSerials.map((im) => {
                                          const isAssigned = selectedImeis.includes(im);
                                          return (
                                            <TouchableOpacity
                                              key={im}
                                              style={[styles.imeiChip, isAssigned && styles.imeiChipActive]}
                                              onPress={() => togglePendingImei(prod.transaction_detail_id, im, prod)}
                                            >
                                              {isAssigned && (
                                                <Feather name="check" size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                                              )}
                                              <Text style={[styles.imeiChipText, isAssigned && styles.imeiChipTextActive]}>
                                                {im}
                                              </Text>
                                            </TouchableOpacity>
                                          );
                                        })}
                                      </View>
                                    ) : (
                                      <Text style={styles.noPreloadedImeiText}>
                                        No pre-listed warehouse IMEIs found. Type or scan IMEI below:
                                      </Text>
                                    )}

                                    {/* Manual IMEI Entry */}
                                    <View style={styles.manualImeiRow}>
                                      <TextInput
                                        style={styles.manualImeiInput}
                                        placeholder="Add IMEI / Serial manually"
                                        placeholderTextColor="#94A3B8"
                                        value={pendingManualImei[prod.transaction_detail_id] || ''}
                                        onChangeText={(val) =>
                                          setPendingManualImei((prev) => ({
                                            ...prev,
                                            [prod.transaction_detail_id]: val,
                                          }))
                                        }
                                        onSubmitEditing={() => addManualPendingImei(prod)}
                                      />
                                      <TouchableOpacity
                                        style={styles.manualImeiAddBtn}
                                        onPress={() => addManualPendingImei(prod)}
                                      >
                                        <Feather name="plus" size={14} color="#FFFFFF" />
                                        <Text style={styles.manualImeiAddBtnText}>Add</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                )}
                              </View>
                            );
                          })}

                          {/* ACTION BUTTONS */}
                          <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                              style={[styles.rejectBtn, isActionLoading && { opacity: 0.6 }]}
                              onPress={() => handleRejectPending(row)}
                              disabled={isActionLoading}
                              activeOpacity={0.8}
                            >
                              <Feather name="x" size={14} color="#DC2626" />
                              <Text style={styles.rejectBtnText}>Reject</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.approveBtn, isActionLoading && { opacity: 0.6 }]}
                              onPress={() => handleApprovePending(row)}
                              disabled={isActionLoading}
                              activeOpacity={0.85}
                            >
                              {isActionLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <>
                                  <Feather name="check" size={14} color="#FFFFFF" />
                                  <Text style={styles.approveBtnText}>Approve & Transfer</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* TAB 2: TRANSFERRED STOCK */}
          {activeTab === 'transferred' && (
            <>
              {transferredStock.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <Feather name="check-circle" size={32} color="#16A34A" />
                  </View>
                  <Text style={styles.emptyTitle}>No Stock Transferred</Text>
                  <Text style={styles.emptySubtitle}>No completed dispatches found for this date and filter.</Text>
                </View>
              ) : (
                transferredStock.map((row) => {
                  const isExpanded = expandedTransferredRows.has(row.transaction_id);
                  return (
                    <View key={row.transaction_id} style={styles.transferredCard}>
                      <TouchableOpacity
                        style={styles.cardHeader}
                        onPress={() => toggleTransferredRow(row.transaction_id)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.cardTitleRow}>
                            <Text style={styles.executiveNameText}>{row.user_name}</Text>
                            <View style={[styles.typeBadge, { backgroundColor: '#ECFDF5' }]}>
                              <Text style={[styles.typeBadgeText, { color: '#059669' }]}>Completed</Text>
                            </View>
                          </View>
                          <Text style={styles.metaText}>
                            Dispatched: {row.complete_date || row.transaction_date} {row.complete_time || ''}
                          </Text>
                        </View>
                        <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#0047AB" />
                      </TouchableOpacity>

                      {isExpanded && row.products && (
                        <View style={styles.expandedContent}>
                          <Text style={styles.expandedSectionTitle}>Dispatched Products</Text>
                          {row.products.map((p, idx) => (
                            <View key={idx} style={styles.productItemRow}>
                              <View style={styles.productIndexCircle}>
                                <Text style={styles.productIndexText}>{idx + 1}</Text>
                              </View>
                              <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.productNameText}>{p.product_name}</Text>
                                <Text style={styles.productRequestedText}>Qty: {p.quantity} units</Text>
                                {((p.imeis && p.imeis.length > 0) || (p.serial_no && p.serial_no.length > 0)) && (
                                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                    {(p.imeis || p.serial_no || []).map((im) => (
                                      <View key={im} style={styles.dispatchedImeiChip}>
                                        <Text style={styles.dispatchedImeiChipText}>IMEI: {im}</Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* TAB 3: CANCELLED REQUESTS */}
          {activeTab === 'cancelled' && (
            <>
              {cancelledStock.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <Feather name="check" size={32} color="#059669" />
                  </View>
                  <Text style={styles.emptyTitle}>No Cancelled Requests</Text>
                  <Text style={styles.emptySubtitle}>There are no cancelled requests for this date.</Text>
                </View>
              ) : (
                cancelledStock.map((row, idx) => (
                  <View key={idx} style={styles.cancelledCard}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.executiveNameText}>{row.user_name}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[styles.typeBadgeText, { color: '#DC2626' }]}>Cancelled</Text>
                      </View>
                    </View>
                    <Text style={styles.metaText}>
                      Requested: {row.transaction_date} • Cancelled by: {row.cancel_by || 'Admin'}
                    </Text>
                    {row.products && row.products.length > 0 && (
                      <View style={{ marginTop: 8 }}>
                        {row.products.map((p, pIdx) => (
                          <Text key={pIdx} style={styles.cancelledProductText}>
                            • {p.product_name} (Qty: {p.quantity})
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))
              )}
            </>
          )}

          {/* TAB 4: EXECUTIVE STOCK TRANSFER (DIRECT DISPATCH) */}
          {activeTab === 'executive' && (
            <View style={styles.execTransferContainer}>
              {/* SELECT EXECUTIVE */}
              <View style={styles.formFieldCard}>
                <Text style={styles.formLabel}>Select Sales Executive *</Text>
                <TouchableOpacity
                  style={styles.selectExecutiveBtn}
                  onPress={() => setIsFosModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="user" size={16} color="#0047AB" />
                  <Text style={styles.selectExecutiveText}>
                    {selectedExecFosId ? getFosName(selectedExecFosId) : 'Choose Executive...'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              {/* PRODUCTS TO TRANSFER HEADER */}
              <View style={styles.transferHeaderRow}>
                <Text style={styles.transferSectionTitle}>Products to Transfer ({transferCart.length})</Text>
                <TouchableOpacity
                  style={styles.addProductBtn}
                  onPress={() => setProductPickerVisible(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={14} color="#FFFFFF" />
                  <Text style={styles.addProductBtnText}>Add Product</Text>
                </TouchableOpacity>
              </View>

              {/* CART LIST */}
              {transferCart.length === 0 ? (
                <View style={styles.emptyCartCard}>
                  <Feather name="shopping-bag" size={28} color="#94A3B8" />
                  <Text style={styles.emptyCartTitle}>No Products Selected</Text>
                  <Text style={styles.emptyCartSub}>Tap "Add Product" to select items from catalog.</Text>
                </View>
              ) : (
                transferCart.map((item, idx) => {
                  const isSerial = item.product.productType === 'Serial No';
                  const imeiCount = item.selectedImeis.length;

                  return (
                    <View key={idx} style={styles.cartItemCard}>
                      <View style={styles.cartItemTopRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.cartItemName}>{item.product.productName}</Text>
                            {isSerial && (
                              <View style={styles.serialIndicatorBadge}>
                                <Text style={styles.serialIndicatorText}>Serial No</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.cartItemStockRow}>
                            <View style={[styles.stockPillBadge, { backgroundColor: item.product.newQuantity > 0 ? '#ECFDF5' : '#FEF2F2' }]}>
                              <Feather name="package" size={11} color={item.product.newQuantity > 0 ? '#059669' : '#DC2626'} />
                              <Text style={[styles.stockPillText, { color: item.product.newQuantity > 0 ? '#059669' : '#DC2626' }]}>
                                In-Hand Stock: {item.product.newQuantity} {item.product.qty || ''}
                              </Text>
                            </View>
                            <Text style={styles.cartItemRateText}>
                              Rate: {formatIndianCurrency(item.price)}
                            </Text>
                          </View>
                        </View>

                        {/* QUANTITY ADJUSTER */}
                        <View style={styles.qtyAdjusterRow}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => handleCartQtyStep(idx, -1)}
                          >
                            <Feather name="minus" size={12} color="#0E204E" />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{isSerial ? imeiCount : item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => handleCartQtyStep(idx, 1)}
                          >
                            <Feather name="plus" size={12} color="#0E204E" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* SERIAL / IMEI MANAGEMENT SECTION FOR THIS PRODUCT */}
                      {isSerial && (
                        <View style={styles.cartImeiManagerBox}>
                          <View style={styles.cartImeiHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.cartImeiTitle}>
                                Selected: {imeiCount} of {item.product.newQuantity} In Stock
                              </Text>
                              <Text style={styles.cartImeiStockSubtitle}>
                                Warehouse IMEIs Available: {item.product.stock_imei?.length || item.product.newQuantity}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.manageImeisBtn}
                              onPress={() => openImeiModalForCartItem(idx)}
                            >
                              <Feather name="hash" size={12} color="#0047AB" />
                              <Text style={styles.manageImeisBtnText}>Choose IMEIs</Text>
                            </TouchableOpacity>
                          </View>

                          {/* Selected IMEI Pills list */}
                          {imeiCount > 0 ? (
                            <View style={styles.selectedImeiPillsRow}>
                              {item.selectedImeis.map((im) => (
                                <View key={im} style={styles.selectedImeiPill}>
                                  <Text style={styles.selectedImeiPillText}>{im}</Text>
                                  <TouchableOpacity
                                    onPress={() => {
                                      setTransferCart((prev) =>
                                        prev.map((c, cIdx) => {
                                          if (cIdx !== idx) return c;
                                          const next = c.selectedImeis.filter((x) => x !== im);
                                          return {
                                            ...c,
                                            selectedImeis: next,
                                            quantity: Math.max(1, next.length),
                                          };
                                        })
                                      );
                                    }}
                                  >
                                    <Feather name="x" size={11} color="#5A6B87" />
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.addImeiWarningBox}
                              onPress={() => openImeiModalForCartItem(idx)}
                            >
                              <Feather name="alert-circle" size={13} color="#DC2626" />
                              <Text style={styles.addImeiWarningText}>
                                Tap to choose from {item.product.stock_imei?.length || item.product.newQuantity} in-stock warehouse IMEIs (Required)
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}

              {/* SUBMIT BUTTON */}
              {transferCart.length > 0 && (
                <TouchableOpacity
                  style={styles.submitTransferBtn}
                  onPress={handleSubmitExecutiveTransfer}
                  disabled={isSubmittingTransfer}
                  activeOpacity={0.88}
                >
                  {isSubmittingTransfer ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.submitTransferBtnText}>Confirm Stock Transfer</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* 5. IMEI MULTI-SELECT MODAL (TAB 4) */}
      <Modal
        visible={activeImeiCartIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveImeiCartIndex(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.imeiModalCard}>
            <View style={styles.fosModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fosModalTitle} numberOfLines={1}>
                  {activeCartItem?.product.productName}
                </Text>
                <Text style={styles.headerSubtitle}>
                  In-Hand Warehouse Stock: {activeCartItem?.product.newQuantity || 0} Units ({activeCartItem?.selectedImeis.length || 0} Selected)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveImeiCartIndex(null)}>
                <Feather name="x" size={20} color="#0E204E" />
              </TouchableOpacity>
            </View>

            {/* Quick Action Toolbar */}
            <View style={styles.imeiQuickActionToolbar}>
              <View style={styles.inStockBadgeRow}>
                <Feather name="check-circle" size={12} color="#059669" />
                <Text style={styles.inStockBadgeText}>
                  {activeCartItem?.product.stock_imei?.length || 0} IMEIs in Warehouse Stock
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.toolbarActionBtn}
                  onPress={selectAllCartImeis}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toolbarActionBtnText}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toolbarActionBtn, { borderColor: '#E2E8F0' }]}
                  onPress={clearAllCartImeis}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toolbarActionBtnText, { color: '#64748B' }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* IMEI Search & Scanner Bar */}
            <View style={styles.imeiSearchRow}>
              <View style={styles.imeiSearchBox}>
                <Feather name="search" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                <TextInput
                  style={styles.imeiSearchInput}
                  placeholder="Search available IMEI..."
                  placeholderTextColor="#94A3B8"
                  value={imeiSearchQuery}
                  onChangeText={setImeiSearchQuery}
                />
              </View>
              <TouchableOpacity
                style={styles.imeiScanBtn}
                onPress={() => setScannerOpen(true)}
              >
                <Feather name="camera" size={15} color="#0047AB" />
              </TouchableOpacity>
            </View>

            {/* Manual IMEI Input */}
            <View style={styles.manualImeiRow}>
              <TextInput
                style={styles.manualImeiInput}
                placeholder="Type custom / scan IMEI"
                placeholderTextColor="#94A3B8"
                value={manualImeiInput}
                onChangeText={setManualImeiInput}
                onSubmitEditing={addManualCartImei}
              />
              <TouchableOpacity
                style={styles.manualImeiAddBtn}
                onPress={addManualCartImei}
              >
                <Feather name="plus" size={14} color="#FFFFFF" />
                <Text style={styles.manualImeiAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Available IMEIs List */}
            {isLoadingImeis ? (
              <View style={{ paddingVertical: 30, alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#0047AB" />
                <Text style={{ fontSize: 13, color: '#5A6B87' }}>Fetching warehouse IMEIs in stock...</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
                {(() => {
                  const available = (activeCartItem?.product.stock_imei || []).filter((im) =>
                    imeiSearchQuery ? im.toLowerCase().includes(imeiSearchQuery.toLowerCase()) : true
                  );

                  if (available.length === 0 && (activeCartItem?.selectedImeis || []).length === 0) {
                    return (
                      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#0E204E' }}>
                          0 In-Stock IMEIs Found
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                          You can scan or type custom IMEIs using the bar above.
                        </Text>
                      </View>
                    );
                  }

                  // Combine stock IMEIs and already manually selected IMEIs
                  const allDisplayImeis = Array.from(
                    new Set([...available, ...(activeCartItem?.selectedImeis || [])])
                  );

                  return allDisplayImeis.map((im) => {
                    const isChecked = activeCartItem?.selectedImeis.includes(im);
                    const isInWarehouseStock = activeCartItem?.product.stock_imei?.includes(im);

                    return (
                      <TouchableOpacity
                        key={im}
                        style={[styles.imeiOptionRow, isChecked && styles.imeiOptionRowActive]}
                        onPress={() => toggleActiveCartImei(im)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.imeiCheckbox, isChecked && styles.imeiCheckboxActive]}>
                          {isChecked && <Feather name="check" size={12} color="#FFFFFF" />}
                        </View>
                        <Text style={[styles.imeiOptionText, isChecked && styles.imeiOptionTextActive]}>
                          {im}
                        </Text>
                        {isInWarehouseStock ? (
                          <View style={styles.inStockImeiBadge}>
                            <Text style={styles.inStockImeiBadgeText}>In Stock</Text>
                          </View>
                        ) : (
                          <View style={[styles.inStockImeiBadge, { backgroundColor: '#EFF6FF' }]}>
                            <Text style={[styles.inStockImeiBadgeText, { color: '#0047AB' }]}>Manual</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  });
                })()}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.imeiModalDoneBtn}
              onPress={() => setActiveImeiCartIndex(null)}
            >
              <Text style={styles.imeiModalDoneBtnText}>
                Done ({activeCartItem?.selectedImeis.length || 0} Selected)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* DATE RANGE MODAL */}
      <DateRangePickerModal
        visible={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        fromDate={selectedDate}
        toDate={selectedDate}
        activePreset={datePreset}
        onApply={(from) => {
          setSelectedDate(from);
        }}
        title="Filter Stock by Date"
      />

      {/* FOS SELECTOR MODAL */}
      <Modal
        visible={isFosModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFosModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsFosModalOpen(false)}
        >
          <View style={styles.fosModalCard}>
            <View style={styles.fosModalHeader}>
              <Text style={styles.fosModalTitle}>Select Executive</Text>
              <TouchableOpacity onPress={() => setIsFosModalOpen(false)}>
                <Feather name="x" size={20} color="#0E204E" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350 }}>
              {activeTab !== 'executive' && (
                <TouchableOpacity
                  style={[styles.fosOption, selectedFosId === 0 && styles.fosOptionActive]}
                  onPress={() => {
                    setSelectedFosId(0);
                    setIsFosModalOpen(false);
                  }}
                >
                  <Text style={[styles.fosOptionText, selectedFosId === 0 && styles.fosOptionTextActive]}>
                    All Executives
                  </Text>
                </TouchableOpacity>
              )}

              {fosUsers.map((u) => {
                const isSelected = activeTab === 'executive' ? selectedExecFosId === u.userId : selectedFosId === u.userId;
                return (
                  <TouchableOpacity
                    key={u.userId}
                    style={[styles.fosOption, isSelected && styles.fosOptionActive]}
                    onPress={() => {
                      if (activeTab === 'executive') setSelectedExecFosId(u.userId);
                      else setSelectedFosId(u.userId);
                      setIsFosModalOpen(false);
                    }}
                  >
                    <Text style={[styles.fosOptionText, isSelected && styles.fosOptionTextActive]}>
                      {u.userName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PRODUCT PICKER MODAL FOR EXECUTIVE TRANSFER */}
      <Modal
        visible={productPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProductPickerVisible(false)}
      >
        <View style={styles.productPickerBackdrop}>
          <View style={styles.productPickerCard}>
            <View style={styles.fosModalHeader}>
              <Text style={styles.fosModalTitle}>Select Product to Transfer</Text>
              <TouchableOpacity onPress={() => setProductPickerVisible(false)}>
                <Feather name="x" size={20} color="#0E204E" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {execProducts.map((p) => (
                <TouchableOpacity
                  key={p.productId}
                  style={styles.pickerProductRow}
                  onPress={() => handleAddProductToCart(p)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerProdName}>{p.productName}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <View style={[styles.stockPillBadge, { backgroundColor: p.newQuantity > 0 ? '#ECFDF5' : '#FEF2F2' }]}>
                        <Feather name="package" size={11} color={p.newQuantity > 0 ? '#059669' : '#DC2626'} />
                        <Text style={[styles.stockPillText, { color: p.newQuantity > 0 ? '#059669' : '#DC2626' }]}>
                          In-Hand: {p.newQuantity} {p.qty || ''}
                        </Text>
                      </View>
                      {p.productType === 'Serial No' && (
                        <View style={[styles.stockPillBadge, { backgroundColor: '#F5F3FF' }]}>
                          <Feather name="hash" size={11} color="#7C3AED" />
                          <Text style={[styles.stockPillText, { color: '#7C3AED' }]}>
                            {p.stock_imei?.length || p.newQuantity} IMEIs in stock
                          </Text>
                        </View>
                      )}
                      <View style={[styles.stockPillBadge, { backgroundColor: '#F1F5F9' }]}>
                        <Text style={[styles.stockPillText, { color: '#475569' }]}>
                          {p.productType}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.pickerProdMeta}>
                      Rate: {formatIndianCurrency(p.productPrice)}
                    </Text>
                  </View>
                  <Feather name="plus-circle" size={22} color="#0047AB" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BARCODE SCANNER MODAL */}
      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          if (activeImeiCartIndex !== null) {
            setTransferCart((prev) =>
              prev.map((c, idx) => {
                if (idx !== activeImeiCartIndex) return c;
                if (c.selectedImeis.includes(code)) return c;
                const nextImeis = [...c.selectedImeis, code];
                return {
                  ...c,
                  selectedImeis: nextImeis,
                  quantity: Math.max(1, nextImeis.length),
                };
              })
            );
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
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
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#5A6B87',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // 4-Tab Navigation Strip
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
    gap: 6,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F4F8FD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  tabItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
  },
  tabItemTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 2,
  },
  tabBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0E204E',
  },
  tabBadgeTextActive: {
    color: '#0047AB',
  },

  // Search & Filter Strip
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  searchAndFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 5,
  },
  dateFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
    maxWidth: 75,
  },
  fosFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  fosFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    maxWidth: 90,
  },
  searchBox: {
    flex: 1,
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
    fontSize: 12,
    color: '#0E204E',
    paddingVertical: 0,
  },

  contentScroll: {
    flex: 1,
  },
  contentScrollContent: {
    padding: 14,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    color: '#64748B',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginTop: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F4F8FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },

  // Cards
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  executiveNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E204E',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  metaDot: {
    fontSize: 11,
    color: '#94A3B8',
  },
  expandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0E204E',
    marginTop: 1,
  },

  // Expanded Content
  expandedContent: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  expandedSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  productItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  productItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  productIndexCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productIndexText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  productNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  productSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  productStockText: {
    fontSize: 11,
    color: '#64748B',
  },
  productRequestedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  imeiPillText: {
    fontSize: 10,
    color: '#7C3AED',
    marginTop: 2,
  },

  // IMEI Allocation in Pending Request
  imeiAllocationBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  imeiAllocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  imeiAllocationTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0047AB',
  },
  autoSelectImeiBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  autoSelectImeiBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0047AB',
  },
  imeiChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  imeiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imeiChipActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  imeiChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  imeiChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noPreloadedImeiText: {
    fontSize: 11,
    color: '#DC2626',
    marginBottom: 6,
  },
  manualImeiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  manualImeiInput: {
    flex: 1,
    height: 34,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#0E204E',
  },
  manualImeiAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0047AB',
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 3,
  },
  manualImeiAddBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Actions
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 4,
  },
  rejectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0047AB',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Transferred / Cancelled Cards
  transferredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  cancelledCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  cancelledProductText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Executive Transfer Form
  execTransferContainer: {
    gap: 12,
  },
  formFieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  selectExecutiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  selectExecutiveText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  transferHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  transferSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0047AB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  addProductBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyCartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 6,
  },
  emptyCartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E204E',
  },
  emptyCartSub: {
    fontSize: 11,
    color: '#64748B',
  },
  cartItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 8,
  },
  cartItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
  },
  cartItemPrice: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  serialIndicatorBadge: {
    backgroundColor: '#FFF2E5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  serialIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6E00',
  },
  qtyAdjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    gap: 8,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
    minWidth: 18,
    textAlign: 'center',
  },

  // Cart IMEI manager section
  cartImeiManagerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cartImeiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cartImeiTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  manageImeisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  manageImeisBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0047AB',
  },
  selectedImeiPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  selectedImeiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  selectedImeiPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0047AB',
  },
  addImeiWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  addImeiWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },

  submitTransferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0047AB',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
  submitTransferBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  fosModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  fosModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fosModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
  },
  fosOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fosOptionActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  fosOptionText: {
    fontSize: 13,
    color: '#0E204E',
    fontWeight: '600',
  },
  fosOptionTextActive: {
    color: '#0047AB',
    fontWeight: '800',
  },

  // IMEI Cart Modal
  imeiModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    maxHeight: '85%',
    gap: 10,
  },
  imeiSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imeiSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  imeiSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0E204E',
    paddingVertical: 0,
  },
  imeiScanBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imeiOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  imeiOptionRowActive: {
    backgroundColor: '#EFF6FF',
  },
  imeiCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  imeiCheckboxActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  imeiOptionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  imeiOptionTextActive: {
    color: '#0047AB',
    fontWeight: '800',
  },
  imeiModalDoneBtn: {
    backgroundColor: '#0047AB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  imeiModalDoneBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  productPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  productPickerCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '75%',
  },
  pickerProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerProdName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  pickerProdMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  stockPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cartItemStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  cartItemRateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
  },
  cartImeiStockSubtitle: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  imeiQuickActionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  inStockBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  inStockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  toolbarActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
  },
  toolbarActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  inStockImeiBadge: {
    marginLeft: 'auto',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inStockImeiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  dispatchedImeiChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dispatchedImeiChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0047AB',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
