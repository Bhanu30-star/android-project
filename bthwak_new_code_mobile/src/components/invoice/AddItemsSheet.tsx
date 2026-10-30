/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  invoiceService,
  ApiProductItem,
  AddToCartItemPayload,
  BagDetail,
  FreeSchemeProduct,
  CartLineItem,
} from '@/api/invoiceService';
import {
  BillType,
  DiscountType,
  formatIndianCurrency,
  calculateLineItem,
} from '@/features/invoice/calc';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { Colors, Shadows } from '@/theme/tokens';

interface AddItemsSheetProps {
  visible: boolean;
  onClose: () => void;
  cartBillType: BillType;
  onBillTypeChange: (billType: BillType) => void;
  onCartUpdated: () => void;
  searchSource?: string;
  hasExistingCartItems?: boolean;
  onClearCart?: () => void;
  cartLines?: CartLineItem[];
}

interface ItemFormState {
  qtyStr: string;
  priceStr: string;
  discountStr: string;
  price: number;
  mrp: number;
  priceType: 'Retailer' | 'Dealer';
  discountType: DiscountType;
  freeScheme: 'Yes' | 'No';
  freeSchemeProduct: number;
  crateQtyStr: string;
  bottleQtyStr: string;
  bagVal: number;
  selectedSerials: string[];
  imeiText: string;
}

export const AddItemsSheet: React.FC<AddItemsSheetProps> = ({
  visible,
  onClose,
  cartBillType,
  onBillTypeChange,
  onCartUpdated,
  searchSource = 'admin',
  hasExistingCartItems = false,
  onClearCart,
  cartLines = [],
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formStates, setFormStates] = useState<{ [productId: number]: ItemFormState }>({});
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Quantity already in cart per product ID and Name
  const cartQtyMap = useMemo(() => {
    const map: { [key: string]: number } = {};
    for (const line of cartLines) {
      const rawQty = (line as any).quantity ?? (line as any).qty ?? 0;
      const numQty =
        typeof rawQty === 'number'
          ? rawQty
          : parseFloat(String(rawQty).replace(/[^0-9.]/g, '')) || 0;

      if (line.product_id) {
        const idKey = `id_${line.product_id}`;
        map[idKey] = (map[idKey] || 0) + numQty;
      }
      const pName = (line.product_name || (line as any).item || '').trim().toLowerCase();
      if (pName) {
        const nameKey = `name_${pName}`;
        map[nameKey] = (map[nameKey] || 0) + numQty;
      }
    }
    return map;
  }, [cartLines]);

  const getProductInCartQty = (p: ApiProductItem): number => {
    const fromId = cartQtyMap[`id_${p.product_id}`] || 0;
    const nameKey = (p.product_name || '').trim().toLowerCase();
    const fromName = cartQtyMap[`name_${nameKey}`] || 0;
    return Math.max(fromId, fromName);
  };

  const isStockMaintained = (p: ApiProductItem): boolean => {
    return p.maintain_inventory === 'Yes';
  };

  // Barcode scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanningProductId, setScanningProductId] = useState<number | null>(null);

  // Fetch products catalog
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['invoice-product-catalog', search, searchSource],
    queryFn: ({ pageParam = 0 }) =>
      invoiceService.fetchProductCatalog(search, pageParam, searchSource),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.lastId : undefined),
    enabled: visible,
  });

  // Fetch free scheme products
  const { data: freeSchemeProducts = [] } = useQuery<FreeSchemeProduct[]>({
    queryKey: ['free-scheme-products'],
    queryFn: () => invoiceService.fetchFreeSchemeProducts(),
    enabled: visible,
  });

  const products: ApiProductItem[] = useMemo(
    () => data?.pages.flatMap((page) => page.products) || [],
    [data]
  );

  // Reset or clear on close
  useEffect(() => {
    if (!visible) {
      setSearch('');
      setExpandedId(null);
    }
  }, [visible]);

  // Recalculate price when cartBillType changes for all initialized products
  useEffect(() => {
    setFormStates((prev) => {
      const next = { ...prev };
      for (const idStr of Object.keys(next)) {
        const id = Number(idStr);
        const p = products.find((prod) => prod.product_id === id);
        if (!p) continue;
        const s = next[id];
        if (s.priceType === 'Retailer') {
          const bagUnit = s.bagVal > 0 ? s.bagVal : 1;
          const bag = p.bagjson_detail?.find((b) => b.total_unit === bagUnit);
          const newPrice =
            cartBillType === 'Exclusive'
              ? p.product_price_exc
              : bag?.sale_price ?? p.product_price_inc;
          next[id] = {
            ...s,
            price: newPrice,
            priceStr: String(newPrice),
          };
        }
      }
      return next;
    });
  }, [cartBillType, products]);

  const getItemState = (p: ApiProductItem): ItemFormState => {
    if (formStates[p.product_id]) {
      return formStates[p.product_id];
    }
    const defaultPrice =
      cartBillType === 'Exclusive'
        ? p.product_price_exc
        : p.product_price_inc || p.mrp_price;

    return {
      qtyStr: '0',
      priceStr: String(defaultPrice),
      discountStr: '0',
      price: defaultPrice,
      mrp: p.mrp_price,
      priceType: 'Retailer',
      discountType: 'Amount',
      freeScheme: 'No',
      freeSchemeProduct: 0,
      crateQtyStr: '0',
      bottleQtyStr: '0',
      bagVal: 0,
      selectedSerials: [],
      imeiText: '',
    };
  };

  const updateItemState = (
    productId: number,
    patch: Partial<ItemFormState>,
    product: ApiProductItem
  ) => {
    setFormStates((prev) => {
      const current = prev[productId] || getItemState(product);
      const updated = { ...current, ...patch };

      // Price auto-switch if priceType changes
      if (patch.priceType !== undefined) {
        const bagUnit = updated.bagVal > 0 ? updated.bagVal : 1;
        if (patch.priceType === 'Dealer') {
          const dealerPrice = (product.product_dealer_price || current.price) * bagUnit;
          updated.price = dealerPrice;
          updated.priceStr = String(dealerPrice);
        } else {
          const bag = product.bagjson_detail?.find((b) => b.total_unit === bagUnit);
          const retPrice =
            cartBillType === 'Exclusive'
              ? product.product_price_exc
              : bag?.sale_price ?? product.product_price_inc;
          updated.price = retPrice;
          updated.priceStr = String(retPrice);
        }
      }

      // If bagVal changes
      if (patch.bagVal !== undefined) {
        const bagUnit = patch.bagVal > 0 ? patch.bagVal : 1;
        const bag = product.bagjson_detail?.find((b) => b.total_unit === bagUnit);
        if (updated.priceType === 'Dealer') {
          const dealerPrice = (product.product_dealer_price || current.price) * bagUnit;
          updated.price = dealerPrice;
          updated.priceStr = String(dealerPrice);
        } else {
          const retPrice =
            cartBillType === 'Exclusive'
              ? product.product_price_exc
              : bag?.sale_price ?? product.product_price_inc;
          updated.price = retPrice;
          updated.priceStr = String(retPrice);
        }
      }

      return { ...prev, [productId]: updated };
    });
  };

  // Toggle selection
  const toggleSelect = (productId: number, product: ApiProductItem) => {
    const inCart = getProductInCartQty(product);
    const maintainsStock = isStockMaintained(product);
    const availableStock = maintainsStock
      ? Math.max(0, product.new_quantity - inCart)
      : Infinity;

    if (maintainsStock && availableStock <= 0) {
      Alert.alert(
        'Out of Stock',
        inCart > 0
          ? `All ${inCart} ${product.unit || 'PCS'} of this product are already in your billing cart.`
          : 'This product is currently out of stock in warehouse inventory.'
      );
      return;
    }

    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    } else {
      setSelectedProductIds((prev) => [...prev, productId]);
      const current = getItemState(product);
      if (parseFloat(current.qtyStr) === 0) {
        updateItemState(productId, { qtyStr: '1' }, product);
      }
      setExpandedId(productId);
    }
  };

  // Quantity Stepper
  const handleStepperChange = (product: ApiProductItem, delta: number) => {
    const current = getItemState(product);
    const currentQty = parseFloat(current.qtyStr) || 0;
    const newQty = Math.max(0, currentQty + delta);

    const inCart = getProductInCartQty(product);
    const maintainsStock = isStockMaintained(product);
    const availableStock = maintainsStock
      ? Math.max(0, product.new_quantity - inCart)
      : Infinity;

    const bagUnit = current.bagVal > 0 ? current.bagVal : 1;
    const maxAllowed = maintainsStock
      ? Math.floor(availableStock / bagUnit)
      : Infinity;

    if (maintainsStock && newQty > maxAllowed) {
      Alert.alert(
        'Stock Limit Reached',
        `Available stock is ${availableStock} ${product.unit || 'PCS'}${
          inCart > 0 ? ` (${inCart} already in cart)` : ''
        }. You cannot add more than ${maxAllowed}.`
      );
      updateItemState(product.product_id, { qtyStr: String(maxAllowed) }, product);
      return;
    }

    updateItemState(product.product_id, { qtyStr: String(newQty) }, product);

    if (newQty > 0 && !selectedProductIds.includes(product.product_id)) {
      setSelectedProductIds((prev) => [...prev, product.product_id]);
    } else if (newQty === 0 && selectedProductIds.includes(product.product_id)) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== product.product_id));
    }
  };

  // Commit typed Quantity
  const handleCommitQty = (product: ApiProductItem) => {
    const s = getItemState(product);
    let val = parseFloat(s.qtyStr);

    if (isNaN(val) || val < 0) {
      val = 0;
    }

    // Check decimal allowed
    if (product.decimal_allow !== 'Yes') {
      val = Math.floor(val);
    }

    const inCart = getProductInCartQty(product);
    const maintainsStock = isStockMaintained(product);
    const availableStock = maintainsStock
      ? Math.max(0, product.new_quantity - inCart)
      : Infinity;

    const bagUnit = s.bagVal > 0 ? s.bagVal : 1;
    const maxAllowed = maintainsStock
      ? Math.floor(availableStock / bagUnit)
      : Infinity;

    if (maintainsStock && val > maxAllowed) {
      Alert.alert(
        'Stock Limit Reached',
        `Quantity exceeds available stock (${availableStock} ${product.unit || 'PCS'}). Adjusted to ${maxAllowed}.`
      );
      val = maxAllowed;
    }

    updateItemState(product.product_id, { qtyStr: String(val) }, product);

    if (val > 0 && !selectedProductIds.includes(product.product_id)) {
      setSelectedProductIds((prev) => [...prev, product.product_id]);
    } else if (val === 0 && selectedProductIds.includes(product.product_id)) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== product.product_id));
    }
  };

  // Commit typed Price
  const handleCommitPrice = (product: ApiProductItem) => {
    const s = getItemState(product);
    let val = parseFloat(s.priceStr);
    if (isNaN(val) || val < 0) {
      val = s.price;
    }
    val = Number(val.toFixed(2));
    updateItemState(product.product_id, { price: val, priceStr: String(val) }, product);
  };

  // Commit typed Discount
  const handleCommitDiscount = (product: ApiProductItem) => {
    const s = getItemState(product);
    let val = parseFloat(s.discountStr);
    if (isNaN(val) || val < 0) {
      val = 0;
    }
    const currentPrice = s.price;
    const currentQty = parseFloat(s.qtyStr) || 0;
    const lineGross = currentPrice * currentQty;

    if (s.discountType === 'Percent' && val > 100) {
      Alert.alert('Validation', 'Discount percentage cannot exceed 100%');
      val = 100;
    } else if (s.discountType === 'Amount' && val > lineGross && lineGross > 0) {
      Alert.alert('Validation', `Discount cannot exceed line amount (₹${lineGross.toFixed(2)})`);
      val = lineGross;
    }

    val = Number(val.toFixed(2));
    updateItemState(product.product_id, { discountStr: String(val) }, product);
  };

  // Handle Barcode Scan Result
  const handleBarcodeScanned = (code: string) => {
    if (!scanningProductId) {
      setSearch(code);
      return;
    }
    const p = products.find((prod) => prod.product_id === scanningProductId);
    if (!p) return;

    const s = getItemState(p);
    const existingList = [...s.selectedSerials];
    if (!existingList.includes(code)) {
      existingList.push(code);
      const newText = existingList.join('\n');
      updateItemState(
        p.product_id,
        {
          selectedSerials: existingList,
          imeiText: newText,
          qtyStr: String(existingList.length),
        },
        p
      );
      if (!selectedProductIds.includes(p.product_id)) {
        setSelectedProductIds((prev) => [...prev, p.product_id]);
      }
    }
  };

  // Handle Serial TextArea change
  const handleImeiTextChange = (text: string, p: ApiProductItem) => {
    const list = text
      .split(/[\n,]/)
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

    updateItemState(
      p.product_id,
      {
        imeiText: text,
        selectedSerials: list,
        qtyStr: String(list.length),
      },
      p
    );
    if (list.length > 0 && !selectedProductIds.includes(p.product_id)) {
      setSelectedProductIds((prev) => [...prev, p.product_id]);
    } else if (list.length === 0 && selectedProductIds.includes(p.product_id)) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== p.product_id));
    }
  };

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (payload: AddToCartItemPayload[]) =>
      invoiceService.addProductsToCart(payload, searchSource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-cart'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-product-catalog'] });
      onCartUpdated();
      onClose();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add items to cart');
    },
  });

  const getFormattedPayloadItem = (
    p: ApiProductItem
  ): AddToCartItemPayload | null => {
    const s = getItemState(p);
    const finalQty =
      p.product_type === 'Serial No' && s.selectedSerials.length > 0
        ? s.selectedSerials.length
        : parseFloat(s.qtyStr) || 0;

    if (finalQty <= 0 && p.product_type !== 'Serial No') {
      Alert.alert('Validation', `${p.product_name}: Quantity must be greater than 0`);
      return null;
    }
    if (s.price <= 0) {
      Alert.alert('Validation', `${p.product_name}: Price must be greater than 0`);
      return null;
    }
    if (s.freeScheme === 'Yes' && !s.freeSchemeProduct) {
      Alert.alert('Validation', `${p.product_name}: Please select free scheme product`);
      return null;
    }

    return {
      product_id: p.product_id,
      quantity: finalQty,
      price: s.price,
      disc_type: s.discountType,
      discount: parseFloat(s.discountStr) || 0,
      bill_type: cartBillType,
      dis_ser_config: 'Standard',
      bag_val: s.bagVal,
      free_qty: 0,
      free_scheme: s.freeScheme,
      free_scheme_product: s.freeSchemeProduct,
      crate_val: parseFloat(s.crateQtyStr) || 0,
      bottle_val: parseFloat(s.bottleQtyStr) || 0,
      price_mrpval: s.mrp,
      imei_list: s.selectedSerials,
    };
  };

  const handleSingleAdd = (p: ApiProductItem) => {
    const item = getFormattedPayloadItem(p);
    if (item) {
      addToCartMutation.mutate([item]);
    }
  };

  const handleSubmitSelected = () => {
    if (selectedProductIds.length === 0) {
      Alert.alert('Selection', 'Please select at least one item');
      return;
    }

    const payloadList: AddToCartItemPayload[] = [];
    for (const id of selectedProductIds) {
      const p = products.find((prod) => prod.product_id === id);
      if (!p) continue;
      const item = getFormattedPayloadItem(p);
      if (!item) return; // validation stopped
      payloadList.push(item);
    }

    addToCartMutation.mutate(payloadList);
  };

  const selectedCount = selectedProductIds.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          {/* Sheet Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add items</Text>
              <Text style={styles.subtitle}>Select products to add to cart</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Global Cart Bill Type Segmented Control (Inclusive | Exclusive) */}
          <View style={styles.taxPrefContainer}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.taxPrefLabel}>Tax preference</Text>
              <Text style={styles.taxPrefSub}>
                {hasExistingCartItems
                  ? `Locked to ${cartBillType} (Clear cart to change)`
                  : 'Applies to all products'}
              </Text>
            </View>
            <View style={styles.taxPrefSegments}>
              {(['Inclusive', 'Exclusive'] as const).map((billType) => {
                const isActive = cartBillType === billType;
                const isLocked = hasExistingCartItems && !isActive;
                return (
                  <TouchableOpacity
                    key={billType}
                    style={[
                      styles.taxPrefBtn,
                      isActive && styles.taxPrefBtnActive,
                      isLocked && styles.taxPrefBtnDisabled,
                    ]}
                    onPress={() => {
                      if (hasExistingCartItems && !isActive) {
                        Alert.alert(
                          'Tax Preference Locked',
                          `All items in the cart are currently ${cartBillType}. Clear the cart to switch to ${billType}.`,
                          [
                            { text: 'OK' },
                            ...(onClearCart
                              ? [
                                  {
                                    text: 'Clear Cart Now',
                                    style: 'destructive' as const,
                                    onPress: onClearCart,
                                  },
                                ]
                              : []),
                          ]
                        );
                        return;
                      }
                      onBillTypeChange(billType);
                    }}
                    activeOpacity={0.8}
                  >
                    {isActive && hasExistingCartItems && (
                      <Feather name="lock" size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                    )}
                    <Text
                      style={[
                        styles.taxPrefBtnText,
                        isActive && styles.taxPrefBtnTextActive,
                        isLocked && styles.taxPrefBtnTextDisabled,
                      ]}
                    >
                      {billType}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Search Bar with Camera Barcode Scan */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products by name or code..."
              placeholderTextColor={Colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                setScanningProductId(null);
                setScannerOpen(true);
              }}
              style={styles.searchScanBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="camera" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Catalog List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => String(item.product_id)}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.4}
              renderItem={({ item }) => {
                const isSelected = selectedProductIds.includes(item.product_id);
                const isExpanded = expandedId === item.product_id;
                const state = getItemState(item);
                const inCartQty = getProductInCartQty(item);
                const maintainsStock = isStockMaintained(item);
                const availableStock = maintainsStock
                  ? Math.max(0, item.new_quantity - inCartQty)
                  : Infinity;
                const bagUnit = state.bagVal > 0 ? state.bagVal : 1;

                // Live calculation for preview
                const currentQty =
                  item.product_type === 'Serial No' && state.selectedSerials.length > 0
                    ? state.selectedSerials.length
                    : parseFloat(state.qtyStr) || 0;
                const currentDiscVal = parseFloat(state.discountStr) || 0;

                const remainingStock = maintainsStock
                  ? Math.max(0, availableStock - currentQty * bagUnit)
                  : Infinity;

                const isOutOfStock = maintainsStock && availableStock <= 0;
                const isLowStock = maintainsStock && availableStock > 0 && availableStock <= 10;
                const isMaxStockReached = maintainsStock && currentQty > 0 && remainingStock <= 0;

                const liveCalc = calculateLineItem({
                  billType: cartBillType,
                  price: state.price,
                  quantity: currentQty,
                  gstRate: item.product_gst || 0,
                  cessRate: item.product_cess || 0,
                  discountType: state.discountType,
                  discountValue: currentDiscVal,
                  freeScheme: state.freeScheme,
                });

                return (
                  <View
                    style={[
                      styles.productCard,
                      isSelected && styles.productCardSelected,
                    ]}
                  >
                    {/* REDESIGNED HEADER:
                        Row 1: Checkbox + Product Name + Expand chevron
                        Row 2: Price, MRP (strikethrough), Dynamic Remaining Stock Chip
                        Row 3: Stepper on its own row below (or Add button) - never overlaps stock chip! */}
                    <View style={styles.cardHeaderArea}>
                      {/* Row 1 */}
                      <TouchableOpacity
                        style={styles.headerRow1}
                        onPress={() => setExpandedId(isExpanded ? null : item.product_id)}
                        activeOpacity={0.7}
                      >
                        <TouchableOpacity
                          style={[styles.checkbox, isSelected && styles.checkboxActive]}
                          onPress={() => toggleSelect(item.product_id, item)}
                          disabled={isOutOfStock}
                        >
                          {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
                        </TouchableOpacity>

                        <Text style={styles.productName} numberOfLines={1}>
                          {item.product_name}
                        </Text>

                        <Feather
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>

                      {/* Row 2 */}
                      <View style={styles.headerRow2}>
                        <View style={styles.pricingRow}>
                          <Text style={styles.priceText}>
                            {formatIndianCurrency(state.price)}
                          </Text>
                          {item.mrp_price > 0 && item.mrp_price !== state.price && (
                            <Text style={styles.mrpText}>
                              MRP: {formatIndianCurrency(item.mrp_price)}
                            </Text>
                          )}
                        </View>

                        <View style={styles.stockChipsContainer}>
                          {maintainsStock ? (
                            <>
                              <View
                                style={[
                                  styles.stockChip,
                                  isOutOfStock
                                    ? styles.stockChipOut
                                    : isLowStock
                                    ? styles.stockChipLow
                                    : styles.stockChipIn,
                                ]}
                              >
                                <Feather
                                  name={
                                    isOutOfStock
                                      ? 'slash'
                                      : isLowStock
                                      ? 'alert-triangle'
                                      : 'check-circle'
                                  }
                                  size={10}
                                  color={
                                    isOutOfStock
                                      ? '#B01E25'
                                      : isLowStock
                                      ? '#D97706'
                                      : '#0B7A4D'
                                  }
                                  style={{ marginRight: 3 }}
                                />
                                <Text
                                  style={[
                                    styles.stockChipText,
                                    isOutOfStock
                                      ? styles.stockChipTextOut
                                      : isLowStock
                                      ? styles.stockChipTextLow
                                      : styles.stockChipTextIn,
                                  ]}
                                >
                                  {isOutOfStock
                                    ? 'Out of stock'
                                    : currentQty > 0
                                    ? `${remainingStock} ${item.unit || 'PCS'} left`
                                    : `Stock: ${availableStock} ${item.unit || 'PCS'}`}
                                </Text>
                              </View>
                              {inCartQty > 0 && (
                                <View style={styles.inCartBadge}>
                                  <Text style={styles.inCartBadgeText}>
                                    {inCartQty} in cart
                                  </Text>
                                </View>
                              )}
                            </>
                          ) : (
                            <View style={[styles.stockChip, styles.stockChipService]}>
                              <Text style={styles.stockChipServiceText}>Service</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Row 3: Stepper or Add button on dedicated row */}
                      <View style={styles.headerRow3}>
                        <View style={styles.stepperContainer}>
                          <TouchableOpacity
                            style={[
                              styles.stepperBtn,
                              currentQty <= 0 && styles.stepperBtnDisabled,
                            ]}
                            onPress={() => handleStepperChange(item, -1)}
                            disabled={currentQty <= 0}
                          >
                            <Feather
                              name="minus"
                              size={14}
                              color={
                                currentQty <= 0
                                  ? Colors.textSecondary
                                  : Colors.text
                              }
                            />
                          </TouchableOpacity>

                          <TextInput
                            style={styles.stepperInput}
                            keyboardType="numeric"
                            selectTextOnFocus
                            value={state.qtyStr}
                            onChangeText={(val) => {
                              // Keep raw string while typing, allow empty
                              updateItemState(
                                item.product_id,
                                { qtyStr: val },
                                item
                              );
                            }}
                            onBlur={() => handleCommitQty(item)}
                            onSubmitEditing={() => handleCommitQty(item)}
                          />

                          <TouchableOpacity
                            style={[
                              styles.stepperBtn,
                              (isOutOfStock || isMaxStockReached) &&
                                styles.stepperBtnDisabled,
                            ]}
                            onPress={() => handleStepperChange(item, 1)}
                            disabled={isOutOfStock || isMaxStockReached}
                          >
                            <Feather
                              name="plus"
                              size={14}
                              color={
                                isOutOfStock || isMaxStockReached
                                  ? Colors.textSecondary
                                  : Colors.primary
                              }
                            />
                          </TouchableOpacity>
                        </View>

                        {isMaxStockReached ? (
                          <View style={styles.maxReachedBadge}>
                            <Text style={styles.maxReachedBadgeText}>Max Stock</Text>
                          </View>
                        ) : null}

                        {/* Quick single-add button */}
                        <TouchableOpacity
                          style={[
                            styles.quickAddBtn,
                            (isOutOfStock || currentQty <= 0) &&
                              styles.quickAddBtnDisabled,
                          ]}
                          onPress={() => handleSingleAdd(item)}
                          disabled={
                            isOutOfStock ||
                            currentQty <= 0 ||
                            addToCartMutation.isPending
                          }
                        >
                          <Feather
                            name="shopping-cart"
                            size={14}
                            color={
                              isOutOfStock || currentQty <= 0
                                ? Colors.textSecondary
                                : Colors.primary
                            }
                          />
                          <Text
                            style={[
                              styles.quickAddText,
                              (isOutOfStock || currentQty <= 0) &&
                                styles.quickAddTextDisabled,
                            ]}
                          >
                            {addToCartMutation.isPending
                              ? 'Adding...'
                              : 'Add to cart'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* EXPANDABLE SECTION */}
                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        {/* Live Calculation Preview (Requirement 3) */}
                        <View style={styles.calcPreviewBox}>
                          <View style={styles.calcPreviewRow}>
                            <Text style={styles.calcPreviewLabel}>
                              {currentQty} × {formatIndianCurrency(state.price)}
                            </Text>
                            <Text style={styles.calcPreviewVal}>
                              {formatIndianCurrency(liveCalc.baseAmount)}
                            </Text>
                          </View>

                          {liveCalc.discountAmount > 0 && (
                            <View style={styles.calcPreviewRow}>
                              <Text style={styles.calcPreviewLabel}>Discount</Text>
                              <Text style={[styles.calcPreviewVal, { color: '#0B7A4D' }]}>
                                -{formatIndianCurrency(liveCalc.discountAmount)}
                              </Text>
                            </View>
                          )}

                          <View style={styles.calcPreviewRow}>
                            <Text style={styles.calcPreviewLabel}>Taxable Amount</Text>
                            <Text style={styles.calcPreviewVal}>
                              {formatIndianCurrency(liveCalc.taxableAmount)}
                            </Text>
                          </View>

                          <View style={styles.calcPreviewRow}>
                            <Text style={styles.calcPreviewLabel}>
                              CGST ({(item.product_gst || 0) / 2}%)
                            </Text>
                            <Text style={styles.calcPreviewVal}>
                              {formatIndianCurrency(liveCalc.cgstAmount)}
                            </Text>
                          </View>

                          <View style={styles.calcPreviewRow}>
                            <Text style={styles.calcPreviewLabel}>
                              SGST ({(item.product_gst || 0) / 2}%)
                            </Text>
                            <Text style={styles.calcPreviewVal}>
                              {formatIndianCurrency(liveCalc.sgstAmount)}
                            </Text>
                          </View>

                          <View style={styles.calcPreviewRow}>
                            <Text style={styles.calcPreviewLabel}>
                              Total GST ({item.product_gst || 0}%)
                            </Text>
                            <Text style={styles.calcPreviewVal}>
                              {formatIndianCurrency(liveCalc.gstAmount)}
                            </Text>
                          </View>

                          {liveCalc.cessAmount > 0 && (
                            <View style={styles.calcPreviewRow}>
                              <Text style={styles.calcPreviewLabel}>
                                CESS ({item.product_cess}%):
                              </Text>
                              <Text style={styles.calcPreviewVal}>
                                {formatIndianCurrency(liveCalc.cessAmount)}
                              </Text>
                            </View>
                          )}

                          <View style={[styles.calcPreviewRow, styles.calcPreviewTotalRow]}>
                            <Text style={styles.calcPreviewTotalLabel}>Line Total</Text>
                            <Text style={styles.calcPreviewTotalVal}>
                              {formatIndianCurrency(liveCalc.netAmount)}
                            </Text>
                          </View>
                        </View>

                        {/* Price & Price Type Inputs */}
                        <View style={styles.inputRow}>
                          <View style={styles.halfCol}>
                            <Text style={styles.subLabel}>Price (₹)</Text>
                            <TextInput
                              style={styles.inputMini}
                              keyboardType="numeric"
                              selectTextOnFocus
                              value={state.priceStr}
                              onChangeText={(val) =>
                                updateItemState(
                                  item.product_id,
                                  { priceStr: val },
                                  item
                                )
                              }
                              onBlur={() => handleCommitPrice(item)}
                              onSubmitEditing={() => handleCommitPrice(item)}
                            />
                          </View>

                          <View style={styles.halfCol}>
                            <Text style={styles.subLabel}>Price Type</Text>
                            <View style={styles.segmentRow}>
                              <TouchableOpacity
                                style={[
                                  styles.segmentBtn,
                                  state.priceType === 'Retailer' && styles.segmentBtnActive,
                                ]}
                                onPress={() =>
                                  updateItemState(
                                    item.product_id,
                                    { priceType: 'Retailer' },
                                    item
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.segmentText,
                                    state.priceType === 'Retailer' && styles.segmentTextActive,
                                  ]}
                                >
                                  Retailer
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.segmentBtn,
                                  state.priceType === 'Dealer' && styles.segmentBtnActive,
                                ]}
                                onPress={() =>
                                  updateItemState(
                                    item.product_id,
                                    { priceType: 'Dealer' },
                                    item
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.segmentText,
                                    state.priceType === 'Dealer' && styles.segmentTextActive,
                                  ]}
                                >
                                  Dealer
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>

                        {/* Discount Input & Type Toggle */}
                        <View style={styles.inputRow}>
                          <View style={styles.fullCol}>
                            <Text style={styles.subLabel}>Discount</Text>
                            <View style={styles.discountInputGroup}>
                              <TextInput
                                style={styles.discountInput}
                                keyboardType="numeric"
                                selectTextOnFocus
                                placeholder="0"
                                placeholderTextColor={Colors.textSecondary}
                                value={state.discountStr}
                                onChangeText={(val) =>
                                  updateItemState(
                                    item.product_id,
                                    { discountStr: val },
                                    item
                                  )
                                }
                                onBlur={() => handleCommitDiscount(item)}
                                onSubmitEditing={() => handleCommitDiscount(item)}
                              />
                              <TouchableOpacity
                                style={styles.discountTypeToggle}
                                onPress={() => {
                                  const nextType =
                                    state.discountType === 'Amount' ? 'Percent' : 'Amount';
                                  updateItemState(
                                    item.product_id,
                                    { discountType: nextType },
                                    item
                                  );
                                }}
                              >
                                <Text style={styles.discountTypeLabel}>
                                  {state.discountType === 'Amount' ? '₹ (Amt)' : '% (Pct)'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>

                        {/* FMCG Extra: Bag Type */}
                        {item.product_type === 'FMCG' &&
                          item.bagjson_detail &&
                          item.bagjson_detail.length > 0 && (
                            <View style={styles.extraSection}>
                              <Text style={styles.subLabel}>Bag Type</Text>
                              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {item.bagjson_detail.map((b: BagDetail, idx: number) => {
                                  const isBagActive = state.bagVal === b.total_unit;
                                  return (
                                    <TouchableOpacity
                                      key={b.id || idx}
                                      style={[
                                        styles.bagChip,
                                        isBagActive && styles.bagChipActive,
                                      ]}
                                      onPress={() =>
                                        updateItemState(
                                          item.product_id,
                                          { bagVal: b.total_unit },
                                          item
                                        )
                                      }
                                    >
                                      <Text
                                        style={[
                                          styles.bagChipText,
                                          isBagActive && styles.bagChipTextActive,
                                        ]}
                                      >
                                        {b.bag_name || `${b.total_unit} ${b.conversion_unit || 'Pcs'}`} (₹{b.sale_price})
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </ScrollView>
                            </View>
                          )}

                        {/* FMCG Extra: Returnable (Crate / Bottle) */}
                        {item.product_type === 'FMCG' && (
                          <View style={styles.extraSection}>
                            <Text style={styles.subLabel}>Returnable (Crate / Bottle)</Text>
                            <View style={styles.inputRow}>
                              <View style={styles.halfCol}>
                                <TextInput
                                  style={styles.inputMini}
                                  keyboardType="numeric"
                                  selectTextOnFocus
                                  placeholder="Crate Qty"
                                  placeholderTextColor={Colors.textSecondary}
                                  value={state.crateQtyStr}
                                  onChangeText={(val) =>
                                    updateItemState(
                                      item.product_id,
                                      { crateQtyStr: val.replace(/[^0-9]/g, '') },
                                      item
                                    )
                                  }
                                />
                              </View>
                              <View style={styles.halfCol}>
                                <TextInput
                                  style={styles.inputMini}
                                  keyboardType="numeric"
                                  selectTextOnFocus
                                  placeholder="Bottle Qty"
                                  placeholderTextColor={Colors.textSecondary}
                                  value={state.bottleQtyStr}
                                  onChangeText={(val) =>
                                    updateItemState(
                                      item.product_id,
                                      { bottleQtyStr: val.replace(/[^0-9]/g, '') },
                                      item
                                    )
                                  }
                                />
                              </View>
                            </View>
                          </View>
                        )}

                        {/* Serial No Extra: IMEI Multi-select, Scan Button, Textarea */}
                        {item.product_type === 'Serial No' && (
                          <View style={styles.extraSection}>
                            <View style={styles.serialHeaderRow}>
                              <Text style={styles.subLabel}>
                                Serial / IMEI Numbers ({state.selectedSerials.length})
                              </Text>
                              <TouchableOpacity
                                style={styles.scanBtn}
                                onPress={() => {
                                  setScanningProductId(item.product_id);
                                  setScannerOpen(true);
                                }}
                              >
                                <Feather name="camera" size={14} color="#FFFFFF" />
                                <Text style={styles.scanBtnText}>Scan</Text>
                              </TouchableOpacity>
                            </View>

                            {/* Dropdown list of pre-configured IMEIs if available */}
                            {item.proSerialno_imei && item.proSerialno_imei.length > 0 && (
                              <View style={styles.imeiPillsWrapper}>
                                {item.proSerialno_imei.map((sObj) => {
                                  const isSelectedImei = state.selectedSerials.includes(sObj.IMEI);
                                  return (
                                    <TouchableOpacity
                                      key={sObj.IMEI}
                                      style={[
                                        styles.imeiPill,
                                        isSelectedImei && styles.imeiPillActive,
                                      ]}
                                      onPress={() => {
                                        let nextList = [...state.selectedSerials];
                                        if (isSelectedImei) {
                                          nextList = nextList.filter((x) => x !== sObj.IMEI);
                                        } else {
                                          nextList.push(sObj.IMEI);
                                        }
                                        updateItemState(
                                          item.product_id,
                                          {
                                            selectedSerials: nextList,
                                            imeiText: nextList.join('\n'),
                                            qtyStr: String(nextList.length),
                                          },
                                          item
                                        );
                                      }}
                                    >
                                      <Text
                                        style={[
                                          styles.imeiPillText,
                                          isSelectedImei && styles.imeiPillTextActive,
                                        ]}
                                      >
                                        {sObj.IMEI}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}

                            {/* Text Area for typed/scanned IMEIs */}
                            <TextInput
                              style={styles.imeiTextArea}
                              placeholder="Type or scan IMEIs (one per line)..."
                              placeholderTextColor={Colors.textSecondary}
                              multiline
                              numberOfLines={3}
                              value={state.imeiText}
                              onChangeText={(val) => handleImeiTextChange(val, item)}
                            />
                          </View>
                        )}

                        {/* Free Scheme Option */}
                        <View style={styles.freeSchemeRow}>
                          <TouchableOpacity
                            style={styles.freeSchemeCheckbox}
                            onPress={() =>
                              updateItemState(
                                item.product_id,
                                {
                                  freeScheme: state.freeScheme === 'Yes' ? 'No' : 'Yes',
                                },
                                item
                              )
                            }
                          >
                            <View
                              style={[
                                styles.checkboxSmall,
                                state.freeScheme === 'Yes' && styles.checkboxSmallActive,
                              ]}
                            >
                              {state.freeScheme === 'Yes' && (
                                <Feather name="check" size={12} color="#FFFFFF" />
                              )}
                            </View>
                            <Text style={styles.freeSchemeLabel}>Free Scheme</Text>
                          </TouchableOpacity>
                        </View>

                        {state.freeScheme === 'Yes' && (
                          <View style={styles.freeProductSelectWrapper}>
                            <Text style={styles.subLabel}>Select Free Product:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              {freeSchemeProducts.map((fProd) => {
                                const isFSelected =
                                  state.freeSchemeProduct === fProd.product_id;
                                return (
                                  <TouchableOpacity
                                    key={fProd.product_id}
                                    style={[
                                      styles.freeProdChip,
                                      isFSelected && styles.freeProdChipActive,
                                    ]}
                                    onPress={() =>
                                      updateItemState(
                                        item.product_id,
                                        { freeSchemeProduct: fProd.product_id },
                                        item
                                      )
                                    }
                                  >
                                    <Text
                                      style={[
                                        styles.freeProdChipText,
                                        isFSelected && styles.freeProdChipTextActive,
                                      ]}
                                    >
                                      {fProd.product_name}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              }}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.primary}
                    style={{ marginVertical: 16 }}
                  />
                ) : undefined
              }
            />
          )}

          {/* Sticky Bottom Bar */}
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.selectedCount}>
                {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                selectedCount === 0 && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmitSelected}
              disabled={selectedCount === 0 || addToCartMutation.isPending}
            >
              {addToCartMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Submit selected</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
          setScanningProductId(null);
        }}
        onScan={handleBarcodeScanned}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 24, 64, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    ...Shadows.card,
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  taxPrefContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  taxPrefLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  taxPrefSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  taxPrefLockedNote: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 2,
  },
  taxPrefSegments: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
  },
  taxPrefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  taxPrefBtnActive: {
    backgroundColor: Colors.primary,
  },
  taxPrefBtnDisabled: {
    opacity: 0.5,
  },
  taxPrefBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  taxPrefBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  taxPrefBtnTextDisabled: {
    color: Colors.textSecondary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    padding: 0,
  },
  searchScanBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    ...Shadows.card,
  },
  productCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#FAFAFF',
  },
  cardHeaderArea: {
    gap: 10,
  },
  headerRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  headerRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 34,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  mrpText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  stockChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockChipIn: {
    backgroundColor: '#E8F5E9',
  },
  stockChipLow: {
    backgroundColor: '#FEF3C7',
  },
  stockChipOut: {
    backgroundColor: '#FDECEC',
  },
  stockChipService: {
    backgroundColor: '#EEF2FF',
  },
  stockChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockChipTextIn: {
    color: '#0B7A4D',
  },
  stockChipTextLow: {
    color: '#D97706',
  },
  stockChipTextOut: {
    color: '#B01E25',
  },
  stockChipServiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  inCartBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inCartBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerRow3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 34,
    marginTop: 2,
    gap: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.35,
  },
  stepperInput: {
    minWidth: 42,
    height: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    paddingVertical: 0,
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  maxReachedBadge: {
    backgroundColor: '#FDECEC',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  maxReachedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B01E25',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  quickAddBtnDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.5,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  quickAddTextDisabled: {
    color: Colors.textSecondary,
  },
  expandedSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  calcPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  calcPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcPreviewLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  calcPreviewVal: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '600',
  },
  calcPreviewTotalRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
  },
  calcPreviewTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
  },
  calcPreviewTotalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCol: {
    flex: 1,
  },
  fullCol: {
    flex: 1,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  inputMini: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.text,
  },
  segmentRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    height: 34,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  discountInputGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.inputBg,
  },
  discountInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.text,
  },
  discountTypeToggle: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  discountTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  extraSection: {
    marginTop: 4,
    gap: 6,
  },
  bagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
    backgroundColor: Colors.card,
  },
  bagChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bagChipText: {
    fontSize: 11,
    color: Colors.text,
  },
  bagChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  serialHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  scanBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  imeiPillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  imeiPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F1F5F9',
  },
  imeiPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  imeiPillText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.text,
  },
  imeiPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  imeiTextArea: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 8,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.text,
    minHeight: 54,
  },
  freeSchemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  freeSchemeCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSmallActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  freeSchemeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  freeProductSelectWrapper: {
    marginTop: 6,
    gap: 4,
  },
  freeProdChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
    backgroundColor: Colors.card,
  },
  freeProdChipActive: {
    backgroundColor: '#0B7A4D',
    borderColor: '#0B7A4D',
  },
  freeProdChipText: {
    fontSize: 11,
    color: Colors.text,
  },
  freeProdChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  cancelText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
