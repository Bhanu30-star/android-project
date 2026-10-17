import React, { useState } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  invoiceService,
  ApiProductItem,
  AddToCartItemPayload,
} from '@/api/invoiceService';
import { BillType, DiscountType, formatIndianCurrency } from '@/features/invoice/calc';
import { Colors, Typography, Shapes, Shadows } from '@/theme/tokens';

interface AddItemsSheetProps {
  visible: boolean;
  onClose: () => void;
  cartBillType: BillType;
  onCartUpdated: () => void;
  searchSource?: string;
}

interface ItemFormState {
  qty: number;
  price: number;
  mrp: number;
  billType: BillType;
  priceType: 'Retailer' | 'Dealer';
  discountType: DiscountType;
  discountValue: number;
  freeScheme: 'Yes' | 'No';
  freeSchemeProduct: number;
  crateQty: number;
  bottleQty: number;
  bagVal: number;
  selectedSerials: string[];
}

export const AddItemsSheet: React.FC<AddItemsSheetProps> = ({
  visible,
  onClose,
  cartBillType,
  onCartUpdated,
  searchSource = 'admin',
}) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formStates, setFormStates] = useState<{ [productId: number]: ItemFormState }>({});
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Infinite query for products
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

  const products: ApiProductItem[] =
    data?.pages.flatMap((page) => page.products) || [];

  const getItemState = (p: ApiProductItem): ItemFormState => {
    if (formStates[p.product_id]) {
      return formStates[p.product_id];
    }
    const defaultPrice =
      cartBillType === 'Exclusive'
        ? p.product_price_exc
        : p.product_price_inc || p.mrp_price;

    return {
      qty: 0,
      price: defaultPrice,
      mrp: p.mrp_price,
      billType: (p.invoice_bill_type as BillType) || cartBillType || 'Inclusive',
      priceType: 'Retailer',
      discountType: 'Amount',
      discountValue: 0,
      freeScheme: 'No',
      freeSchemeProduct: 0,
      crateQty: 0,
      bottleQty: 0,
      bagVal: 0,
      selectedSerials: [],
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
        if (patch.priceType === 'Dealer') {
          updated.price = product.product_dealer_price || current.price;
        } else {
          updated.price =
            updated.billType === 'Exclusive'
              ? product.product_price_exc
              : product.product_price_inc;
        }
      }

      // If billType changes
      if (patch.billType !== undefined) {
        if (updated.priceType === 'Retailer') {
          updated.price =
            patch.billType === 'Exclusive'
              ? product.product_price_exc
              : product.product_price_inc;
        }
      }

      return { ...prev, [productId]: updated };
    });
  };

  const toggleSelect = (productId: number, product: ApiProductItem) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    } else {
      setSelectedProductIds((prev) => [...prev, productId]);
      // If qty is 0, bump to 1
      const current = getItemState(product);
      if (current.qty === 0) {
        updateItemState(productId, { qty: 1 }, product);
      }
      setExpandedId(productId);
    }
  };

  const handleQtyChange = (
    product: ApiProductItem,
    delta: number
  ) => {
    const current = getItemState(product);
    const newQty = Math.max(0, current.qty + delta);

    if (
      product.maintain_inventory === 'Yes' &&
      newQty > product.new_quantity
    ) {
      Alert.alert(
        'Out of Stock',
        `Only ${product.new_quantity} available in stock.`
      );
      return;
    }

    updateItemState(product.product_id, { qty: newQty }, product);

    if (newQty > 0 && !selectedProductIds.includes(product.product_id)) {
      setSelectedProductIds((prev) => [...prev, product.product_id]);
    } else if (newQty === 0 && selectedProductIds.includes(product.product_id)) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== product.product_id));
    }
  };

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (payload: AddToCartItemPayload[]) =>
      invoiceService.addProductsToCart(payload, searchSource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-cart'] });
      onCartUpdated();
      onClose();
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add items to cart');
    },
  });

  const handleSubmitSelected = () => {
    if (selectedProductIds.length === 0) {
      Alert.alert('Selection', 'Please select at least one item');
      return;
    }

    const payloadList: AddToCartItemPayload[] = [];

    for (const id of selectedProductIds) {
      const p = products.find((prod) => prod.product_id === id);
      if (!p) continue;

      const s = getItemState(p);
      if (s.qty <= 0) {
        Alert.alert('Validation', `${p.product_name}: Quantity must be greater than 0`);
        return;
      }
      if (s.price <= 0) {
        Alert.alert('Validation', `${p.product_name}: Price must be greater than 0`);
        return;
      }

      payloadList.push({
        product_id: p.product_id,
        quantity: s.qty,
        price: s.price,
        disc_type: s.discountType,
        discount: s.discountValue,
        bill_type: s.billType,
        dis_ser_config: 'Standard',
        bag_val: s.bagVal,
        free_qty: 0,
        free_scheme: s.freeScheme,
        free_scheme_product: s.freeSchemeProduct,
        crate_val: s.crateQty,
        bottle_val: s.bottleQty,
        price_mrpval: s.mrp,
        imei_list: s.selectedSerials,
      });
    }

    addToCartMutation.mutate(payloadList);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add Items</Text>
              <Text style={styles.subtitle}>Select products to add to invoice</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
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
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
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

                return (
                  <View style={[styles.productCard, isSelected && styles.productCardSelected]}>
                    <TouchableOpacity
                      style={styles.productHeaderRow}
                      onPress={() => setExpandedId(isExpanded ? null : item.product_id)}
                      activeOpacity={0.7}
                    >
                      <TouchableOpacity
                        style={[styles.checkbox, isSelected && styles.checkboxActive]}
                        onPress={() => toggleSelect(item.product_id, item)}
                      >
                        {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
                      </TouchableOpacity>

                      <View style={styles.productDetails}>
                        <Text style={styles.productName} numberOfLines={1}>
                          {item.product_name}
                        </Text>
                        <View style={styles.productSubRow}>
                          <Text style={styles.priceText}>
                            {formatIndianCurrency(state.price)}
                          </Text>
                          <Text style={styles.mrpText}>
                            MRP: {formatIndianCurrency(item.mrp_price)}
                          </Text>
                          <View
                            style={[
                              styles.stockChip,
                              item.new_quantity > 0
                                ? styles.stockChipIn
                                : styles.stockChipOut,
                            ]}
                          >
                            <Text
                              style={[
                                styles.stockChipText,
                                item.new_quantity > 0
                                  ? styles.stockChipTextIn
                                  : styles.stockChipTextOut,
                              ]}
                            >
                              {item.new_quantity > 0
                                ? `Stock: ${item.new_quantity}`
                                : 'Out of Stock'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Quantity Stepper */}
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleQtyChange(item, -1)}
                          disabled={state.qty === 0}
                        >
                          <Feather
                            name="minus"
                            size={14}
                            color={state.qty === 0 ? Colors.textSecondary : Colors.text}
                          />
                        </TouchableOpacity>
                        <Text style={styles.stepperVal}>{state.qty}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleQtyChange(item, 1)}
                        >
                          <Feather name="plus" size={14} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Expandable Configuration */}
                    {isExpanded && (
                      <View style={styles.expandedSection}>
                        <View style={styles.inputRow}>
                          {/* Price input */}
                          <View style={styles.halfCol}>
                            <Text style={styles.subLabel}>Price (₹)</Text>
                            <TextInput
                              style={styles.inputMini}
                              keyboardType="numeric"
                              value={String(state.price)}
                              onChangeText={(val) =>
                                updateItemState(
                                  item.product_id,
                                  { price: parseFloat(val) || 0 },
                                  item
                                )
                              }
                            />
                          </View>

                          {/* Price Type */}
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

                        <View style={styles.inputRow}>
                          {/* Bill Type */}
                          <View style={styles.halfCol}>
                            <Text style={styles.subLabel}>Bill Type</Text>
                            <View style={styles.segmentRow}>
                              <TouchableOpacity
                                style={[
                                  styles.segmentBtn,
                                  state.billType === 'Inclusive' && styles.segmentBtnActive,
                                ]}
                                onPress={() =>
                                  updateItemState(
                                    item.product_id,
                                    { billType: 'Inclusive' },
                                    item
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.segmentText,
                                    state.billType === 'Inclusive' && styles.segmentTextActive,
                                  ]}
                                >
                                  Incl.
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.segmentBtn,
                                  state.billType === 'Exclusive' && styles.segmentBtnActive,
                                ]}
                                onPress={() =>
                                  updateItemState(
                                    item.product_id,
                                    { billType: 'Exclusive' },
                                    item
                                  )
                                }
                              >
                                <Text
                                  style={[
                                    styles.segmentText,
                                    state.billType === 'Exclusive' && styles.segmentTextActive,
                                  ]}
                                >
                                  Excl.
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Discount */}
                          <View style={styles.halfCol}>
                            <Text style={styles.subLabel}>Discount</Text>
                            <View style={styles.discountInputGroup}>
                              <TextInput
                                style={styles.discountInput}
                                keyboardType="numeric"
                                placeholder="0"
                                value={state.discountValue ? String(state.discountValue) : ''}
                                onChangeText={(val) =>
                                  updateItemState(
                                    item.product_id,
                                    { discountValue: parseFloat(val) || 0 },
                                    item
                                  )
                                }
                              />
                              <TouchableOpacity
                                style={styles.discountTypeToggle}
                                onPress={() =>
                                  updateItemState(
                                    item.product_id,
                                    {
                                      discountType:
                                        state.discountType === 'Amount' ? 'Percent' : 'Amount',
                                    },
                                    item
                                  )
                                }
                              >
                                <Text style={styles.discountTypeLabel}>
                                  {state.discountType === 'Amount' ? '₹' : '%'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
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
                ) : null
              }
            />
          )}

          {/* Sticky Bottom Bar */}
          <View style={styles.bottomBar}>
            <View>
              <Text style={styles.selectedCount}>
                {selectedProductIds.length} items selected
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                selectedProductIds.length === 0 && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmitSelected}
              disabled={selectedProductIds.length === 0 || addToCartMutation.isPending}
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
    height: '90%',
    ...Shadows.card,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tabBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusLarge,
    paddingHorizontal: 14,
    height: 46,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Shapes.radiusMedium,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
    ...Shadows.card,
  },
  productCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FAFAFF',
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.tabBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  productDetails: {
    flex: 1,
    paddingRight: 8,
  },
  productName: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  productSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  priceText: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  mrpText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  stockChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockChipIn: {
    backgroundColor: '#DDF5E9',
  },
  stockChipOut: {
    backgroundColor: '#FFE3E3',
  },
  stockChipText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 10,
    fontWeight: '700',
  },
  stockChipTextIn: {
    color: '#0B7A4D',
  },
  stockChipTextOut: {
    color: '#B01E25',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusMedium,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
    height: 36,
  },
  stepperBtn: {
    width: 32,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperVal: {
    minWidth: 24,
    textAlign: 'center',
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  expandedSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  halfCol: {
    flex: 1,
  },
  subLabel: {
    fontFamily: Typography.statLabel.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputMini: {
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusSmall,
    height: 38,
    paddingHorizontal: 10,
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusSmall,
    padding: 2,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  segmentBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: Colors.card,
    ...Shadows.card,
  },
  segmentText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: Colors.primaryDeep,
    fontWeight: '800',
  },
  discountInputGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusSmall,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
    height: 38,
    alignItems: 'center',
  },
  discountInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  discountTypeToggle: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: Colors.tabBorder,
  },
  discountTypeLabel: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.card,
  },
  selectedCount: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  cancelText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    height: 48,
    borderRadius: Shapes.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
