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
} from '@/features/invoice/calc';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { Colors } from '@/theme/tokens';

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
      qtyStr: '1.0',
      priceStr: String(defaultPrice),
      discountStr: '',
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
        updateItemState(productId, { qtyStr: '1.0' }, product);
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

    updateItemState(product.product_id, { qtyStr: newQty.toFixed(1) }, product);

    if (newQty > 0 && !selectedProductIds.includes(product.product_id)) {
      setSelectedProductIds((prev) => [...prev, product.product_id]);
    } else if (newQty === 0 && selectedProductIds.includes(product.product_id)) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== product.product_id));
    }
  };

  const handleCommitPrice = (product: ApiProductItem) => {
    const s = getItemState(product);
    let val = parseFloat(s.priceStr);
    if (isNaN(val) || val < 0) {
      val = s.price;
    }
    val = Number(val.toFixed(2));
    updateItemState(product.product_id, { price: val, priceStr: String(val) }, product);
  };

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
    updateItemState(product.product_id, { discountStr: val > 0 ? String(val) : '' }, product);
  };

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
      if (!item) return;
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
            <Text style={styles.title}>Add Items</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar matching Home Theme */}
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Product"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x-circle" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              </TouchableOpacity>
            )}
            <Feather name="search" size={18} color={Colors.primary} />
          </View>

          {/* Inclusive / Exclusive Pill Row */}
          <View style={styles.taxPillRow}>
            {(['Inclusive', 'Exclusive'] as const).map((billType) => {
              const isActive = cartBillType === billType;
              return (
                <TouchableOpacity
                  key={billType}
                  style={[
                    styles.taxPill,
                    isActive ? styles.taxPillActive : styles.taxPillInactive,
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
                  {isActive && <Feather name="check" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />}
                  <Text style={[styles.taxPillText, isActive ? styles.taxPillTextActive : styles.taxPillTextInactive]}>
                    {billType}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Product Catalog List */}
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

                return (
                  <View style={[styles.productCard, isSelected && styles.productCardSelected]}>
                    {/* Header Row: Checkbox, Name, Expand Chevron */}
                    <TouchableOpacity
                      style={styles.cardHeaderRow}
                      onPress={() => setExpandedId(isExpanded ? null : item.product_id)}
                      activeOpacity={0.7}
                    >
                      <TouchableOpacity
                        style={[styles.checkbox, isSelected && styles.checkboxActive]}
                        onPress={() => toggleSelect(item.product_id, item)}
                      >
                        {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
                      </TouchableOpacity>

                      <Text style={styles.productTitle} numberOfLines={1}>
                        {item.product_name}
                      </Text>

                      <Feather
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={Colors.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Badges Row: Service / Stock / Serial No */}
                    <View style={styles.badgesRow}>
                      {!maintainsStock ? (
                        <View style={styles.serviceBadge}>
                          <Text style={styles.serviceBadgeText}>Service</Text>
                        </View>
                      ) : (
                        <View style={styles.stockBadge}>
                          <Text style={styles.stockBadgeText}>
                            Stock: {availableStock.toFixed(1)}
                          </Text>
                        </View>
                      )}

                      {item.product_type === 'Serial No' && (
                        <View style={styles.serialBadge}>
                          <Text style={styles.serialBadgeText}>Serial No</Text>
                        </View>
                      )}
                    </View>

                    {/* Quantity Row */}
                    <View style={styles.quantitySection}>
                      <Text style={styles.fieldLabel}>Quantity</Text>
                      <View style={styles.stepperRow}>
                        <TouchableOpacity
                          style={styles.stepperMinusBtn}
                          onPress={() => handleStepperChange(item, -1)}
                        >
                          <Feather name="minus" size={16} color={Colors.text} />
                        </TouchableOpacity>

                        <Text style={styles.stepperValueText}>{state.qtyStr}</Text>

                        <TouchableOpacity
                          style={styles.stepperPlusBtn}
                          onPress={() => handleStepperChange(item, 1)}
                        >
                          <Feather name="plus" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Row 4: Edit Price & Type dropdown */}
                    <View style={styles.twoColRow}>
                      <View style={styles.colHalf}>
                        <Text style={styles.fieldLabel}>Edit Price</Text>
                        <TextInput
                          style={styles.inputBox}
                          keyboardType="numeric"
                          selectTextOnFocus
                          value={state.priceStr}
                          onChangeText={(val) =>
                            updateItemState(item.product_id, { priceStr: val }, item)
                          }
                          onBlur={() => handleCommitPrice(item)}
                          onSubmitEditing={() => handleCommitPrice(item)}
                        />
                      </View>

                      <View style={styles.colHalf}>
                        <Text style={styles.fieldLabel}>Type</Text>
                        <TouchableOpacity
                          style={styles.dropdownBox}
                          onPress={() => {
                            const nextType = state.priceType === 'Retailer' ? 'Dealer' : 'Retailer';
                            updateItemState(item.product_id, { priceType: nextType }, item);
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.dropdownValue}>{state.priceType}</Text>
                          <Feather name="chevron-down" size={16} color={Colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Row 5: Disc. Type & Discount input */}
                    <View style={styles.twoColRow}>
                      <View style={styles.colHalf}>
                        <Text style={styles.fieldLabel}>Disc. Type</Text>
                        <View style={styles.discTypeRow}>
                          <TouchableOpacity
                            style={[
                              styles.discPill,
                              state.discountType === 'Amount' ? styles.discPillActive : styles.discPillInactive,
                            ]}
                            onPress={() =>
                              updateItemState(item.product_id, { discountType: 'Amount' }, item)
                            }
                          >
                            {state.discountType === 'Amount' && (
                              <Feather name="check" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                            )}
                            <Text
                              style={[
                                styles.discPillText,
                                state.discountType === 'Amount'
                                  ? styles.discPillTextActive
                                  : styles.discPillTextInactive,
                              ]}
                            >
                              Amount
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.discPillSmall,
                              state.discountType === 'Percent' ? styles.discPillActive : styles.discPillInactive,
                            ]}
                            onPress={() =>
                              updateItemState(item.product_id, { discountType: 'Percent' }, item)
                            }
                          >
                            <Text
                              style={[
                                styles.discPillText,
                                state.discountType === 'Percent'
                                  ? styles.discPillTextActive
                                  : styles.discPillTextInactive,
                              ]}
                            >
                              %
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.colHalf}>
                        <Text style={styles.fieldLabel}>Discount</Text>
                        <TextInput
                          style={styles.inputBox}
                          keyboardType="numeric"
                          selectTextOnFocus
                          placeholder="Discount"
                          placeholderTextColor="#94A3B8"
                          value={state.discountStr}
                          onChangeText={(val) =>
                            updateItemState(item.product_id, { discountStr: val }, item)
                          }
                          onBlur={() => handleCommitDiscount(item)}
                          onSubmitEditing={() => handleCommitDiscount(item)}
                        />
                      </View>
                    </View>

                    {/* Row 6: Free Scheme Checkbox */}
                    <TouchableOpacity
                      style={styles.freeSchemeRow}
                      onPress={() =>
                        updateItemState(
                          item.product_id,
                          { freeScheme: state.freeScheme === 'Yes' ? 'No' : 'Yes' },
                          item
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <View style={[styles.checkboxSmall, state.freeScheme === 'Yes' && styles.checkboxSmallActive]}>
                        {state.freeScheme === 'Yes' && <Feather name="check" size={12} color="#FFFFFF" />}
                      </View>
                      <Text style={styles.freeSchemeLabel}>Free Scheme</Text>
                    </TouchableOpacity>

                    {/* Free Scheme selection if Yes */}
                    {state.freeScheme === 'Yes' && freeSchemeProducts.length > 0 && (
                      <View style={styles.freeProductSelectWrapper}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {freeSchemeProducts.map((fProd) => {
                            const isFSelected = state.freeSchemeProduct === fProd.product_id;
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

                    {/* FMCG Extra: Bag Type */}
                    {item.product_type === 'FMCG' &&
                      item.bagjson_detail &&
                      item.bagjson_detail.length > 0 && (
                        <View style={styles.extraSection}>
                          <Text style={styles.fieldLabel}>Bag Type</Text>
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
                                    {b.bag_name || `${b.total_unit} Pcs`} (₹{b.sale_price})
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      )}

                    {/* Serial No Extra: IMEI Scanning */}
                    {item.product_type === 'Serial No' && (
                      <View style={styles.extraSection}>
                        <View style={styles.serialHeaderRow}>
                          <Text style={styles.fieldLabel}>
                            Serial / IMEI ({state.selectedSerials.length})
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

          {/* Sticky Bottom Bar matching Home Theme */}
          <View style={styles.bottomBar}>
            <Text style={styles.itemCountText}>
              {selectedCount} item{selectedCount === 1 ? '' : 's'}
            </Text>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                selectedCount === 0 && styles.addToCartBtnDisabled,
              ]}
              onPress={handleSubmitSelected}
              disabled={selectedCount === 0 || addToCartMutation.isPending}
              activeOpacity={0.8}
            >
              {addToCartMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.addToCartBtnText}>Add To Cart</Text>
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
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DFE7F2',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
  },
  closeBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    padding: 0,
  },
  taxPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  taxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  taxPillActive: {
    backgroundColor: '#0047AB',
  },
  taxPillInactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  taxPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  taxPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  taxPillTextInactive: {
    color: '#5A6B87',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  productCardSelected: {
    borderColor: '#0047AB',
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  productTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceBadge: {
    backgroundColor: '#E8F1FC',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  serviceBadgeText: {
    color: '#0047AB',
    fontSize: 12,
    fontWeight: '700',
  },
  stockBadge: {
    backgroundColor: '#E6F9F0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  stockBadgeText: {
    color: '#0D9488',
    fontSize: 12,
    fontWeight: '700',
  },
  serialBadge: {
    backgroundColor: '#FFF2E5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  serialBadgeText: {
    color: '#FF6E00',
    fontSize: 12,
    fontWeight: '700',
  },
  quantitySection: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6B87',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    height: 42,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
  },
  stepperMinusBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
  },
  stepperPlusBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#0047AB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colHalf: {
    flex: 1,
    gap: 6,
  },
  inputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0E204E',
  },
  dropdownBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '600',
  },
  discTypeRow: {
    flexDirection: 'row',
    gap: 6,
    height: 40,
  },
  discPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  discPillSmall: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  discPillActive: {
    backgroundColor: '#0047AB',
  },
  discPillInactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  discPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  discPillTextActive: {
    color: '#FFFFFF',
  },
  discPillTextInactive: {
    color: '#5A6B87',
  },
  freeSchemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  checkboxSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSmallActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  freeSchemeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  freeProductSelectWrapper: {
    marginTop: 4,
  },
  freeProdChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginRight: 6,
    backgroundColor: '#F8FAFC',
  },
  freeProdChipActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  freeProdChipText: {
    fontSize: 11,
    color: '#5A6B87',
  },
  freeProdChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    borderColor: '#DFE7F2',
    marginRight: 6,
    backgroundColor: '#F8FAFC',
  },
  bagChipActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  bagChipText: {
    fontSize: 11,
    color: '#5A6B87',
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
    backgroundColor: '#0047AB',
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
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
    backgroundColor: '#FFFFFF',
  },
  itemCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B87',
  },
  addToCartBtn: {
    backgroundColor: '#0047AB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addToCartBtnDisabled: {
    opacity: 0.5,
  },
  addToCartBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
