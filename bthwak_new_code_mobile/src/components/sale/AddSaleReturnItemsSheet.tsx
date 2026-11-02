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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SaleReturnCatalogProduct,
  SaleReturnCartItemPayload,
  fetchSaleReturnItemsApi,
  addSaleReturnCartApi,
} from '@/api/saleReturn';

interface AddSaleReturnItemsSheetProps {
  visible: boolean;
  onClose: () => void;
  partyId: number;
  financialYear: string;
  cartBillType?: 'Inclusive' | 'Exclusive' | string;
  onCartUpdated: () => void;
}

interface ProductItemState {
  selected: boolean;
  qty: number;
  price: number;
  billType: 'Inclusive' | 'Exclusive';
  bagValue: string; // '0' = No Bag, otherwise 'detailId__totalUnit'
}

export const AddSaleReturnItemsSheet: React.FC<AddSaleReturnItemsSheetProps> = ({
  visible,
  onClose,
  partyId,
  financialYear,
  cartBillType = 'Inclusive',
  onCartUpdated,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [taxMode, setTaxMode] = useState<'Inclusive' | 'Exclusive'>(
    cartBillType === 'Exclusive' ? 'Exclusive' : 'Inclusive'
  );
  const [products, setProducts] = useState<SaleReturnCatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemStates, setItemStates] = useState<Record<number, ProductItemState>>({});

  useEffect(() => {
    if (visible && partyId) {
      loadProducts(search);
    } else {
      setProducts([]);
      setItemStates({});
      setSearch('');
    }
  }, [visible, partyId, financialYear]);

  const loadProducts = async (searchTerm: string) => {
    try {
      setIsLoading(true);
      const res = await fetchSaleReturnItemsApi({
        party_id: partyId,
        financial_year: financialYear,
        search: searchTerm,
        last_product_id: 0,
        return_rows: 50,
      });
      setProducts(res.items || []);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
  };

  // Trigger search on submit or debounce
  useEffect(() => {
    if (!visible || !partyId) return;
    const timer = setTimeout(() => {
      loadProducts(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const getProductState = (p: SaleReturnCatalogProduct): ProductItemState => {
    if (itemStates[p.product_id]) {
      return itemStates[p.product_id];
    }
    const basePrice = taxMode === 'Exclusive' ? p.product_price_exc : p.product_price_inc;
    return {
      selected: false,
      qty: 0,
      price: basePrice || 0,
      billType: taxMode,
      bagValue: '0',
    };
  };

  const updateProductState = (p: SaleReturnCatalogProduct, patch: Partial<ProductItemState>) => {
    setItemStates((prev) => {
      const current = prev[p.product_id] || getProductState(p);
      return {
        ...prev,
        [p.product_id]: { ...current, ...patch },
      };
    });
  };

  const handleTaxModeChange = (mode: 'Inclusive' | 'Exclusive') => {
    setTaxMode(mode);
    // update prices for non-bag items
    setItemStates((prev) => {
      const updated: Record<number, ProductItemState> = {};
      Object.keys(prev).forEach((idStr) => {
        const id = Number(idStr);
        const p = products.find((prod) => prod.product_id === id);
        if (p) {
          const price = mode === 'Exclusive' ? p.product_price_exc : p.product_price_inc;
          updated[id] = { ...prev[id], billType: mode, price: price || 0 };
        } else {
          updated[id] = { ...prev[id], billType: mode };
        }
      });
      return updated;
    });
  };

  const toggleSelect = (p: SaleReturnCatalogProduct) => {
    const s = getProductState(p);
    const newSelected = !s.selected;
    const newQty = newSelected ? (s.qty > 0 ? s.qty : 1) : 0;
    updateProductState(p, { selected: newSelected, qty: newQty });
  };

  const changeQty = (p: SaleReturnCatalogProduct, delta: number) => {
    const s = getProductState(p);
    const nextQty = Math.max(0, s.qty + delta);
    updateProductState(p, {
      qty: nextQty,
      selected: nextQty > 0,
    });
  };

  const changePrice = (p: SaleReturnCatalogProduct, priceStr: string) => {
    const num = parseFloat(priceStr) || 0;
    updateProductState(p, { price: num });
  };

  const selectedCount = useMemo(() => {
    return Object.values(itemStates).filter((s) => s.selected && s.qty > 0).length;
  }, [itemStates]);

  const handleSubmit = async () => {
    const itemsToAdd: SaleReturnCartItemPayload[] = [];

    for (const p of products) {
      const s = itemStates[p.product_id];
      if (s && s.selected && s.qty > 0) {
        if (s.price <= 0) {
          Alert.alert('Validation Error', `${p.product_name}: Price must be greater than 0.`);
          return;
        }

        itemsToAdd.push({
          product_id: p.product_id,
          product_type: p.product_type,
          party_id: partyId,
          price: String(s.price),
          quantity: s.qty,
          bag_val: 0,
          bill_type: s.billType || taxMode,
          discount_type: 'Amount',
          discount_val: 0,
          free_scheme: '',
          free_scheme_product: 0,
          imei: [],
        });
      }
    }

    if (itemsToAdd.length === 0) {
      Alert.alert('No Items', 'Please select at least one product with quantity > 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addSaleReturnCartApi({ items: itemsToAdd });
      onCartUpdated();
      onClose();
    } catch (err: any) {
      Alert.alert('Failed to Add', err?.message || 'Could not add items to return cart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProductItem = ({ item }: { item: SaleReturnCatalogProduct }) => {
    const state = getProductState(item);
    const isSelected = state.selected;
    const isOutOfStock = item.new_quantity <= 0;

    return (
      <View style={[styles.productCard, isSelected && styles.productCardSelected]}>
        <View style={styles.cardHeaderRow}>
          <TouchableOpacity
            style={styles.checkboxTouchable}
            onPress={() => toggleSelect(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
              {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.productNameText} numberOfLines={1}>
                {item.product_name}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.badgesRow}>
          <View
            style={[
              styles.typeBadge,
              item.product_type === 'FMCG' ? styles.badgeFmcg : styles.badgeService,
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                item.product_type === 'FMCG' ? styles.badgeFmcgText : styles.badgeServiceText,
              ]}
            >
              {item.product_type}
            </Text>
          </View>

          <View style={styles.stockBadge}>
            <Text style={styles.stockBadgeText}>Stock: {item.new_quantity ?? 0}</Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.configContainer}>
            <View style={styles.configRow}>
              {/* Price field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={state.price ? String(state.price) : ''}
                  placeholder="0.0"
                  placeholderTextColor="#64748B"
                  onChangeText={(val) => changePrice(item, val)}
                />
              </View>

              {/* Quantity Stepper */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Qty</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => changeQty(item, -1)}
                    activeOpacity={0.7}
                  >
                    <Feather name="minus" size={16} color="#0E204E" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.stepperInput}
                    keyboardType="numeric"
                    value={String(state.qty)}
                    onChangeText={(v) => {
                      const num = parseInt(v, 10) || 0;
                      updateProductState(item, { qty: num, selected: num > 0 });
                    }}
                  />
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => changeQty(item, 1)}
                    activeOpacity={0.7}
                  >
                    <Feather name="plus" size={16} color="#0E204E" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Total line */}
              <View style={[styles.inputGroup, { alignItems: 'flex-end', flex: 0.8 }]}>
                <Text style={styles.inputLabel}>Total</Text>
                <Text style={styles.itemTotalText}>
                  ₹{(state.qty * state.price).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Add Items</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="x" size={22} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={16} color="#5A6B87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Product"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x-circle" size={16} color="#5A6B87" />
              </TouchableOpacity>
            )}
          </View>

          {/* Tax Pills: Inclusive / Exclusive */}
          <View style={styles.taxPillsContainer}>
            <TouchableOpacity
              style={[
                styles.taxPill,
                taxMode === 'Inclusive' && styles.taxPillActive,
              ]}
              onPress={() => handleTaxModeChange('Inclusive')}
              activeOpacity={0.7}
            >
              {taxMode === 'Inclusive' && (
                <Feather name="check" size={14} color="#0047AB" style={{ marginRight: 4 }} />
              )}
              <Text
                style={[
                  styles.taxPillText,
                  taxMode === 'Inclusive' && styles.taxPillTextActive,
                ]}
              >
                Inclusive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.taxPill,
                taxMode === 'Exclusive' && styles.taxPillActive,
              ]}
              onPress={() => handleTaxModeChange('Exclusive')}
              activeOpacity={0.7}
            >
              {taxMode === 'Exclusive' && (
                <Feather name="check" size={14} color="#0047AB" style={{ marginRight: 4 }} />
              )}
              <Text
                style={[
                  styles.taxPillText,
                  taxMode === 'Exclusive' && styles.taxPillTextActive,
                ]}
              >
                Exclusive
              </Text>
            </TouchableOpacity>
          </View>

          {/* Product List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loadingText}>Fetching products...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="cube-outline" size={44} color="#5A6B87" />
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubText}>Try searching with a different keyword</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => String(item.product_id)}
              renderItem={renderProductItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Bottom Summary & Actions */}
          <View style={styles.bottomBar}>
            <Text style={styles.bottomItemsCount}>
              {selectedCount} item{selectedCount === 1 ? '' : 's'}
            </Text>

            <View style={styles.bottomBtnsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  selectedCount === 0 && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={selectedCount === 0 || isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#DFE7F2',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E204E',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
  },
  taxPillsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  taxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  taxPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  taxPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  taxPillTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#5A6B87',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
  },
  emptySubText: {
    fontSize: 13,
    color: '#5A6B87',
    marginTop: 4,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 14,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  productCardSelected: {
    borderColor: '#0047AB',
    backgroundColor: '#F8FAFD',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  nameContainer: {
    flex: 1,
  },
  productNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginLeft: 34,
  },
  typeBadge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeFmcg: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeFmcgText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeService: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeServiceText: {
    color: '#0047AB',
    fontSize: 11,
    fontWeight: '700',
  },
  stockBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  stockBadgeText: {
    color: '#0047AB',
    fontSize: 11,
    fontWeight: '700',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  configContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#0E204E',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 8,
    height: 38,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 32,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  stepperInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
    paddingHorizontal: 4,
  },
  itemTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
    elevation: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  bottomItemsCount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
  },
  bottomBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B87',
  },
  submitBtn: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 10,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
