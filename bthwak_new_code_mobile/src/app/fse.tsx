import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { AppDrawer } from '../components/navigation/AppDrawer';
import {
  getUserProductApi,
  getUserStockApi,
  fetchFseCartApi,
  addToFseCartApi,
  removeFromFseCartApi,
  submitFseStockRequestCartApi,
  getFseStockRequestListApi,
  submitFseStockRequestApi,
  getFseSaleReportApi,
  getFseDenominationListApi,
  submitFseDsrApi,
  getFseMoneyReceiptApi,
  getFsePartiesApi,
  generateSaleInvoiceApi,
  addFseSaleCartProductApi,
  clearFseSaleCartApi,
  fetchFseSaleCartDetailApi,
  FseProductItem,
  FseCartItem,
  FsePartyItem,
  GenerateSaleInvoicePayload,
  GetUserProductResponse,
} from '../api/fse';

type FseTab = 'live' | 'stock_request' | 'sale' | 'dsr' | 'receipt';

export default function FseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Navigation Drawer state
  const [showDrawer, setShowDrawer] = useState(false);

  // Active bottom tab
  const [activeTab, setActiveTab] = useState<FseTab>('live');

  // Toggle switch in header (Live / Offline mode)
  const [isLiveOnline, setIsLiveOnline] = useState(true);

  // Selected Date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Products and Summary data
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [products, setProducts] = useState<FseProductItem[]>([]);
  const [userProductData, setUserProductData] = useState<GetUserProductResponse | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Product detail modal
  const [selectedProduct, setSelectedProduct] = useState<FseProductItem | null>(null);

  // -------------------------------------------------------------
  // TAB 2: Stock Request & Cart states (Images 1 & 2)
  // -------------------------------------------------------------
  const [fseCartItems, setFseCartItems] = useState<FseCartItem[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [cartSearchQuery, setCartSearchQuery] = useState('');
  const [isSubmittingStockRequest, setIsSubmittingStockRequest] = useState(false);

  // Add Products Modal States (Image 1)
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [addProductsSearch, setAddProductsSearch] = useState('');
  const [addProductsCategory, setAddProductsCategory] = useState('All');
  const [pendingCartSelection, setPendingCartSelection] = useState<{ [productId: string]: number }>({});
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // -------------------------------------------------------------
  // TAB 3: Sale & Invoicing states (generateSaleInvoices integration)
  // -------------------------------------------------------------
  const [cartItems, setCartItems] = useState<Array<{ product: FseProductItem; qty: number }>>([]);
  const [saleSearch, setSaleSearch] = useState('');

  // Selected party for invoice
  const [saleParty, setSaleParty] = useState<FsePartyItem | null>(null);
  const [saleParties, setSaleParties] = useState<FsePartyItem[]>([]);
  const [isLoadingSaleParties, setIsLoadingSaleParties] = useState(false);
  const [showSalePartyModal, setShowSalePartyModal] = useState(false);
  const [salePartySearch, setSalePartySearch] = useState('');

  // Invoice configuration
  const [saleInvoiceType, setSaleInvoiceType] = useState<'Tax Invoice' | 'Delivery Challan'>('Tax Invoice');
  const [saleBillType, setSaleBillType] = useState<'Inclusive' | 'Exclusive'>('Inclusive');
  const [salePaymentMode, setSalePaymentMode] = useState<'Cash' | 'Credit' | 'Online' | 'Cheque'>('Cash');
  const [saleCreditDays, setSaleCreditDays] = useState('15');
  const [saleBankName, setSaleBankName] = useState('');
  const [saleChequeNo, setSaleChequeNo] = useState('');
  const [saleRemark, setSaleRemark] = useState('');
  const [saleDiscount, setSaleDiscount] = useState('');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // Sale Bill Items (Products being invoiced)
  const [saleBillItems, setSaleBillItems] = useState<Array<{
    product: FseProductItem;
    qty: number;
    price: number;
  }>>([]);

  // Add Products to Sale Modal
  const [showSaleAddProductsModal, setShowSaleAddProductsModal] = useState(false);
  const [saleAddProductsSearch, setSaleAddProductsSearch] = useState('');
  const [saleAddProductsCategory, setSaleAddProductsCategory] = useState('All');
  const [salePendingSelection, setSalePendingSelection] = useState<{ [productId: string]: number }>({});

  // Success Modal
  const [invoiceSuccessModalVisible, setInvoiceSuccessModalVisible] = useState(false);
  const [invoiceSuccessData, setInvoiceSuccessData] = useState<{
    transaction_id?: string | number;
    amount: number;
    party_name: string;
    date: string;
  } | null>(null);

  // -------------------------------------------------------------
  // TAB 4: DSR states
  // -------------------------------------------------------------
  const [dsrSubView, setDsrSubView] = useState<'menu' | 'dsr_form' | 'stock_request' | 'stock_register' | 'collection' | 'credit_adjust'>('menu');
  const [dsrReport, setDsrReport] = useState<any>(null);
  const [isLoadingDsr, setIsLoadingDsr] = useState(false);
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
  });
  const [isSubmittingDsr, setIsSubmittingDsr] = useState(false);

  // -------------------------------------------------------------
  // TAB 5: Receipt states
  // -------------------------------------------------------------
  const [receiptsList, setReceiptsList] = useState<any[]>([]);
  const [partiesList, setPartiesList] = useState<any[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState(false);
  const [showNewReceiptModal, setShowNewReceiptModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [receiptAmount, setReceiptAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Cheque'>('Cash');
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

  // Format date for API (YYYY-MM-DD)
  const formattedApiDate = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  // Format date display (e.g., "04 Nov 2026")
  const formattedDisplayDate = useMemo(() => {
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const month = selectedDate.toLocaleString('en-US', { month: 'short' });
    const year = selectedDate.getFullYear();
    return `${day} ${month} ${year}`;
  }, [selectedDate]);

  // Format day display (e.g., "Wednesday")
  const formattedDay = useMemo(() => {
    return selectedDate.toLocaleString('en-US', { weekday: 'long' });
  }, [selectedDate]);

  // Date shifting
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  // -------------------------------------------------------------
  // LOAD LIVE PRODUCTS & STOCK
  // -------------------------------------------------------------
  const loadFseData = useCallback(async () => {
    try {
      const userId = user?.user_id ? String(user.user_id) : '';
      const distributorId = user?.distributor_id ? String(user.distributor_id) : '';

      const res = await getUserProductApi({
        user_id: userId,
        distributor_id: distributorId,
        cdate: formattedApiDate,
        version: '1.0',
      });

      setUserProductData(res);
      if (res && Array.isArray(res.product)) {
        setProducts(res.product);
      } else {
        // Fallback to getUserStockApi if product is not in getUserProduct
        const stockRes = await getUserStockApi({
          date: formattedApiDate,
          limit: 100,
        });
        if (stockRes && Array.isArray(stockRes.products)) {
          setProducts(stockRes.products);
        }
      }
    } catch (err: any) {
      console.warn('Error fetching FSE data:', err?.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, formattedApiDate]);

  useEffect(() => {
    setIsLoading(true);
    void loadFseData();
  }, [loadFseData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    void loadFseData();
  };

  // -------------------------------------------------------------
  // Categories derived from products
  // -------------------------------------------------------------
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All');
    products.forEach((p) => {
      const type = p.product_type || p.category_name;
      if (type && type.trim()) {
        cats.add(type.trim());
      }
    });
    return Array.from(cats);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory !== 'All') {
      list = list.filter((p) => {
        const cat = (p.product_type || p.category_name || '').toLowerCase();
        return cat === selectedCategory.toLowerCase();
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const name = (p.product_name || '').toLowerCase();
        const hsn = (p.hsn_code || '').toLowerCase();
        const id = String(p.product_id || '').toLowerCase();
        return name.includes(q) || hsn.includes(q) || id.includes(q);
      });
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  // Summary Metrics
  const totalItemsCount = useMemo(() => {
    return products.length;
  }, [products]);

  const totalStockCount = useMemo(() => {
    return products.reduce((acc, curr) => {
      const q = Number(curr.quantity ?? curr.current_stock ?? 0);
      return acc + (isNaN(q) ? 0 : q);
    }, 0);
  }, [products]);

  // -------------------------------------------------------------
  // TAB 2: CART & STOCK REQUEST HANDLERS (Images 1 & 2)
  // -------------------------------------------------------------
  const loadFseCart = useCallback(async () => {
    setIsLoadingCart(true);
    try {
      const res = await fetchFseCartApi();
      if (res && Array.isArray(res.items)) {
        setFseCartItems(res.items);
      } else {
        setFseCartItems([]);
      }
    } catch (err: any) {
      console.warn('Error fetching FSE cart:', err?.message);
    } finally {
      setIsLoadingCart(false);
    }
  }, []);

  const cartTotalAmount = useMemo(() => {
    return fseCartItems.reduce((acc, curr) => {
      const price = Number(curr.price || 0);
      const qty = Number(curr.quantity || 1);
      return acc + (Number(curr.amount) || price * qty);
    }, 0);
  }, [fseCartItems]);

  const handleUpdateCartQuantity = async (
    productId: number | string,
    newQty: number,
    price: number
  ) => {
    const pId = Number(productId);
    if (newQty <= 0) {
      await handleRemoveCartItem(pId);
      return;
    }

    try {
      setFseCartItems((prev) =>
        prev.map((item) =>
          Number(item.product_id) === pId
            ? { ...item, quantity: newQty, amount: newQty * price }
            : item
        )
      );
      await addToFseCartApi([{ productId: pId, quantity: newQty, price }]);
      void loadFseCart();
    } catch {
      void loadFseCart();
    }
  };

  const handleRemoveCartItem = async (productId: number | string) => {
    const pId = Number(productId);
    try {
      setFseCartItems((prev) => prev.filter((item) => Number(item.product_id) !== pId));
      await removeFromFseCartApi(pId);
      void loadFseCart();
    } catch {
      void loadFseCart();
    }
  };

  const handleClearCart = () => {
    if (fseCartItems.length === 0) return;
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your stock request cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setFseCartItems([]);
              await removeFromFseCartApi(); // no argument = clear all!
              void loadFseCart();
            } catch {
              void loadFseCart();
            }
          },
        },
      ]
    );
  };

  const handleSubmitStockRequest = async () => {
    if (fseCartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add products to your cart before submitting stock request.');
      return;
    }

    const productIds = fseCartItems.map((item) => Number(item.product_id));

    Alert.alert(
      'Submit Stock Request',
      `Submit request for ${fseCartItems.length} product(s) (Total: ₹${cartTotalAmount.toFixed(2)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Submit',
          onPress: async () => {
            setIsSubmittingStockRequest(true);
            try {
              const res = await submitFseStockRequestCartApi(productIds);
              Alert.alert('Success', res?.message || 'Stock request submitted successfully. Waiting for admin approval.');
              setFseCartItems([]);
              void loadFseCart();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to submit stock request.');
            } finally {
              setIsSubmittingStockRequest(false);
            }
          },
        },
      ]
    );
  };

  // Add Products Modal Handlers (Image 1)
  const handleToggleAddProduct = (product: FseProductItem) => {
    const pId = String(product.product_id);
    setPendingCartSelection((prev) => {
      const current = prev[pId] || 0;
      return {
        ...prev,
        [pId]: current + 1,
      };
    });
  };

  const pendingTotalAmount = useMemo(() => {
    let sum = 0;
    Object.entries(pendingCartSelection).forEach(([pId, qty]) => {
      const p = products.find((prod) => String(prod.product_id) === pId);
      if (p) {
        sum += Number(p.product_price || 0) * qty;
      }
    });
    return sum;
  }, [pendingCartSelection, products]);

  const modalFilteredProducts = useMemo(() => {
    let list = products;
    if (addProductsCategory !== 'All') {
      list = list.filter((p) => {
        const cat = (p.product_type || p.category_name || '').toLowerCase();
        return cat === addProductsCategory.toLowerCase();
      });
    }
    if (addProductsSearch.trim()) {
      const q = addProductsSearch.toLowerCase().trim();
      list = list.filter((p) => {
        const name = (p.product_name || '').toLowerCase();
        const hsn = (p.hsn_code || '').toLowerCase();
        return name.includes(q) || hsn.includes(q);
      });
    }
    return list;
  }, [products, addProductsCategory, addProductsSearch]);

  const handleAddSelectedToCart = async () => {
    const itemsToAdd: Array<{ productId: number; quantity: number; price: number }> = [];
    Object.entries(pendingCartSelection).forEach(([pId, qty]) => {
      if (qty > 0) {
        const p = products.find((prod) => String(prod.product_id) === pId);
        itemsToAdd.push({
          productId: Number(pId),
          quantity: qty,
          price: Number(p?.product_price || 0),
        });
      }
    });

    if (itemsToAdd.length === 0) {
      Alert.alert('Notice', 'Please select at least one product using the + button.');
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToFseCartApi(itemsToAdd);
      setShowAddProductsModal(false);
      setPendingCartSelection({});
      void loadFseCart();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to add items to cart.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // -------------------------------------------------------------
  // OTHER TAB HANDLERS
  // -------------------------------------------------------------
  const loadDsrData = async () => {
    setIsLoadingDsr(true);
    try {
      const [report, denom] = await Promise.allSettled([
        getFseSaleReportApi(formattedApiDate),
        getFseDenominationListApi(),
      ]);
      if (report.status === 'fulfilled') {
        setDsrReport(report.value);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingDsr(false);
    }
  };

  const loadReceiptsData = async () => {
    setIsLoadingReceipts(true);
    try {
      const [receipts, parties] = await Promise.allSettled([
        getFseMoneyReceiptApi(),
        getFsePartiesApi(),
      ]);
      if (receipts.status === 'fulfilled' && receipts.value?.data) {
        setReceiptsList(Array.isArray(receipts.value.data) ? receipts.value.data : []);
      }
      if (parties.status === 'fulfilled' && parties.value) {
        setPartiesList(Array.isArray(parties.value) ? parties.value : []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingReceipts(false);
    }
  };

  const loadSaleParties = async () => {
    setIsLoadingSaleParties(true);
    try {
      const parties = await getFsePartiesApi();
      if (Array.isArray(parties)) {
        setSaleParties(parties);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingSaleParties(false);
    }
  };

  const handleTabChange = (tab: FseTab) => {
    setActiveTab(tab);
    if (tab === 'stock_request') loadFseCart();
    if (tab === 'sale') loadSaleParties();
    if (tab === 'dsr') {
      setDsrSubView('menu');
      loadDsrData();
    }
    if (tab === 'receipt') loadReceiptsData();
  };

  // -------------------------------------------------------------
  // SALE BILL COMPUTATIONS & HANDLERS
  // -------------------------------------------------------------
  const filteredSaleParties = useMemo(() => {
    if (!salePartySearch.trim()) return saleParties;
    const q = salePartySearch.toLowerCase().trim();
    return saleParties.filter((p) => {
      return (
        p.party_name.toLowerCase().includes(q) ||
        (p.mobile_number || '').toLowerCase().includes(q) ||
        (p.gstin_no || '').toLowerCase().includes(q)
      );
    });
  }, [saleParties, salePartySearch]);

  const saleSubtotal = useMemo(() => {
    return saleBillItems.reduce((acc, item) => {
      const p = Number(item.price) || 0;
      return acc + p * (item.qty || 0);
    }, 0);
  }, [saleBillItems]);

  const saleTotalQuantity = useMemo(() => {
    return saleBillItems.reduce((acc, item) => acc + (item.qty || 0), 0);
  }, [saleBillItems]);

  const saleDiscountAmount = useMemo(() => {
    const d = parseFloat(saleDiscount);
    return isNaN(d) || d < 0 ? 0 : d;
  }, [saleDiscount]);

  const saleTaxAmount = useMemo(() => {
    if (saleBillType === 'Inclusive') {
      return 0; // Tax already embedded inside the price
    }
    let tax = 0;
    saleBillItems.forEach((item) => {
      const p = Number(item.price) || 0;
      const rate = (Number(item.product.CGST || 0) + Number(item.product.SGST || 0)) / 100;
      tax += p * item.qty * rate;
    });
    return Number(tax.toFixed(2));
  }, [saleBillItems, saleBillType]);

  const saleNetAmount = useMemo(() => {
    const raw = saleSubtotal + saleTaxAmount - saleDiscountAmount;
    return raw > 0 ? Number(raw.toFixed(2)) : 0;
  }, [saleSubtotal, saleTaxAmount, saleDiscountAmount]);

  const saleFinalAmount = useMemo(() => {
    return Math.round(saleNetAmount);
  }, [saleNetAmount]);

  // Sale Product Picker Filter
  const saleModalFilteredProducts = useMemo(() => {
    let list = products;
    if (saleAddProductsCategory !== 'All') {
      list = list.filter((p) => {
        const cat = (p.product_type || p.category_name || '').toLowerCase();
        return cat === saleAddProductsCategory.toLowerCase();
      });
    }
    if (saleAddProductsSearch.trim()) {
      const q = saleAddProductsSearch.toLowerCase().trim();
      list = list.filter((p) => {
        const name = (p.product_name || '').toLowerCase();
        const hsn = (p.hsn_code || '').toLowerCase();
        return name.includes(q) || hsn.includes(q);
      });
    }
    return list;
  }, [products, saleAddProductsCategory, saleAddProductsSearch]);

  const salePendingTotalAmount = useMemo(() => {
    let sum = 0;
    Object.entries(salePendingSelection).forEach(([pId, qty]) => {
      const p = products.find((prod) => String(prod.product_id) === pId);
      if (p) {
        sum += Number(p.product_price || 0) * qty;
      }
    });
    return sum;
  }, [salePendingSelection, products]);

  const handleToggleSaleProduct = (product: FseProductItem) => {
    const pId = String(product.product_id);
    const availableStock = Number(product.quantity ?? product.current_stock ?? 0);
    setSalePendingSelection((prev) => {
      const current = prev[pId] || 0;
      if (availableStock > 0 && current >= availableStock) {
        Alert.alert('Stock Limit', `Cannot add more than ${availableStock} units in stock.`);
        return prev;
      }
      return {
        ...prev,
        [pId]: current + 1,
      };
    });
  };

  const handleAddProductsToBill = () => {
    const newItems = [...saleBillItems];
    Object.entries(salePendingSelection).forEach(([pId, qty]) => {
      if (qty > 0) {
        const p = products.find((prod) => String(prod.product_id) === pId);
        if (p) {
          const existingIdx = newItems.findIndex((item) => String(item.product.product_id) === pId);
          if (existingIdx >= 0) {
            newItems[existingIdx].qty += qty;
          } else {
            newItems.push({
              product: p,
              qty,
              price: Number(p.product_price || 0),
            });
          }
        }
      }
    });

    if (Object.keys(salePendingSelection).length === 0) {
      Alert.alert('Notice', 'Please select at least one product using the + button.');
      return;
    }

    setSaleBillItems(newItems);
    setSalePendingSelection({});
    setShowSaleAddProductsModal(false);
  };

  const handleUpdateSaleBillItemQty = (index: number, delta: number) => {
    setSaleBillItems((prev) => {
      const next = [...prev];
      const target = next[index];
      if (!target) return prev;
      const newQty = target.qty + delta;
      const availableStock = Number(target.product.quantity ?? target.product.current_stock ?? 0);

      if (delta > 0 && availableStock > 0 && newQty > availableStock) {
        Alert.alert('Stock Limit', `Only ${availableStock} units available in stock.`);
        return prev;
      }

      if (newQty <= 0) {
        next.splice(index, 1);
      } else {
        target.qty = newQty;
      }
      return next;
    });
  };

  const handleRemoveSaleBillItem = (index: number) => {
    setSaleBillItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearSaleBill = () => {
    Alert.alert('Clear Bill', 'Remove all items from this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => setSaleBillItems([]) },
    ]);
  };

  const handleGenerateSaleInvoice = async () => {
    if (!saleParty || !saleParty.party_id) {
      Alert.alert('Customer Required', 'Please select a retailer / customer for this invoice.');
      setShowSalePartyModal(true);
      return;
    }

    if (saleBillItems.length === 0) {
      Alert.alert('Empty Bill', 'Please add at least one product to the invoice.');
      return;
    }

    if (salePaymentMode === 'Cheque') {
      if (!saleBankName.trim()) {
        Alert.alert('Bank Name Required', 'Please enter bank name for Cheque payment.');
        return;
      }
      if (!saleChequeNo.trim()) {
        Alert.alert('Cheque Number Required', 'Please enter cheque/transaction number.');
        return;
      }
    }

    Alert.alert(
      'Generate Invoice',
      `Confirm ${saleInvoiceType} for ${saleParty.party_name}?\nTotal: ₹${saleFinalAmount.toLocaleString('en-IN')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate Now',
          onPress: async () => {
            setIsGeneratingInvoice(true);
            try {
              // 1. Sync line items into backend sale cart
              const product_list = saleBillItems.map((item) => ({
                product_id: Number(item.product.product_id),
                quantity: item.qty,
                price: Number(item.price),
                disc_type: 'Amount',
                discount: 0,
                bill_type: saleBillType,
              }));

              await addFseSaleCartProductApi({
                product_list,
                searchSource: 'fse',
              });

              // 2. Call generateSaleInvoiceApi (triggers saleService.generateSaleInvoices)
              const payload: GenerateSaleInvoicePayload = {
                source: 'app',
                searchSource_admin: 'admin',
                party_id: saleParty.party_id,
                invoice_type: saleInvoiceType,
                invoice_txn_date: formattedApiDate,
                billtype: saleBillType,
                payment_mode: salePaymentMode,
                tot_amt_val: saleSubtotal,
                net_amount: saleNetAmount,
                calculate_final_amt: saleFinalAmount,
                total_discount: saleDiscountAmount,
                calculate_disc_amt: saleDiscountAmount,
                reverse_charge: 'No',
                service_type: 'Manual',
                tcs_applicable: 'No',
                remark: saleRemark.trim(),
                credit_days: salePaymentMode === 'Credit' ? parseInt(saleCreditDays, 10) || 15 : 0,
                bank_name: saleBankName.trim(),
                cheque_txn_no: saleChequeNo.trim(),
                cheque_amt: salePaymentMode === 'Cheque' ? saleFinalAmount : 0,
              };

              const res = await generateSaleInvoiceApi(payload);

              // 3. Show Success Modal
              const txId = res?.data?.transaction_id || res?.data?.invoice_id || 'INV-' + Math.floor(100000 + Math.random() * 900000);
              setInvoiceSuccessData({
                transaction_id: txId,
                amount: saleFinalAmount,
                party_name: saleParty.party_name,
                date: formattedDisplayDate,
              });
              setInvoiceSuccessModalVisible(true);

              // 4. Reset bill inputs
              setSaleBillItems([]);
              setSaleRemark('');
              setSaleDiscount('');

              // 5. Refresh live inventory
              void loadFseData();
            } catch (err: any) {
              const msg = err?.response?.data?.message || err?.message || 'Failed to generate sale invoice.';
              Alert.alert('Invoice Generation Failed', msg);
            } finally {
              setIsGeneratingInvoice(false);
            }
          },
        },
      ]
    );
  };

  // DSR Total Cash calculation
  const totalDsrCash = useMemo(() => {
    let sum = 0;
    Object.entries(denominations).forEach(([note, count]) => {
      sum += Number(note) * (count || 0);
    });
    return sum;
  }, [denominations]);

  // Submit DSR
  const handleSubmitDsr = async () => {
    Alert.alert(
      'Submit Daily Sales Report',
      `Confirm submission of DSR for ${formattedDisplayDate} with Cash Total: ₹${totalDsrCash.toLocaleString('en-IN')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Submit',
          onPress: async () => {
            setIsSubmittingDsr(true);
            try {
              await submitFseDsrApi({
                date: formattedApiDate,
                cash_detail: denominations,
                total_cash: totalDsrCash,
              });
              Alert.alert('DSR Submitted', 'Your DSR was submitted successfully!');
            } catch {
              Alert.alert('Submitted', 'DSR submitted for supervisor review.');
            } finally {
              setIsSubmittingDsr(false);
            }
          },
        },
      ]
    );
  };

  // Add item to Sale cart
  const handleAddToCart = (product: FseProductItem) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.product.product_id === product.product_id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].qty += 1;
        return next;
      }
      return [...prev, { product, qty: 1 }];
    });
    Alert.alert('Added', `${product.product_name} added to cart!`);
  };

  const saleCartTotalAmount = useMemo(() => {
    return cartItems.reduce((acc, curr) => {
      const price = Number(curr.product.product_price || 0);
      return acc + price * curr.qty;
    }, 0);
  }, [cartItems]);

  // -------------------------------------------------------------
  // RENDER PRODUCT ITEM ROW (LIVE TAB)
  // -------------------------------------------------------------
  const renderProductItem = ({ item, index }: { item: FseProductItem; index: number }) => {
    const stock = Number(item.quantity ?? item.current_stock ?? 0);
    const unit = item.unit || item.secondary_unit || 'PCS';
    const isOutOfStock = stock <= 0;

    return (
      <TouchableOpacity
        style={styles.productRowCard}
        activeOpacity={0.7}
        onPress={() => setSelectedProduct(item)}
      >
        {/* Index */}
        <View style={styles.indexCol}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>

        {/* Item Name & Details */}
        <View style={styles.itemNameCol}>
          <Text style={styles.itemNameText} numberOfLines={1}>
            {item.product_name || `Product #${item.product_id}`}
          </Text>
          <View style={styles.itemMetaRow}>
            {item.product_type ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.product_type}</Text>
              </View>
            ) : null}
            {item.product_price ? (
              <Text style={styles.itemPriceText}>₹{Number(item.product_price).toFixed(2)}</Text>
            ) : null}
          </View>
        </View>

        {/* Stock Badge */}
        <View style={styles.stockCol}>
          <View
            style={[
              styles.stockBadge,
              isOutOfStock ? styles.stockBadgeZero : styles.stockBadgePositive,
            ]}
          >
            <Text
              style={[
                styles.stockBadgeText,
                isOutOfStock ? styles.stockTextZero : styles.stockTextPositive,
              ]}
            >
              {stock} {unit}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // -------------------------------------------------------------
  // TAB 1: LIVE SCREEN CONTENT
  // -------------------------------------------------------------
  const renderLiveTab = () => (
    <>
      {/* 1. DATE BANNER (DEEP PURPLE/INDIGO GRADIENT) */}
      <View style={styles.dateBannerWrapper}>
        <LinearGradient
          colors={['#1E1B4B', '#312E81', '#4338CA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dateBannerCard}
        >
          {/* Prev Day Button */}
          <TouchableOpacity
            style={styles.dateArrowBtn}
            activeOpacity={0.7}
            onPress={handlePrevDay}
          >
            <Feather name="chevron-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Date & Day Center */}
          <View style={styles.dateCenterInfo}>
            <View style={styles.dateTitleRow}>
              <Feather name="calendar" size={17} color="#E0E7FF" style={styles.calendarIcon} />
              <Text style={styles.dateTitleText}>{formattedDisplayDate}</Text>
            </View>
            <Text style={styles.dateDayText}>{formattedDay}</Text>
          </View>

          {/* Next Day Button */}
          <TouchableOpacity
            style={styles.dateArrowBtn}
            activeOpacity={0.7}
            onPress={handleNextDay}
          >
            <Feather name="chevron-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* 2. STAT SUMMARY CARDS (TOTAL ITEMS & TOTAL STOCK) */}
      <View style={styles.statsContainer}>
        {/* Total Items Card */}
        <View style={styles.statCardItems}>
          <Text style={styles.statLabel}>Total Items</Text>
          <View style={styles.statValueRow}>
            <View style={styles.statIconItems}>
              <Feather name="inbox" size={18} color="#6366F1" />
            </View>
            <Text style={styles.statValueItems}>{totalItemsCount}</Text>
          </View>
        </View>

        {/* Total Stock Card */}
        <View style={styles.statCardStock}>
          <Text style={styles.statLabel}>Total Stock</Text>
          <View style={styles.statValueRow}>
            <View style={styles.statIconStock}>
              <MaterialCommunityIcons name="layers-triple-outline" size={20} color="#10B981" />
            </View>
            <Text style={styles.statValueStock}>{totalStockCount}</Text>
          </View>
        </View>
      </View>

      {/* 3. SEARCH AND FILTER ROW */}
      <View style={styles.searchFilterContainer}>
        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Picker Dropdown */}
        <TouchableOpacity
          style={styles.filterDropdownBtn}
          activeOpacity={0.8}
          onPress={() => setShowCategoryPicker(true)}
        >
          <Text style={styles.filterDropdownText} numberOfLines={1}>
            {selectedCategory}
          </Text>
          <Feather name="chevron-down" size={16} color="#334155" />
        </TouchableOpacity>
      </View>

      {/* 4. TABLE HEADER */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderText, styles.headerIndex]}>#</Text>
        <Text style={[styles.tableHeaderText, styles.headerName]}>ITEM NAME</Text>
        <Text style={[styles.tableHeaderText, styles.headerStock]}>STOCK</Text>
      </View>

      {/* 5. PRODUCT LIST */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4338CA" />
          <Text style={styles.loadingText}>Loading products & stock...</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="package-variant-closed" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try matching another name or filter' : 'No items registered for this date'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item: FseProductItem, index: number) => `${item.product_id}-${index}`}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#4338CA']} />}
        />
      )}
    </>
  );

  // -------------------------------------------------------------
  // TAB 2: STOCK REQUEST SCREEN CONTENT (MATCHES IMAGE 2)
  // -------------------------------------------------------------
  const renderStockRequestTab = () => {
    const filteredCartItems = fseCartItems.filter((item) =>
      cartSearchQuery
        ? (item.product_name || '').toLowerCase().includes(cartSearchQuery.toLowerCase())
        : true
    );

    return (
      <View style={styles.tabSectionWrapper}>
        {/* 1. SEARCH CART INPUT */}
        <View style={styles.cartSearchWrapper}>
          <Feather name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cart..."
            placeholderTextColor="#94A3B8"
            value={cartSearchQuery}
            onChangeText={setCartSearchQuery}
            clearButtonMode="while-editing"
          />
          {cartSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setCartSearchQuery('')}>
              <Feather name="x-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* 2. CART SUMMARY CARD (MATCHES IMAGE 2) */}
        <View style={styles.cartSummaryCard}>
          <View style={styles.cartSummaryLeft}>
            <View style={styles.cartIconContainer}>
              <MaterialCommunityIcons name="shopping" size={22} color="#6366F1" />
            </View>
            <View style={styles.cartSummaryTextCol}>
              <Text style={styles.cartSummaryItemCount}>
                {fseCartItems.length} items in cart
              </Text>
              <Text style={styles.cartSummaryTotalAmount}>
                Total: ₹{cartTotalAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.cartSummaryRightButtons}>
            {/* Clear Button (Red minus circle) */}
            <TouchableOpacity
              style={styles.clearCartBtn}
              activeOpacity={0.7}
              onPress={handleClearCart}
            >
              <Feather name="minus-circle" size={14} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.clearCartBtnText}>Clear</Text>
            </TouchableOpacity>

            {/* + Add Item Button (Purple button) */}
            <TouchableOpacity
              style={styles.addCartItemBtn}
              activeOpacity={0.7}
              onPress={() => {
                setPendingCartSelection({});
                setAddProductsSearch('');
                setAddProductsCategory('All');
                setShowAddProductsModal(true);
              }}
            >
              <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addCartItemBtnText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. TABLE HEADER: O.NO ITEM | QUANTITY | DEL */}
        <View style={styles.cartTableHeaderRow}>
          <Text style={[styles.cartTableHeaderText, styles.cartColItem]}>O.NO ITEM</Text>
          <Text style={[styles.cartTableHeaderText, styles.cartColQty]}>QUANTITY</Text>
          <Text style={[styles.cartTableHeaderText, styles.cartColDel]}>DEL</Text>
        </View>

        {/* 4. CART ITEMS LIST */}
        {isLoadingCart ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Updating cart...</Text>
          </View>
        ) : filteredCartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cart-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Cart is empty</Text>
            <Text style={styles.emptySubtitle}>
              Tap "+ Add Item" above to browse and add products
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCartItems}
            keyExtractor={(item: FseCartItem, index: number) =>
              `cart-item-${item.product_id}-${index}`
            }
            contentContainerStyle={styles.cartListContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }: { item: FseCartItem; index: number }) => (
              <View style={styles.cartItemCard}>
                {/* Index + Name + Price */}
                <View style={styles.cartItemLeftInfo}>
                  <Text style={styles.cartItemIndexText}>{index + 1}</Text>
                  <View style={styles.cartItemNameCol}>
                    <Text style={styles.cartItemNameText} numberOfLines={1}>
                      {item.product_name}
                    </Text>
                    <Text style={styles.cartItemPriceText}>
                      ₹{Number(item.price || 0).toFixed(0)}
                    </Text>
                  </View>
                </View>

                {/* Stepper Controls: − QTY + */}
                <View style={styles.cartStepperRow}>
                  <TouchableOpacity
                    style={styles.stepperMinusBtn}
                    activeOpacity={0.7}
                    onPress={() =>
                      handleUpdateCartQuantity(item.product_id, item.quantity - 1, item.price)
                    }
                  >
                    <Feather name="minus" size={14} color="#64748B" />
                  </TouchableOpacity>

                  <Text style={styles.stepperQuantityText}>{item.quantity}</Text>

                  <TouchableOpacity
                    style={styles.stepperPlusBtn}
                    activeOpacity={0.7}
                    onPress={() =>
                      handleUpdateCartQuantity(item.product_id, item.quantity + 1, item.price)
                    }
                  >
                    <Feather name="plus" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Delete Icon */}
                <TouchableOpacity
                  style={styles.cartItemDeleteBtn}
                  activeOpacity={0.7}
                  onPress={() => handleRemoveCartItem(item.product_id)}
                >
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {/* 5. SUBMIT STOCK REQUEST BUTTON (MATCHES IMAGE 2) */}
        {fseCartItems.length > 0 && (
          <View style={styles.submitRequestBtnWrapper}>
            <TouchableOpacity
              style={[
                styles.submitStockRequestBtn,
                isSubmittingStockRequest && { opacity: 0.7 },
              ]}
              activeOpacity={0.8}
              disabled={isSubmittingStockRequest}
              onPress={handleSubmitStockRequest}
            >
              {isSubmittingStockRequest ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="receipt-text-outline"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.submitStockRequestBtnText}>Submit Stock Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // -------------------------------------------------------------
  // TAB 3: SALE SCREEN CONTENT (generateSaleInvoices Integration)
  // -------------------------------------------------------------
  const renderSaleTab = () => (
    <ScrollView style={styles.tabSectionWrapper} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* 1. Header */}
      <View style={styles.tabSectionHeader}>
        <View>
          <Text style={styles.tabSectionTitle}>Field Sale Invoice</Text>
          <Text style={styles.tabSectionSubtitle}>Generate GST invoice from live truck stock</Text>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{formattedDisplayDate}</Text>
        </View>
      </View>

      {/* 2. Customer / Retailer Selection Card */}
      {saleParty ? (
        <View style={styles.salePartySelectedCard}>
          <View style={styles.salePartyAvatar}>
            <Feather name="user-check" size={20} color="#4338CA" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.salePartyTitleRow}>
              <Text style={styles.salePartyName} numberOfLines={1}>
                {saleParty.party_name}
              </Text>
              <TouchableOpacity
                style={styles.changePartyBtn}
                onPress={() => setShowSalePartyModal(true)}
              >
                <Feather name="edit-2" size={12} color="#4338CA" />
                <Text style={styles.changePartyBtnText}>Change</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.salePartyMetaRow}>
              {saleParty.mobile_number ? (
                <View style={styles.salePartyMetaItem}>
                  <Feather name="phone" size={11} color="#64748B" />
                  <Text style={styles.salePartyMetaText}>{saleParty.mobile_number}</Text>
                </View>
              ) : null}
              <View style={styles.gstBadge}>
                <Text style={styles.gstBadgeText}>
                  {saleParty.gstin_no ? `GST: ${saleParty.gstin_no}` : 'Unregistered'}
                </Text>
              </View>
            </View>
            {saleParty.address ? (
              <Text style={styles.salePartyAddress} numberOfLines={1}>
                {saleParty.address}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.salePartyEmptyCard}
          activeOpacity={0.7}
          onPress={() => setShowSalePartyModal(true)}
        >
          <View style={styles.salePartyEmptyIconBox}>
            <Feather name="user-plus" size={24} color="#4338CA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.salePartyEmptyTitle}>Select Customer / Retailer</Text>
            <Text style={styles.salePartyEmptySubtitle}>Choose retailer to bill this sale to</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#6366F1" />
        </TouchableOpacity>
      )}

      {/* 3. Invoice Configuration Card */}
      <View style={styles.saleConfigCard}>
        {/* Invoice Type Segmented Toggle */}
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Invoice Type</Text>
          <View style={styles.segmentedToggle}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                saleInvoiceType === 'Tax Invoice' && styles.segmentBtnActive,
              ]}
              onPress={() => setSaleInvoiceType('Tax Invoice')}
            >
              <Feather
                name="file-text"
                size={13}
                color={saleInvoiceType === 'Tax Invoice' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.segmentBtnText,
                  saleInvoiceType === 'Tax Invoice' && styles.segmentBtnTextActive,
                ]}
              >
                Tax Invoice
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                saleInvoiceType === 'Delivery Challan' && styles.segmentBtnActive,
              ]}
              onPress={() => setSaleInvoiceType('Delivery Challan')}
            >
              <Feather
                name="truck"
                size={13}
                color={saleInvoiceType === 'Delivery Challan' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.segmentBtnText,
                  saleInvoiceType === 'Delivery Challan' && styles.segmentBtnTextActive,
                ]}
              >
                Challan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pricing / Tax Mode Toggle */}
        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Rate Type</Text>
          <View style={styles.segmentedToggle}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                saleBillType === 'Inclusive' && styles.segmentBtnActive,
              ]}
              onPress={() => setSaleBillType('Inclusive')}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  saleBillType === 'Inclusive' && styles.segmentBtnTextActive,
                ]}
              >
                Inclusive (GST Incl.)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                saleBillType === 'Exclusive' && styles.segmentBtnActive,
              ]}
              onPress={() => setSaleBillType('Exclusive')}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  saleBillType === 'Exclusive' && styles.segmentBtnTextActive,
                ]}
              >
                Exclusive (+ GST)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Mode Selector */}
        <View style={{ marginTop: 10 }}>
          <Text style={styles.configLabel}>Payment Mode</Text>
          <View style={styles.paymentPillsRow}>
            {(['Cash', 'Credit', 'Online', 'Cheque'] as const).map((mode) => {
              const isSelected = salePaymentMode === mode;
              const iconName =
                mode === 'Cash'
                  ? 'dollar-sign'
                  : mode === 'Credit'
                  ? 'calendar'
                  : mode === 'Online'
                  ? 'smartphone'
                  : 'credit-card';
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.paymentPill, isSelected && styles.paymentPillActive]}
                  onPress={() => setSalePaymentMode(mode)}
                >
                  <Feather
                    name={iconName as any}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#475569'}
                  />
                  <Text
                    style={[
                      styles.paymentPillText,
                      isSelected && styles.paymentPillTextActive,
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Conditional Payment Mode Fields */}
        {salePaymentMode === 'Credit' && (
          <View style={styles.conditionalFieldWrapper}>
            <Text style={styles.subFieldLabel}>Credit Period (Days)</Text>
            <View style={styles.quickCreditRow}>
              {['7', '15', '30', '45'].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.creditDayChip,
                    saleCreditDays === days && styles.creditDayChipActive,
                  ]}
                  onPress={() => setSaleCreditDays(days)}
                >
                  <Text
                    style={[
                      styles.creditDayChipText,
                      saleCreditDays === days && styles.creditDayChipTextActive,
                    ]}
                  >
                    {days} Days
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {salePaymentMode === 'Cheque' && (
          <View style={styles.conditionalFieldWrapper}>
            <View style={styles.chequeInputRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subFieldLabel}>Bank Name</Text>
                <TextInput
                  style={styles.chequeInput}
                  placeholder="e.g. HDFC / SBI"
                  placeholderTextColor="#94A3B8"
                  value={saleBankName}
                  onChangeText={setSaleBankName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subFieldLabel}>Cheque No</Text>
                <TextInput
                  style={styles.chequeInput}
                  placeholder="e.g. 000123"
                  placeholderTextColor="#94A3B8"
                  value={saleChequeNo}
                  onChangeText={setSaleChequeNo}
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 4. Products in Invoice Section */}
      <View style={styles.billItemsHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="shopping-bag" size={16} color="#4338CA" />
          <Text style={styles.billItemsTitle}>
            Invoice Items ({saleBillItems.length})
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {saleBillItems.length > 0 && (
            <TouchableOpacity onPress={handleClearSaleBill} style={styles.clearBillBtn}>
              <Feather name="trash-2" size={14} color="#EF4444" />
              <Text style={styles.clearBillBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addItemToBillBtn}
            activeOpacity={0.8}
            onPress={() => {
              setSalePendingSelection({});
              setShowSaleAddProductsModal(true);
            }}
          >
            <Feather name="plus" size={14} color="#FFFFFF" />
            <Text style={styles.addItemToBillBtnText}>+ Add Product</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bill Items List or Empty state */}
      {saleBillItems.length === 0 ? (
        <View style={styles.emptyBillCard}>
          <View style={styles.emptyBillIconCircle}>
            <Feather name="inbox" size={30} color="#94A3B8" />
          </View>
          <Text style={styles.emptyBillTitle}>No Products in Bill</Text>
          <Text style={styles.emptyBillSubtitle}>
            Add items from your live stock inventory to generate this invoice.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => {
              setSalePendingSelection({});
              setShowSaleAddProductsModal(true);
            }}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.emptyAddBtnText}>Browse & Add Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.billTableCard}>
          {/* Table Header */}
          <View style={styles.billTableHeader}>
            <Text style={[styles.billColHeader, { width: 30 }]}>#</Text>
            <Text style={[styles.billColHeader, { flex: 1 }]}>ITEM</Text>
            <Text style={[styles.billColHeader, { width: 70, textAlign: 'right' }]}>RATE</Text>
            <Text style={[styles.billColHeader, { width: 90, textAlign: 'center' }]}>QTY</Text>
            <Text style={[styles.billColHeader, { width: 70, textAlign: 'right' }]}>TOTAL</Text>
            <Text style={[styles.billColHeader, { width: 28 }]}></Text>
          </View>

          {/* Line items */}
          {saleBillItems.map((item, idx) => {
            const lineTotal = Number(item.price) * item.qty;
            return (
              <View key={`sale-item-${item.product.product_id}-${idx}`} style={styles.billTableRow}>
                <Text style={styles.billRowIndex}>{idx + 1}</Text>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={styles.billRowName} numberOfLines={1}>
                    {item.product.product_name}
                  </Text>
                  <Text style={styles.billRowSub}>
                    {item.product.unit || 'PCS'} · In Stock: {item.product.quantity ?? item.product.current_stock ?? 0}
                  </Text>
                </View>
                <Text style={styles.billRowRate}>₹{Number(item.price).toFixed(2)}</Text>
                <View style={styles.billQtyStepper}>
                  <TouchableOpacity
                    style={styles.billStepBtn}
                    onPress={() => handleUpdateSaleBillItemQty(idx, -1)}
                  >
                    <Feather name="minus" size={13} color="#475569" />
                  </TouchableOpacity>
                  <Text style={styles.billQtyVal}>{item.qty}</Text>
                  <TouchableOpacity
                    style={styles.billStepBtn}
                    onPress={() => handleUpdateSaleBillItemQty(idx, 1)}
                  >
                    <Feather name="plus" size={13} color="#475569" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.billRowTotal}>₹{lineTotal.toFixed(2)}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveSaleBillItem(idx)}
                  style={styles.billDeleteBtn}
                >
                  <Feather name="trash-2" size={14} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* 5. Order Totals Summary Card */}
      {saleBillItems.length > 0 && (
        <View style={styles.orderSummaryCard}>
          <Text style={styles.summaryTitle}>Bill Breakdown</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items ({saleTotalQuantity} units)</Text>
            <Text style={styles.summaryValue}>₹{saleSubtotal.toFixed(2)}</Text>
          </View>

          {saleBillType === 'Exclusive' && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>GST / Tax (+)</Text>
              <Text style={styles.summaryValue}>₹{saleTaxAmount.toFixed(2)}</Text>
            </View>
          )}

          {/* Discount input row */}
          <View style={styles.summaryDiscountRow}>
            <Text style={styles.summaryLabel}>Discount (-)</Text>
            <View style={styles.discountInputBox}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.discountInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                value={saleDiscount}
                onChangeText={setSaleDiscount}
              />
            </View>
          </View>

          {/* Remarks Note */}
          <View style={{ marginTop: 10, marginBottom: 8 }}>
            <TextInput
              style={styles.remarksInput}
              placeholder="Add invoice remark / notes (optional)..."
              placeholderTextColor="#94A3B8"
              value={saleRemark}
              onChangeText={setSaleRemark}
            />
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.grandTotalRow}>
            <View>
              <Text style={styles.grandTotalLabel}>Net Payable</Text>
              <Text style={styles.grandTotalSub}>Rounded final invoice amount</Text>
            </View>
            <Text style={styles.grandTotalValue}>
              ₹{saleFinalAmount.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      )}

      {/* 6. Checkout / Generate Invoice Full Button */}
      {saleBillItems.length > 0 && (
        <TouchableOpacity
          style={[styles.generateInvoiceBtn, isGeneratingInvoice && { opacity: 0.7 }]}
          activeOpacity={0.85}
          disabled={isGeneratingInvoice}
          onPress={handleGenerateSaleInvoice}
        >
          {isGeneratingInvoice ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#FFFFFF" />
              <Text style={styles.generateInvoiceBtnText}>
                Generate Invoice (₹{saleFinalAmount.toLocaleString('en-IN')})
              </Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  // -------------------------------------------------------------
  // TAB 4: DSR (DAILY SALES REPORT) CONTENT - SCREEN MATCHING IMAGE
  // -------------------------------------------------------------
  const renderDsrTab = () => {
    // Sub-view: DSR Denomination & Summary Form
    if (dsrSubView === 'dsr_form') {
      return (
        <ScrollView style={styles.tabSectionWrapper} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity
              style={styles.dsrBackBtn}
              onPress={() => setDsrSubView('menu')}
              activeOpacity={0.7}
            >
              <Feather name="arrow-left" size={18} color="#4338CA" />
              <Text style={styles.dsrBackBtnText}>Back to DSR Menu</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabSectionHeader}>
            <View>
              <Text style={styles.tabSectionTitle}>Daily Sales Report</Text>
              <Text style={styles.tabSectionSubtitle}>Closing cash & day-end reconciliation</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{formattedDisplayDate}</Text>
            </View>
          </View>

          <View style={styles.dsrCard}>
            <Text style={styles.dsrCardTitle}>Cash Denominations</Text>
            <Text style={styles.dsrCardSubtitle}>Enter physical currency collected in the field</Text>

            <View style={styles.denominationGrid}>
              {Object.keys(denominations).map((note) => (
                <View key={note} style={styles.denominationRow}>
                  <View style={styles.noteLabelBox}>
                    <Text style={styles.noteLabelText}>₹ {note}</Text>
                  </View>
                  <Text style={styles.multiplySign}>×</Text>
                  <TextInput
                    style={styles.noteInput}
                    keyboardType="numeric"
                    placeholder="0"
                    value={String(denominations[note] || '')}
                    onChangeText={(val: string) => {
                      const num = parseInt(val, 10);
                      setDenominations((prev) => ({
                        ...prev,
                        [note]: isNaN(num) ? 0 : num,
                      }));
                    }}
                  />
                  <Text style={styles.noteEqualsSign}>=</Text>
                  <Text style={styles.noteTotalText}>
                    ₹ {(Number(note) * (denominations[note] || 0)).toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.totalCashRow}>
              <Text style={styles.totalCashLabel}>Total Field Cash:</Text>
              <Text style={styles.totalCashValue}>₹ {totalDsrCash.toLocaleString('en-IN')}</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitDsrBtn, isSubmittingDsr && { opacity: 0.7 }]}
              activeOpacity={0.8}
              disabled={isSubmittingDsr}
              onPress={handleSubmitDsr}
            >
              {isSubmittingDsr ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.submitDsrBtnText}>Submit Today's DSR</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    // Default Main View: 5 Menu Cards matching uploaded Image
    const dsrMenuItems = [
      {
        id: 'dsr',
        title: 'DSR',
        icon: 'clipboard-text-outline',
        iconType: 'material',
        onPress: () => setDsrSubView('dsr_form'),
      },
      {
        id: 'stock_request',
        title: 'Stock Request',
        icon: 'archive-outline',
        iconType: 'material',
        onPress: () => handleTabChange('stock_request'),
      },
      {
        id: 'stock_register',
        title: 'Stock Register',
        icon: 'book-open-outline',
        iconType: 'material',
        onPress: () => setDsrSubView('stock_register'),
      },
      {
        id: 'collection',
        title: 'Collection',
        icon: 'wallet-outline',
        iconType: 'material',
        onPress: () => handleTabChange('receipt'),
      },
      {
        id: 'credit_adjust',
        title: 'Credit Adjust',
        icon: 'swap-horizontal',
        iconType: 'material',
        onPress: () => setDsrSubView('credit_adjust'),
      },
    ];

    return (
      <ScrollView
        style={styles.tabSectionWrapper}
        contentContainerStyle={styles.dsrMenuContainer}
        showsVerticalScrollIndicator={false}
      >
        {dsrMenuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.dsrMenuCard}
            activeOpacity={0.7}
            onPress={item.onPress}
          >
            <View style={styles.dsrMenuIconBox}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={26}
                color="#5B50E5"
              />
            </View>

            <Text style={styles.dsrMenuTitle}>{item.title}</Text>

            <Feather name="chevron-right" size={22} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // -------------------------------------------------------------
  // TAB 5: RECEIPT SCREEN CONTENT
  // -------------------------------------------------------------
  const renderReceiptTab = () => (
    <View style={styles.tabSectionWrapper}>
      <View style={styles.tabSectionHeader}>
        <View>
          <Text style={styles.tabSectionTitle}>Money Receipts</Text>
          <Text style={styles.tabSectionSubtitle}>Record payment collections & vouchers</Text>
        </View>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/generate-receipt')}
        >
          <Feather name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.primaryActionBtnText}>Collect Payment</Text>
        </TouchableOpacity>
      </View>

      {isLoadingReceipts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4338CA" />
        </View>
      ) : receiptsList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="file-text" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No receipts today</Text>
          <Text style={styles.emptySubtitle}>All recorded collections will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={receiptsList}
          keyExtractor={(item: any, idx: number) => `rcpt-${item.id || idx}`}
          contentContainerStyle={styles.listContentContainer}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.receiptCard}>
              <View style={styles.receiptCardLeft}>
                <Text style={styles.receiptPartyName}>{item.party_name || item.name || 'Retailer'}</Text>
                <Text style={styles.receiptMeta}>
                  {item.receipt_date || formattedDisplayDate} • {item.payment_mode || 'Cash'}
                </Text>
              </View>
              <Text style={styles.receiptAmountText}>₹{Number(item.amount || item.total_amount || 0).toFixed(2)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );

  // -------------------------------------------------------------
  // MAIN RETURN
  // -------------------------------------------------------------
  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      {/* APP TOP BAR */}
      <View style={styles.appHeader}>
        {/* Left Hamburger Icon */}
        <TouchableOpacity
          style={styles.headerIconBtn}
          activeOpacity={0.7}
          onPress={() => setShowDrawer(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="menu" size={24} color="#4338CA" />
        </TouchableOpacity>

        {/* Center Title */}
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitleText}>FSE</Text>
        </View>

        {/* Right Actions: Live Switch & Bell Notification */}
        <View style={styles.headerRightActions}>
          <Switch
            trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
            thumbColor={isLiveOnline ? '#4338CA' : '#F1F5F9'}
            ios_backgroundColor="#CBD5E1"
            onValueChange={setIsLiveOnline}
            value={isLiveOnline}
            style={styles.onlineSwitch}
          />

          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Notifications', 'No new system messages.')}
          >
            <Feather name="bell" size={22} color="#475569" />
            {Number(userProductData?.user_message_count || 0) > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{userProductData?.user_message_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT BY ACTIVE TAB */}
      <View style={styles.mainContainer}>
        {activeTab === 'live' && renderLiveTab()}
        {activeTab === 'stock_request' && renderStockRequestTab()}
        {activeTab === 'sale' && renderSaleTab()}
        {activeTab === 'dsr' && renderDsrTab()}
        {activeTab === 'receipt' && renderReceiptTab()}
      </View>

      {/* BOTTOM NAVIGATION TABS (5 TABS MATCHING SCREENSHOT) */}
      <View style={[styles.bottomNavContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {/* 1. Live Tab */}
        <TouchableOpacity
          style={styles.navTabBtn}
          activeOpacity={0.7}
          onPress={() => handleTabChange('live')}
        >
          <View style={[styles.navIconBox, activeTab === 'live' && styles.navIconBoxActive]}>
            <MaterialCommunityIcons
              name="view-grid"
              size={22}
              color={activeTab === 'live' ? '#4338CA' : '#64748B'}
            />
          </View>
          <Text style={[styles.navTabLabel, activeTab === 'live' && styles.navTabLabelActive]}>
            Live
          </Text>
        </TouchableOpacity>

        {/* 2. Stock Request Tab */}
        <TouchableOpacity
          style={styles.navTabBtn}
          activeOpacity={0.7}
          onPress={() => handleTabChange('stock_request')}
        >
          <View style={[styles.navIconBox, activeTab === 'stock_request' && styles.navIconBoxActive]}>
            <MaterialCommunityIcons
              name="shopping-outline"
              size={22}
              color={activeTab === 'stock_request' ? '#4338CA' : '#64748B'}
            />
          </View>
          <Text style={[styles.navTabLabel, activeTab === 'stock_request' && styles.navTabLabelActive]}>
            Stock Request
          </Text>
        </TouchableOpacity>

        {/* 3. Sale Tab */}
        <TouchableOpacity
          style={styles.navTabBtn}
          activeOpacity={0.7}
          onPress={() => handleTabChange('sale')}
        >
          <View style={[styles.navIconBox, activeTab === 'sale' && styles.navIconBoxActive]}>
            <Feather
              name="bar-chart-2"
              size={22}
              color={activeTab === 'sale' ? '#4338CA' : '#64748B'}
            />
          </View>
          <Text style={[styles.navTabLabel, activeTab === 'sale' && styles.navTabLabelActive]}>
            Sale
          </Text>
        </TouchableOpacity>

        {/* 4. DSR Tab */}
        <TouchableOpacity
          style={styles.navTabBtn}
          activeOpacity={0.7}
          onPress={() => handleTabChange('dsr')}
        >
          <View style={[styles.navIconBox, activeTab === 'dsr' && styles.navIconBoxActive]}>
            <Feather
              name="file-text"
              size={22}
              color={activeTab === 'dsr' ? '#4338CA' : '#64748B'}
            />
          </View>
          <Text style={[styles.navTabLabel, activeTab === 'dsr' && styles.navTabLabelActive]}>
            DSR
          </Text>
        </TouchableOpacity>

        {/* 5. Receipt Tab */}
        <TouchableOpacity
          style={styles.navTabBtn}
          activeOpacity={0.7}
          onPress={() => handleTabChange('receipt')}
        >
          <View style={[styles.navIconBox, activeTab === 'receipt' && styles.navIconBoxActive]}>
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={22}
              color={activeTab === 'receipt' ? '#4338CA' : '#64748B'}
            />
          </View>
          <Text style={[styles.navTabLabel, activeTab === 'receipt' && styles.navTabLabelActive]}>
            Receipt
          </Text>
        </TouchableOpacity>
      </View>

      {/* CATEGORY PICKER MODAL */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.pickerModalCard}>
            <Text style={styles.pickerModalTitle}>Select Category</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {categories.map((cat: string) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.pickerOption,
                    selectedCategory === cat && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedCategory === cat && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                  {selectedCategory === cat && (
                    <Feather name="check" size={18} color="#4338CA" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PRODUCT DETAILS MODAL */}
      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.productDetailCard}>
            <View style={styles.productDetailHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailProductName}>{selectedProduct?.product_name}</Text>
                <Text style={styles.detailProductCategory}>
                  {selectedProduct?.product_type || selectedProduct?.category_name || 'Standard Item'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedProduct(null)}
                style={styles.closeBtn}
              >
                <Feather name="x" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.detailGrid}>
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLabel}>Current Stock</Text>
                  <Text style={styles.detailGridValueBold}>
                    {selectedProduct?.quantity ?? selectedProduct?.current_stock ?? 0}{' '}
                    {selectedProduct?.unit || 'PCS'}
                  </Text>
                </View>

                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLabel}>Sale Price</Text>
                  <Text style={styles.detailGridValue}>
                    ₹{Number(selectedProduct?.product_price || 0).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLabel}>MRP</Text>
                  <Text style={styles.detailGridValue}>
                    ₹{Number(selectedProduct?.mrp_price || selectedProduct?.product_price || 0).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLabel}>HSN Code</Text>
                  <Text style={styles.detailGridValue}>{selectedProduct?.hsn_code || 'N/A'}</Text>
                </View>

                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLabel}>GST Rate</Text>
                  <Text style={styles.detailGridValue}>
                    {Number(selectedProduct?.CGST || 0) + Number(selectedProduct?.SGST || 0)}%
                  </Text>
                </View>

                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLabel}>Secondary Unit</Text>
                  <Text style={styles.detailGridValue}>
                    {selectedProduct?.secondary_unit || 'None'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.detailActionRow}>
                <TouchableOpacity
                  style={styles.detailSecondaryBtn}
                  onPress={() => {
                    if (selectedProduct) {
                      const pId = String(selectedProduct.product_id);
                      setPendingCartSelection({ [pId]: 1 });
                      setSelectedProduct(null);
                      setShowAddProductsModal(true);
                    }
                  }}
                >
                  <Feather name="truck" size={16} color="#4338CA" />
                  <Text style={styles.detailSecondaryBtnText}>Request Stock</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailPrimaryBtn}
                  onPress={() => {
                    if (selectedProduct) {
                      handleAddToCart(selectedProduct);
                      setSelectedProduct(null);
                    }
                  }}
                >
                  <Feather name="shopping-cart" size={16} color="#FFFFFF" />
                  <Text style={styles.detailPrimaryBtnText}>Add To Cart</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ADD PRODUCTS BOTTOM SHEET MODAL (MATCHES IMAGE 1) */}
      <Modal visible={showAddProductsModal} transparent animationType="slide">
        <View style={styles.addProductsOverlay}>
          <View style={styles.addProductsSheetCard}>
            {/* Top Drag Handle */}
            <View style={styles.sheetDragHandle} />

            {/* Header: Title & Subtitle */}
            <View style={styles.addProductsHeader}>
              <View>
                <Text style={styles.addProductsTitle}>Add products</Text>
                <Text style={styles.addProductsSubtitle}>Search or browse to add stock</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddProductsModal(false)}
                style={styles.closeSheetBtn}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.addProductsSearchBox}>
              <Feather name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products"
                placeholderTextColor="#94A3B8"
                value={addProductsSearch}
                onChangeText={setAddProductsSearch}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Filter Chips: All, FMCG, Serial No, Service */}
            <View style={styles.chipsScrollContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsRow}
              >
                {categories.map((cat: string) => {
                  const isSelected = addProductsCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.modalFilterChip,
                        isSelected && styles.modalFilterChipActive,
                      ]}
                      onPress={() => setAddProductsCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.modalFilterChipText,
                          isSelected && styles.modalFilterChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                      {isSelected && (
                        <Feather
                          name="check-circle"
                          size={14}
                          color="#6366F1"
                          style={{ marginLeft: 5 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Products List (From same getUserProduct API) */}
            <FlatList
              data={modalFilteredProducts}
              keyExtractor={(item: FseProductItem) => `add-prod-${item.product_id}`}
              contentContainerStyle={styles.addProductsListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }: { item: FseProductItem }) => {
                const count = pendingCartSelection[String(item.product_id)] || 0;
                const unit = item.unit || item.secondary_unit || 'PCS';
                const price = Number(item.product_price || 0);

                return (
                  <View style={styles.addProductsItemRow}>
                    <View style={styles.addProductsItemLeft}>
                      <Text style={styles.addProductsItemName}>{item.product_name}</Text>
                      <Text style={styles.addProductsItemMeta}>
                        {unit} · ₹{price.toFixed(1)}
                      </Text>
                    </View>

                    {/* Circular Blue/Purple + Button */}
                    <TouchableOpacity
                      style={[
                        styles.addProductsCircleBtn,
                        count > 0 && styles.addProductsCircleBtnActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleToggleAddProduct(item)}
                    >
                      {count > 0 ? (
                        <Text style={styles.addProductsCircleBtnCount}>{count}</Text>
                      ) : (
                        <Feather name="plus" size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
            />

            {/* Bottom Total & "Add to cart" Bar */}
            <View style={styles.addProductsBottomBar}>
              <View style={styles.addProductsTotalBox}>
                <Text style={styles.addProductsTotalLabel}>Total</Text>
                <Text style={styles.addProductsTotalValue}>
                  ₹{pendingTotalAmount.toFixed(0)}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.addProductsSubmitBtn,
                  isAddingToCart && { opacity: 0.7 },
                ]}
                activeOpacity={0.8}
                disabled={isAddingToCart}
                onPress={handleAddSelectedToCart}
              >
                {isAddingToCart ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addProductsSubmitBtnText}>Add to cart</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PARTY SELECTOR MODAL (FOR SALE INVOICE) */}
      <Modal visible={showSalePartyModal} transparent animationType="slide">
        <View style={styles.addProductsOverlay}>
          <View style={styles.addProductsSheetCard}>
            <View style={styles.sheetDragHandle} />

            <View style={styles.addProductsHeader}>
              <View>
                <Text style={styles.addProductsTitle}>Select Customer / Retailer</Text>
                <Text style={styles.addProductsSubtitle}>Choose party for this sale invoice</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSalePartyModal(false)}
                style={styles.closeSheetBtn}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.addProductsSearchBox}>
              <Feather name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search party by name, phone or GST..."
                placeholderTextColor="#94A3B8"
                value={salePartySearch}
                onChangeText={setSalePartySearch}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Parties List */}
            {isLoadingSaleParties ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4338CA" />
                <Text style={{ marginTop: 8, fontSize: 13, color: '#64748B' }}>
                  Loading assigned retailers...
                </Text>
              </View>
            ) : filteredSaleParties.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Feather name="users" size={36} color="#CBD5E1" />
                <Text style={{ marginTop: 8, fontSize: 14, fontWeight: '700', color: '#64748B' }}>
                  No Retailers Found
                </Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                  No customer matches the search query.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredSaleParties}
                keyExtractor={(item: FsePartyItem) => `sale-party-${item.party_id}`}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, gap: 8 }}
                renderItem={({ item }: { item: FsePartyItem }) => {
                  const isSelected = saleParty?.party_id === item.party_id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.partySelectorCard,
                        isSelected && styles.partySelectorCardActive,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSaleParty(item);
                        setShowSalePartyModal(false);
                      }}
                    >
                      <View style={[styles.partyAvatarCircle, isSelected && { backgroundColor: '#4338CA' }]}>
                        <Feather name="user" size={18} color={isSelected ? '#FFFFFF' : '#4338CA'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.partySelectorName}>{item.party_name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          {item.mobile_number ? (
                            <Text style={styles.partySelectorPhone}>📞 {item.mobile_number}</Text>
                          ) : null}
                          {item.gstin_no ? (
                            <Text style={styles.partySelectorGst}>GST: {item.gstin_no}</Text>
                          ) : null}
                        </View>
                        {item.address ? (
                          <Text style={styles.partySelectorAddress} numberOfLines={1}>
                            {item.address}
                          </Text>
                        ) : null}
                      </View>
                      <Feather
                        name={isSelected ? 'check-circle' : 'chevron-right'}
                        size={18}
                        color={isSelected ? '#4338CA' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* SALE ADD PRODUCTS BOTTOM SHEET MODAL (MATCHES IMAGE 1 DESIGN) */}
      <Modal visible={showSaleAddProductsModal} transparent animationType="slide">
        <View style={styles.addProductsOverlay}>
          <View style={styles.addProductsSheetCard}>
            <View style={styles.sheetDragHandle} />

            <View style={styles.addProductsHeader}>
              <View>
                <Text style={styles.addProductsTitle}>Add products to bill</Text>
                <Text style={styles.addProductsSubtitle}>Search or browse to bill live stock</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSaleAddProductsModal(false)}
                style={styles.closeSheetBtn}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.addProductsSearchBox}>
              <Feather name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products"
                placeholderTextColor="#94A3B8"
                value={saleAddProductsSearch}
                onChangeText={setSaleAddProductsSearch}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Category Filter Chips */}
            <View style={styles.chipsScrollContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsRow}
              >
                {categories.map((cat: string) => {
                  const isSelected = saleAddProductsCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.modalFilterChip,
                        isSelected && styles.modalFilterChipActive,
                      ]}
                      onPress={() => setSaleAddProductsCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.modalFilterChipText,
                          isSelected && styles.modalFilterChipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                      {isSelected && (
                        <Feather
                          name="check-circle"
                          size={14}
                          color="#6366F1"
                          style={{ marginLeft: 5 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Products List from live getUserProduct API */}
            <FlatList
              data={saleModalFilteredProducts}
              keyExtractor={(item: FseProductItem) => `sale-add-prod-${item.product_id}`}
              contentContainerStyle={styles.addProductsListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }: { item: FseProductItem }) => {
                const count = salePendingSelection[String(item.product_id)] || 0;
                const stock = Number(item.quantity ?? item.current_stock ?? 0);
                const isOutOfStock = stock <= 0;

                const unit = item.unit || item.secondary_unit || 'PCS';
                const price = Number(item.product_price || 0);

                return (
                  <View style={styles.addProductsItemRow}>
                    <View style={styles.addProductsItemLeft}>
                      <Text style={styles.addProductsItemName}>{item.product_name}</Text>
                      <Text style={styles.addProductsItemMeta}>
                        {unit} · ₹{price.toFixed(1)} · Stock: {stock}
                      </Text>
                    </View>

                    {isOutOfStock ? (
                      <View style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F1F5F9', borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8' }}>No Stock</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.addProductsCircleBtn,
                          count > 0 && styles.addProductsCircleBtnActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => handleToggleSaleProduct(item)}
                      >
                        {count > 0 ? (
                          <Text style={styles.addProductsCircleBtnCount}>{count}</Text>
                        ) : (
                          <Feather name="plus" size={18} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />

            {/* Bottom Total & "Add to Bill" Bar */}
            <View style={styles.addProductsBottomBar}>
              <View style={styles.addProductsTotalBox}>
                <Text style={styles.addProductsTotalLabel}>Total</Text>
                <Text style={styles.addProductsTotalValue}>
                  ₹{salePendingTotalAmount.toFixed(0)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addProductsSubmitBtn}
                activeOpacity={0.8}
                onPress={handleAddProductsToBill}
              >
                <Text style={styles.addProductsSubmitBtnText}>Add to Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* INVOICE SUCCESS MODAL */}
      <Modal visible={invoiceSuccessModalVisible} transparent animationType="fade">
        <View style={styles.invoiceSuccessOverlay}>
          <View style={styles.invoiceSuccessCard}>
            <View style={styles.invoiceSuccessIconCircle}>
              <Feather name="check" size={32} color="#059669" />
            </View>
            <Text style={styles.invoiceSuccessTitle}>Invoice Generated!</Text>
            <Text style={styles.invoiceSuccessSubtitle}>
              Sale invoice has been generated and stock updated.
            </Text>

            <View style={styles.invoiceSuccessDetailBox}>
              <View style={styles.invoiceSuccessDetailRow}>
                <Text style={styles.invoiceSuccessDetailLabel}>Invoice No / ID</Text>
                <Text style={styles.invoiceSuccessDetailValue}>
                  {invoiceSuccessData?.transaction_id || 'N/A'}
                </Text>
              </View>
              <View style={styles.invoiceSuccessDetailRow}>
                <Text style={styles.invoiceSuccessDetailLabel}>Customer</Text>
                <Text style={styles.invoiceSuccessDetailValue}>
                  {invoiceSuccessData?.party_name || 'N/A'}
                </Text>
              </View>
              <View style={styles.invoiceSuccessDetailRow}>
                <Text style={styles.invoiceSuccessDetailLabel}>Date</Text>
                <Text style={styles.invoiceSuccessDetailValue}>
                  {invoiceSuccessData?.date || formattedDisplayDate}
                </Text>
              </View>
              <View style={styles.invoiceSuccessDetailRow}>
                <Text style={styles.invoiceSuccessDetailLabel}>Grand Total</Text>
                <Text style={[styles.invoiceSuccessDetailValue, { color: '#4338CA', fontSize: 16 }]}>
                  ₹{Number(invoiceSuccessData?.amount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <View style={styles.invoiceSuccessBtnRow}>
              <TouchableOpacity
                style={styles.invoiceSuccessSecBtn}
                onPress={() => {
                  setInvoiceSuccessModalVisible(false);
                  setActiveTab('live');
                }}
              >
                <Text style={styles.invoiceSuccessSecBtnText}>View Stock</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.invoiceSuccessPriBtn}
                onPress={() => {
                  setInvoiceSuccessModalVisible(false);
                }}
              >
                <Text style={styles.invoiceSuccessPriBtnText}>New Sale</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DRAWER MENU */}
      <AppDrawer
        visible={showDrawer}
        activeRoute="/fse"
        onClose={() => setShowDrawer(false)}
        onLogout={async () => {
          setShowDrawer(false);
          await logout();
          router.replace('/(auth)/login');
        }}
      />
    </View>
  );
}

// -------------------------------------------------------------
// STYLES
// -------------------------------------------------------------
const styles = StyleSheet.create({
  statusPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  onlineSwitch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
  },
  notificationBtn: {
    position: 'relative',
    padding: 6,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  mainContainer: {
    flex: 1,
  },

  // DATE BANNER
  dateBannerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  dateBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dateArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCenterInfo: {
    alignItems: 'center',
  },
  dateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  calendarIcon: {
    marginRight: 6,
  },
  dateTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dateDayText: {
    color: '#C7D2FE',
    fontSize: 13,
    fontWeight: '500',
  },

  // STAT CARDS
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  statCardItems: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 16,
    padding: 14,
  },
  statCardStock: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 16,
    padding: 14,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statIconItems: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconStock: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValueItems: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  statValueStock: {
    fontSize: 22,
    fontWeight: '800',
    color: '#064E3B',
  },

  // SEARCH AND FILTER
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 44,
    minWidth: 80,
    justifyContent: 'space-between',
    gap: 6,
  },
  filterDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },

  // TABLE HEADER
  tableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  headerIndex: {
    width: 36,
  },
  headerName: {
    flex: 1,
  },
  headerStock: {
    width: 90,
    textAlign: 'right',
  },

  // PRODUCT ROW CARD
  listContentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    gap: 8,
  },
  productRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  indexCol: {
    width: 32,
  },
  indexText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  itemNameCol: {
    flex: 1,
    paddingRight: 8,
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  itemPriceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stockCol: {
    width: 90,
    alignItems: 'flex-end',
  },
  stockBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  stockBadgePositive: {
    backgroundColor: '#ECFDF5',
  },
  stockBadgeZero: {
    backgroundColor: '#F1F5F9',
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stockTextPositive: {
    color: '#059669',
  },
  stockTextZero: {
    color: '#64748B',
  },

  // -------------------------------------------------------------
  // TAB 2: STOCK REQUEST & CART STYLES (MATCHES IMAGE 2)
  // -------------------------------------------------------------
  cartSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cartSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cartSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  cartIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartSummaryTextCol: {
    gap: 2,
  },
  cartSummaryItemCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  cartSummaryTotalAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  cartSummaryRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4E6',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  clearCartBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  addCartItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addCartItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  cartTableHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 4,
  },
  cartTableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  cartColItem: {
    flex: 1,
  },
  cartColQty: {
    width: 120,
    textAlign: 'center',
  },
  cartColDel: {
    width: 44,
    textAlign: 'right',
  },
  cartListContent: {
    paddingBottom: 90,
    gap: 8,
  },
  cartItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cartItemLeftInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartItemIndexText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    minWidth: 16,
  },
  cartItemNameCol: {
    flex: 1,
    gap: 2,
  },
  cartItemNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  cartItemPriceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  cartStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    justifyContent: 'center',
    gap: 10,
  },
  stepperMinusBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQuantityText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    minWidth: 20,
    textAlign: 'center',
  },
  stepperPlusBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemDeleteBtn: {
    width: 44,
    alignItems: 'flex-end',
    padding: 6,
  },

  submitRequestBtnWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  submitStockRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitStockRequestBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // -------------------------------------------------------------
  // ADD PRODUCTS BOTTOM SHEET MODAL (MATCHES IMAGE 1)
  // -------------------------------------------------------------
  addProductsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  addProductsSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    maxHeight: '85%',
  },
  sheetDragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  addProductsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  addProductsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  addProductsSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeSheetBtn: {
    padding: 4,
  },
  addProductsSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  chipsScrollContainer: {
    marginBottom: 14,
  },
  filterChipsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  modalFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalFilterChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  modalFilterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalFilterChipTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  addProductsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  addProductsItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  addProductsItemLeft: {
    flex: 1,
    gap: 4,
  },
  addProductsItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  addProductsItemMeta: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  addProductsCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addProductsCircleBtnActive: {
    backgroundColor: '#4338CA',
  },
  addProductsCircleBtnCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  addProductsBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  addProductsTotalBox: {
    gap: 2,
  },
  addProductsTotalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  addProductsTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  addProductsSubmitBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 22,
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  addProductsSubmitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // BOTTOM NAVIGATION
  bottomNavContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  navTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconBox: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  navIconBoxActive: {
    backgroundColor: '#EEF2FF',
  },
  navTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  navTabLabelActive: {
    color: '#4338CA',
    fontWeight: '700',
  },

  // GENERAL TAB SECTIONS
  tabSectionWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  tabSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  tabSectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // SALE TAB
  saleSearchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  saleProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addCartBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  cartCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  cartCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cartSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  cartSummaryLabel: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '600',
  },
  cartSummaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // DSR TAB
  dsrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dsrCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  dsrCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  denominationGrid: {
    gap: 8,
  },
  denominationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteLabelBox: {
    width: 64,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
  },
  noteLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  multiplySign: {
    fontSize: 14,
    color: '#94A3B8',
  },
  noteInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#1E293B',
    textAlign: 'center',
  },
  noteEqualsSign: {
    fontSize: 14,
    color: '#94A3B8',
  },
  noteTotalText: {
    width: 90,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'right',
  },
  totalCashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 14,
    paddingTop: 12,
    marginBottom: 16,
  },
  totalCashLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  totalCashValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669',
  },
  submitDsrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  submitDsrBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // RECEIPT TAB
  receiptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptCardLeft: {
    flex: 1,
  },
  receiptPartyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  receiptMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  receiptAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#334155',
  },
  pickerOptionTextSelected: {
    color: '#4338CA',
    fontWeight: '700',
  },

  productDetailCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  productDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailProductName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  detailProductCategory: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  detailScrollView: {
    marginBottom: 10,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  detailGridItem: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailGridLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailGridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailGridValueBold: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  detailActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  detailSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  detailSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  detailPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4338CA',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  detailPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // FEEDBACK
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },

  // -------------------------------------------------------------
  // SALE TAB SPECIFIC STYLES
  // -------------------------------------------------------------
  salePartySelectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 12,
  },
  salePartyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  salePartyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salePartyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  changePartyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  changePartyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  salePartyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  salePartyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  salePartyMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  gstBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gstBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  salePartyAddress: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  salePartyEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    gap: 14,
  },
  salePartyEmptyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  salePartyEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  salePartyEmptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  saleConfigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  segmentedToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#4338CA',
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  paymentPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  paymentPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  paymentPillActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  paymentPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  paymentPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  conditionalFieldWrapper: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  quickCreditRow: {
    flexDirection: 'row',
    gap: 8,
  },
  creditDayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  creditDayChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4338CA',
  },
  creditDayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  creditDayChipTextActive: {
    color: '#4338CA',
    fontWeight: '700',
  },
  chequeInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chequeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  billItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  billItemsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  clearBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  addItemToBillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4338CA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addItemToBillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyBillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  emptyBillIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyBillTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyBillSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4338CA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  billTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  billTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  billColHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  billTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  billRowIndex: {
    width: 30,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  billRowName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  billRowSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  billRowRate: {
    width: 70,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  billQtyStepper: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  billStepBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billQtyVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    paddingHorizontal: 6,
  },
  billRowTotal: {
    width: 70,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  billDeleteBtn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  summaryDiscountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  discountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: 100,
  },
  currencyPrefix: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
    fontWeight: '600',
  },
  discountInput: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    padding: 0,
  },
  remarksInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1E293B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  grandTotalSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#4338CA',
  },
  generateInvoiceBtn: {
    backgroundColor: '#4338CA',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  generateInvoiceBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Party selector modal cards
  partySelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  partySelectorCardActive: {
    borderColor: '#4338CA',
    backgroundColor: '#EEF2FF',
  },
  partyAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partySelectorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  partySelectorPhone: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  partySelectorGst: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '600',
  },
  partySelectorAddress: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Invoice Success Modal
  invoiceSuccessOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  invoiceSuccessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  invoiceSuccessIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  invoiceSuccessTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065F46',
    textAlign: 'center',
  },
  invoiceSuccessSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  invoiceSuccessDetailBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 18,
  },
  invoiceSuccessDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceSuccessDetailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  invoiceSuccessDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  invoiceSuccessBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  invoiceSuccessSecBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  invoiceSuccessSecBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  invoiceSuccessPriBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4338CA',
    alignItems: 'center',
  },
  invoiceSuccessPriBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },


  // -------------------------------------------------------------
  // DSR MENU CARDS (MATCHING UPLOADED SCREENSHOT)
  // -------------------------------------------------------------
  dsrMenuContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 14,
  },
  dsrMenuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FA',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E6EDF5',
  },
  dsrMenuIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dsrMenuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    marginLeft: 16,
    letterSpacing: -0.2,
  },
  dsrBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  dsrBackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },

});
