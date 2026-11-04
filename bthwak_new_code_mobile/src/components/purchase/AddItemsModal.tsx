import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PurchaseItemApiRecord,
  AddPurchaseCartItemPayload,
  fetchPurchaseItemListApi,
  addPurchaseItemsToCartApi,
} from '@/api/purchase';
import { BarcodeScannerModal } from '@/components/invoice/BarcodeScannerModal';

interface AddItemsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ItemFormState {
  selected: boolean;
  expanded: boolean;
  quantity: number;
  price: string;
  billType: 'Inclusive' | 'Exclusive';
  discountType: 'Amount' | 'Percentage';
  discount: string;
  bagValue: number;
  bagSelectValue: string;
  serialNumbers: string[];
}

export const AddItemsModal: React.FC<AddItemsModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [globalTaxPreference, setGlobalTaxPreference] = useState<'Inclusive' | 'Exclusive'>('Inclusive');
  const [products, setProducts] = useState<PurchaseItemApiRecord[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-product state mapped by product_id
  const [itemStates, setItemStates] = useState<Record<number, ItemFormState>>({});

  // Manual IMEI entry dialog state
  const [manualImeiProductId, setManualImeiProductId] = useState<number | null>(null);
  const [manualImeiText, setManualImeiText] = useState('');

  // Scanner modal state
  const [scannerProductId, setScannerProductId] = useState<number | null>(null);

  // Fetch products on open and on search query change (debounced)
  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    const timeout = setTimeout(async () => {
      setIsLoadingProducts(true);
      try {
        const records = await fetchPurchaseItemListApi({ search: searchQuery.trim(), returnRows: 60 });
        if (isMounted) {
          setProducts(records);
        }
      } catch {
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [visible, searchQuery]);

  // Reset states when closed
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setItemStates({});
    }
  }, [visible]);

  // Helper to get or initialize state for a product
  const getProductState = (product: PurchaseItemApiRecord): ItemFormState => {
    if (itemStates[product.product_id]) {
      return itemStates[product.product_id];
    }
    const defaultPrice =
      globalTaxPreference === 'Inclusive'
        ? String(product.purchase_price || 0)
        : String(product.purchase_price_exc || product.purchase_price || 0);

    return {
      selected: false,
      expanded: false,
      quantity: 1,
      price: defaultPrice,
      billType: globalTaxPreference,
      discountType: 'Amount',
      discount: '',
      bagValue: 0,
      bagSelectValue: 'none',
      serialNumbers: [],
    };
  };

  const updateProductState = (productId: number, patch: Partial<ItemFormState>) => {
    setItemStates((prev) => {
      const existing = prev[productId] || {
        selected: false,
        expanded: false,
        quantity: 1,
        price: '0',
        billType: globalTaxPreference,
        discountType: 'Amount',
        discount: '',
        bagValue: 0,
        bagSelectValue: 'none',
        serialNumbers: [],
      };
      return {
        ...prev,
        [productId]: { ...existing, ...patch },
      };
    });
  };

  // Toggle selection
  const handleToggleSelect = (product: PurchaseItemApiRecord) => {
    const current = getProductState(product);
    const newSelected = !current.selected;
    updateProductState(product.product_id, {
      selected: newSelected,
      expanded: newSelected ? true : current.expanded,
    });
  };

  // Toggle card expand/collapse
  const handleToggleExpand = (product: PurchaseItemApiRecord) => {
    const current = getProductState(product);
    updateProductState(product.product_id, {
      expanded: !current.expanded,
    });
  };

  // Quantity adjust for FMCG / Service
  const handleQuantityDelta = (product: PurchaseItemApiRecord, delta: number) => {
    const current = getProductState(product);
    const newQty = Math.max(1, current.quantity + delta);
    updateProductState(product.product_id, { quantity: newQty, selected: true });
  };

  // Open manual IMEI dialog
  const handleOpenManualImei = (productId: number) => {
    setManualImeiProductId(productId);
    setManualImeiText('');
  };

  // Save manual IMEIs
  const handleSaveManualImei = () => {
    if (manualImeiProductId === null) return;
    const newSerials = manualImeiText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (newSerials.length === 0) {
      setManualImeiProductId(null);
      return;
    }

    const current = itemStates[manualImeiProductId];
    const existing = current?.serialNumbers || [];
    // Combine unique serials
    const combined = Array.from(new Set([...existing, ...newSerials]));

    updateProductState(manualImeiProductId, {
      serialNumbers: combined,
      quantity: combined.length > 0 ? combined.length : 1,
      selected: combined.length > 0,
    });
    setManualImeiProductId(null);
    setManualImeiText('');
  };

  // Delete individual IMEI
  const handleDeleteImei = (productId: number, imeiToDelete: string) => {
    const current = itemStates[productId];
    if (!current) return;
    const updated = current.serialNumbers.filter((s) => s !== imeiToDelete);
    updateProductState(productId, {
      serialNumbers: updated,
      quantity: updated.length > 0 ? updated.length : 1,
    });
  };

  // Scan IMEI result handler
  const handleScanImeiResult = (code: string) => {
    if (scannerProductId === null || !code) return;
    const cleanCode = code.trim();
    const current = itemStates[scannerProductId];
    const existing = current?.serialNumbers || [];
    if (!existing.includes(cleanCode)) {
      const updated = [...existing, cleanCode];
      updateProductState(scannerProductId, {
        serialNumbers: updated,
        quantity: updated.length,
        selected: true,
      });
      Alert.alert('Scanned', `Added IMEI: ${cleanCode}`);
    } else {
      Alert.alert('Duplicate', 'This IMEI / Serial has already been added.');
    }
  };

  // Selected products count
  const selectedCount = useMemo(() => {
    return Object.values(itemStates).filter((s) => s.selected).length;
  }, [itemStates]);

  // Submit selected items to cart
  const handleAddToCart = async () => {
    const selectedIds = Object.keys(itemStates)
      .map(Number)
      .filter((id) => itemStates[id]?.selected);

    if (selectedIds.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one product to add to cart.');
      return;
    }

    // Build API payload for each selected product
    const payloadItems: AddPurchaseCartItemPayload[] = [];

    for (const id of selectedIds) {
      const p = products.find((prod) => prod.product_id === id);
      if (!p) continue;
      const s = itemStates[id];

      const isSerial = p.product_type === 'Serial No';
      const serials = isSerial ? s.serialNumbers : [];
      const qty = isSerial
        ? serials.length > 0 ? serials.length : 1
        : Math.max(1, Number(s.quantity) || 1);

      const price = parseFloat(s.price) || (p.purchase_price || 0);
      const discount = parseFloat(s.discount) || 0;

      payloadItems.push({
        product_id: p.product_id,
        quantity: qty,
        price,
        discount_type: s.discountType,
        discount,
        billtype: s.billType || globalTaxPreference,
        bag_value: s.bagValue || 0,
        serial_no: serials,
      });
    }

    setIsSubmitting(true);
    try {
      const res = await addPurchaseItemsToCartApi(payloadItems);
      if (res.status) {
        Alert.alert('Added to Cart', res.message || `${payloadItems.length} item(s) added successfully.`);
        onSuccess();
        onClose();
      } else {
        Alert.alert('Add to Cart Failed', res.message || 'Unable to add items to cart.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to add items to cart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { paddingTop: Math.max(insets.top, 16) }]}>
          {/* 1. TOP HEADER */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Add Items</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={24} color="#0E204E" />
            </TouchableOpacity>
          </View>

          {/* 2. SEARCH BAR */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color="#5A6B87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Product"
              placeholderTextColor="#8E9CAE"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={16} color="#8E9CAE" />
              </TouchableOpacity>
            )}
          </View>

          {/* 3. TAX PREFERENCE PILLS: Inclusive | Exclusive */}
          <View style={styles.taxPillsRow}>
            <TouchableOpacity
              style={[
                styles.taxPill,
                globalTaxPreference === 'Inclusive' && styles.taxPillActive,
              ]}
              onPress={() => {
                setGlobalTaxPreference('Inclusive');
                // Sync all current states
                setItemStates((prev) => {
                  const updated: Record<number, ItemFormState> = {};
                  Object.keys(prev).forEach((k) => {
                    const id = Number(k);
                    const prod = products.find((p) => p.product_id === id);
                    updated[id] = {
                      ...prev[id],
                      billType: 'Inclusive',
                      price: prod ? String(prod.purchase_price) : prev[id].price,
                    };
                  });
                  return updated;
                });
              }}
              activeOpacity={0.8}
            >
              {globalTaxPreference === 'Inclusive' && (
                <Feather name="check" size={14} color="#0047AB" style={{ marginRight: 6 }} />
              )}
              <Text
                style={[
                  styles.taxPillText,
                  globalTaxPreference === 'Inclusive' && styles.taxPillTextActive,
                ]}
              >
                Inclusive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taxPill,
                globalTaxPreference === 'Exclusive' && styles.taxPillActive,
              ]}
              onPress={() => {
                setGlobalTaxPreference('Exclusive');
                setItemStates((prev) => {
                  const updated: Record<number, ItemFormState> = {};
                  Object.keys(prev).forEach((k) => {
                    const id = Number(k);
                    const prod = products.find((p) => p.product_id === id);
                    updated[id] = {
                      ...prev[id],
                      billType: 'Exclusive',
                      price: prod
                        ? String(prod.purchase_price_exc || prod.purchase_price)
                        : prev[id].price,
                    };
                  });
                  return updated;
                });
              }}
              activeOpacity={0.8}
            >
              {globalTaxPreference === 'Exclusive' && (
                <Feather name="check" size={14} color="#0047AB" style={{ marginRight: 6 }} />
              )}
              <Text
                style={[
                  styles.taxPillText,
                  globalTaxPreference === 'Exclusive' && styles.taxPillTextActive,
                ]}
              >
                Exclusive
              </Text>
            </TouchableOpacity>
          </View>

          {/* 4. PRODUCTS LIST */}
          {isLoadingProducts ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loaderText}>Loading products catalog...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Feather name="inbox" size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try searching with a different name or SKU</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.productsScroll}
              contentContainerStyle={[styles.productsListContent, { paddingBottom: 110 }]}
              showsVerticalScrollIndicator={false}
            >
              {products.map((product) => {
                const s = getProductState(product);
                const isSerial = product.product_type === 'Serial No';
                const isFmcg = product.product_type === 'FMCG';
                const stockVal = product.stock_qty ?? product.stock ?? 0;
                const bags = product.bagjson_detail || [];

                return (
                  <View
                    key={product.product_id}
                    style={[
                      styles.productCard,
                      s.selected && styles.productCardSelected,
                    ]}
                  >
                    {/* TOP COLLAPSIBLE HEADER */}
                    <View style={styles.productHeaderRow}>
                      <TouchableOpacity
                        style={styles.checkboxTouch}
                        onPress={() => handleToggleSelect(product)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.checkboxBox,
                            s.selected && styles.checkboxBoxActive,
                          ]}
                        >
                          {s.selected && <Feather name="check" size={13} color="#FFFFFF" />}
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.productTitleArea}
                        onPress={() => handleToggleExpand(product)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.productNameText}>{product.product_name}</Text>
                          <View style={styles.badgesRow}>
                            {/* CATEGORY BADGE */}
                            <View
                              style={[
                                styles.catBadge,
                                isSerial
                                  ? { backgroundColor: '#FEE2E2' }
                                  : isFmcg
                                  ? { backgroundColor: '#EDE9FE' }
                                  : { backgroundColor: '#E0F2FE' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.catBadgeText,
                                  isSerial
                                    ? { color: '#DC2626' }
                                    : isFmcg
                                    ? { color: '#7C3AED' }
                                    : { color: '#0284C7' },
                                ]}
                              >
                                {product.product_type}
                              </Text>
                            </View>

                            {/* STOCK BADGE */}
                            <View style={styles.stockBadge}>
                              <Text style={styles.stockBadgeText}>Stock: {stockVal}</Text>
                            </View>
                          </View>
                        </View>

                        <Feather
                          name={s.expanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="#5A6B87"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* EXPANDED ITEM EDIT FORM (Condition Bag, IMEI, FMCG) */}
                    {s.expanded && (
                      <View style={styles.expandedContent}>
                        <View style={styles.innerDivider} />

                        {/* FMCG / SERVICE QUANTITY CONTROLLER */}
                        {!isSerial && (
                          <View style={styles.formRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.formLabel}>Quantity</Text>
                              <View style={styles.quantityCounterRow}>
                                <TouchableOpacity
                                  style={styles.counterBtn}
                                  onPress={() => handleQuantityDelta(product, -1)}
                                  activeOpacity={0.7}
                                >
                                  <Feather name="minus" size={16} color="#0E204E" />
                                </TouchableOpacity>
                                <Text style={styles.quantityValText}>{s.quantity}</Text>
                                <TouchableOpacity
                                  style={styles.counterBtn}
                                  onPress={() => handleQuantityDelta(product, 1)}
                                  activeOpacity={0.7}
                                >
                                  <Feather name="plus" size={16} color="#0047AB" />
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* EDIT PRICE INPUT */}
                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <Text style={styles.formLabel}>Edit Price</Text>
                              <TextInput
                                style={styles.formInput}
                                keyboardType="numeric"
                                value={s.price}
                                onChangeText={(val) =>
                                  updateProductState(product.product_id, {
                                    price: val,
                                    selected: true,
                                  })
                                }
                                placeholder="0.00"
                                placeholderTextColor="#8E98BA"
                              />
                            </View>
                          </View>
                        )}

                        {/* SERIAL NO / IMEI PRICE INPUT */}
                        {isSerial && (
                          <View style={styles.formRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.formLabel}>Edit Price</Text>
                              <TextInput
                                style={styles.formInput}
                                keyboardType="numeric"
                                value={s.price}
                                onChangeText={(val) =>
                                  updateProductState(product.product_id, {
                                    price: val,
                                    selected: true,
                                  })
                                }
                                placeholder="0.00"
                                placeholderTextColor="#8E98BA"
                              />
                            </View>
                          </View>
                        )}

                        {/* DISCOUNT TYPE & VALUE */}
                        <View style={styles.formRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.formLabel}>Disc. Type</Text>
                            <View style={styles.discTypeToggleRow}>
                              <TouchableOpacity
                                style={[
                                  styles.discTypeBtn,
                                  s.discountType === 'Amount' && styles.discTypeBtnActive,
                                ]}
                                onPress={() =>
                                  updateProductState(product.product_id, {
                                    discountType: 'Amount',
                                  })
                                }
                              >
                                {s.discountType === 'Amount' && (
                                  <Feather name="check" size={12} color="#0047AB" style={{ marginRight: 4 }} />
                                )}
                                <Text
                                  style={[
                                    styles.discTypeText,
                                    s.discountType === 'Amount' && styles.discTypeTextActive,
                                  ]}
                                >
                                  Amount
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.discTypeBtn,
                                  s.discountType === 'Percentage' && styles.discTypeBtnActive,
                                ]}
                                onPress={() =>
                                  updateProductState(product.product_id, {
                                    discountType: 'Percentage',
                                  })
                                }
                              >
                                <Text
                                  style={[
                                    styles.discTypeText,
                                    s.discountType === 'Percentage' && styles.discTypeTextActive,
                                  ]}
                                >
                                  %
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.formLabel}>Discount</Text>
                            <TextInput
                              style={styles.formInput}
                              keyboardType="numeric"
                              value={s.discount}
                              onChangeText={(val) =>
                                updateProductState(product.product_id, {
                                  discount: val,
                                  selected: true,
                                })
                              }
                              placeholder="Discount"
                            />
                          </View>
                        </View>

                        {/* FMCG BAG SELECTION CONDITION */}
                        {isFmcg && (
                          <View style={{ marginTop: 10 }}>
                            <Text style={styles.formLabel}>Bag</Text>
                            {bags.length === 0 ? (
                              <View style={styles.bagDropdownPlaceholder}>
                                <Text style={styles.bagDropdownText}>No Bag Available</Text>
                                <Feather name="chevron-down" size={16} color="#8A9BB5" />
                              </View>
                            ) : (
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                                <TouchableOpacity
                                  style={[
                                    styles.bagChip,
                                    s.bagSelectValue === 'none' && styles.bagChipActive,
                                  ]}
                                  onPress={() =>
                                    updateProductState(product.product_id, {
                                      bagSelectValue: 'none',
                                      bagValue: 0,
                                    })
                                  }
                                >
                                  <Text
                                    style={[
                                      styles.bagChipText,
                                      s.bagSelectValue === 'none' && styles.bagChipTextActive,
                                    ]}
                                  >
                                    None
                                  </Text>
                                </TouchableOpacity>
                                {bags.map((b) => {
                                  const key = `${b.total_unit}__${b.detail_id}`;
                                  const isSelected = s.bagSelectValue === key;
                                  return (
                                    <TouchableOpacity
                                      key={key}
                                      style={[styles.bagChip, isSelected && styles.bagChipActive]}
                                      onPress={() =>
                                        updateProductState(product.product_id, {
                                          bagSelectValue: key,
                                          bagValue: Number(b.total_unit) || 0,
                                        })
                                      }
                                    >
                                      <Text
                                        style={[
                                          styles.bagChipText,
                                          isSelected && styles.bagChipTextActive,
                                        ]}
                                      >
                                        {b.primary_value} ({b.total_unit} units)
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </ScrollView>
                            )}
                          </View>
                        )}

                        {/* SERIAL NO / IMEI SCAN & MANUAL BUTTONS CONDITION */}
                        {isSerial && (
                          <View style={{ marginTop: 12 }}>
                            <Text style={styles.formLabel}>Add IMEI (s)</Text>
                            <View style={styles.imeiActionsRow}>
                              <TouchableOpacity
                                style={styles.imeiScanBtn}
                                onPress={() => setScannerProductId(product.product_id)}
                                activeOpacity={0.8}
                              >
                                <LinearGradient
                                  colors={['#06B6D4', '#0891B2']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.imeiBtnGradient}
                                >
                                  <MaterialCommunityIcons name="qrcode-scan" size={16} color="#FFFFFF" />
                                  <Text style={styles.imeiBtnText}>Scan</Text>
                                </LinearGradient>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.imeiManualBtn}
                                onPress={() => handleOpenManualImei(product.product_id)}
                                activeOpacity={0.8}
                              >
                                <LinearGradient
                                  colors={['#6366F1', '#4F46E5']}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.imeiBtnGradient}
                                >
                                  <Feather name="edit-2" size={16} color="#FFFFFF" />
                                  <Text style={styles.imeiBtnText}>Manual</Text>
                                </LinearGradient>
                              </TouchableOpacity>
                            </View>

                            {/* LIST OF ADDED IMEIs */}
                            {s.serialNumbers && s.serialNumbers.length > 0 && (
                              <View style={styles.imeiChipsWrap}>
                                {s.serialNumbers.map((sn, idx) => (
                                  <View key={idx} style={styles.imeiChip}>
                                    <Text style={styles.imeiChipText} numberOfLines={1}>
                                      {sn}
                                    </Text>
                                    <TouchableOpacity
                                      onPress={() => handleDeleteImei(product.product_id, sn)}
                                      style={{ marginLeft: 4 }}
                                    >
                                      <Feather name="x" size={13} color="#DC2626" />
                                    </TouchableOpacity>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* 5. BOTTOM BAR (N items, Cancel, Add To Cart) */}
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
          >
            <Text style={styles.bottomItemsCountText}>{selectedCount} items</Text>

            <View style={styles.bottomButtonsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addToCartBtn}
                onPress={handleAddToCart}
                disabled={isSubmitting || selectedCount === 0}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={selectedCount > 0 ? ['#0047AB', '#003380'] : ['#DFE7F2', '#DFE7F2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addToCartGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.addToCartText, selectedCount > 0 ? { color: '#FFFFFF' } : { color: '#8E9CAE' }]}>Add To Cart</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* MANUAL IMEI MODAL (MATCHES SCREENSHOT 1) */}
      <Modal
        visible={manualImeiProductId !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setManualImeiProductId(null)}
      >
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Enter IMEI</Text>
              <TouchableOpacity onPress={() => setManualImeiProductId(null)}>
                <Feather name="x" size={20} color="#0E204E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.dialogSub}>
              Please type the IMEI or serial number below to add it to your selection.
            </Text>

            <TextInput
              style={styles.dialogInput}
              placeholder="e.g. 8493028301"
              placeholderTextColor="#8A9BB5"
              value={manualImeiText}
              onChangeText={setManualImeiText}
              autoFocus
            />

            <View style={styles.dialogButtonsRow}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setManualImeiProductId(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dialogSaveBtn,
                  !manualImeiText.trim() && styles.dialogSaveBtnDisabled,
                ]}
                onPress={handleSaveManualImei}
                disabled={!manualImeiText.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.dialogSaveText}>Add IMEI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CAMERA SCANNER MODAL */}
      <BarcodeScannerModal
        visible={scannerProductId !== null}
        onClose={() => setScannerProductId(null)}
        onScan={handleScanImeiResult}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    flex: 1,
    marginTop: 40,
    backgroundColor: '#F4F8FD',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E204E',
  },
  closeBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  taxPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  taxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  taxPillActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#0047AB',
  },
  taxPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B87',
  },
  taxPillTextActive: {
    color: '#0047AB',
  },
  productsScroll: {
    flex: 1,
    marginTop: 10,
  },
  productsListContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 10,
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#5A6B87',
    fontWeight: '600',
  },
  emptyCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  productCardSelected: {
    borderColor: '#0047AB',
    backgroundColor: '#FAFCFF',
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxTouch: {
    padding: 4,
    marginRight: 10,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  productTitleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stockBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  expandedContent: {
    marginTop: 10,
  },
  innerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  quantityCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    height: 42,
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  counterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  quantityValText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E204E',
  },
  formInput: {
    height: 42,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  discTypeToggleRow: {
    flexDirection: 'row',
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    gap: 4,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  discTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
  },
  discTypeBtnActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0047AB',
  },
  discTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6B87',
  },
  discTypeTextActive: {
    color: '#0047AB',
  },
  bagDropdownPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 42,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
  },
  bagDropdownText: {
    fontSize: 13,
    color: '#0E204E',
    fontWeight: '600',
  },
  bagChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFD',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  bagChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0047AB',
  },
  bagChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6B87',
  },
  bagChipTextActive: {
    color: '#0047AB',
  },
  imeiActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  imeiScanBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imeiManualBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
  },
  imeiBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imeiBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  imeiChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  imeiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  imeiChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
    maxWidth: 160,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    elevation: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bottomItemsCountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
  addToCartBtn: {
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addToCartGradient: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    elevation: 12,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  dialogSub: {
    fontSize: 12,
    color: '#5A6B87',
    marginBottom: 12,
    lineHeight: 16,
  },
  dialogInput: {
    height: 48,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  dialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  dialogCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  dialogCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B87',
  },
  dialogSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0047AB',
  },
  dialogSaveBtnDisabled: {
    backgroundColor: '#DFE7F2',
  },
  dialogSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
