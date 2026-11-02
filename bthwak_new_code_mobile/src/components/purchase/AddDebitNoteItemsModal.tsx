import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  DebitNoteProductItem,
  AddDebitNoteItemPayload,
  fetchDebitNoteProductsApi,
  addDebitNoteItemsToCartApi,
} from '@/api/debitNote';

interface AddDebitNoteItemsModalProps {
  visible: boolean;
  onClose: () => void;
  partyId: number;
  partyPlaceOfSupply: string;
  financialYear: string;
  onSuccess: () => void;
}

interface ProductFormState {
  selected: boolean;
  quantity: number;
  price: string;
  discount_type: 'Amount' | 'Percentage';
  discount_val: string;
  bill_type: 'Inclusive' | 'Exclusive';
  bag_value: number;
  selectedImeis: string[];
}

export const AddDebitNoteItemsModal: React.FC<AddDebitNoteItemsModalProps> = ({
  visible,
  onClose,
  partyId,
  partyPlaceOfSupply,
  financialYear,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<DebitNoteProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-product state map
  const [formState, setFormState] = useState<Record<number, ProductFormState>>({});

  // Active Serial / IMEI picker product
  const [activeSerialProduct, setActiveSerialProduct] = useState<DebitNoteProductItem | null>(null);
  const [customImeiText, setCustomImeiText] = useState('');

  // Load products when visible
  useEffect(() => {
    if (!visible || !partyId) return;
    loadProducts();
  }, [visible, partyId, financialYear]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetchDebitNoteProductsApi({
        party_id: partyId,
        financial_year: financialYear,
        search: search.trim(),
        last_product_id: 0,
        return_rows: 50,
      });

      const items = res.items || [];
      setProducts(items);

      // Initialize form state
      setFormState((prev) => {
        const next = { ...prev };
        items.forEach((p) => {
          if (!next[p.product_id]) {
            const price = p.invoice_bill_type === 'Exclusive' ? p.purchase_price_exc : p.purchase_price;
            next[p.product_id] = {
              selected: false,
              quantity: 1,
              price: String(price || 0),
              discount_type: 'Amount',
              discount_val: '0',
              bill_type: p.invoice_bill_type || 'Inclusive',
              bag_value: p.primary_bag_val || 0,
              selectedImeis: [],
            };
          }
        });
        return next;
      });
    } catch (err: any) {
      console.warn('Failed to load debit note products', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter((p) => p.product_name.toLowerCase().includes(q));
  }, [products, search]);

  const updateState = (id: number, patch: Partial<ProductFormState>) => {
    setFormState((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {
          selected: false,
          quantity: 1,
          price: '0',
          discount_type: 'Amount',
          discount_val: '0',
          bill_type: 'Inclusive',
          bag_value: 0,
          selectedImeis: [],
        }),
        ...patch,
      },
    }));
  };

  const handleToggleSelect = (productId: number) => {
    const cur = formState[productId];
    const nextSelected = !cur?.selected;
    updateState(productId, {
      selected: nextSelected,
      quantity: nextSelected ? Math.max(1, cur?.quantity || 1) : cur?.quantity || 1,
    });
  };

  const handleUpdateQty = (productId: number, delta: number, maxStock: number) => {
    const cur = formState[productId];
    const nextQty = Math.max(1, (cur?.quantity || 1) + delta);
    if (maxStock > 0 && nextQty > maxStock) {
      Alert.alert('Stock limit', `Only ${maxStock} units available in stock.`);
      return;
    }
    updateState(productId, {
      quantity: nextQty,
      selected: true, // Auto-select when qty adjusted
    });
  };

  const handleToggleImei = (productId: number, imei: string, maxStock: number) => {
    const cur = formState[productId];
    if (!cur) return;
    const exists = cur.selectedImeis.includes(imei);
    let updated: string[];
    if (exists) {
      updated = cur.selectedImeis.filter((i) => i !== imei);
    } else {
      if (maxStock > 0 && cur.selectedImeis.length >= maxStock) {
        Alert.alert('Stock limit', `Cannot exceed available stock (${maxStock}).`);
        return;
      }
      updated = [...cur.selectedImeis, imei];
    }
    updateState(productId, {
      selectedImeis: updated,
      quantity: updated.length,
      selected: updated.length > 0,
    });
  };

  const handleSelectAllImeis = (productId: number, allImeis: string[], maxStock: number) => {
    const cur = formState[productId];
    if (!cur) return;
    const isAll = cur.selectedImeis.length >= allImeis.length;
    let next: string[] = [];
    if (!isAll) {
      next = maxStock > 0 ? allImeis.slice(0, maxStock) : allImeis;
    }
    updateState(productId, {
      selectedImeis: next,
      quantity: next.length,
      selected: next.length > 0,
    });
  };

  const handleAddManualImei = (productId: number, maxStock: number) => {
    const trimmed = customImeiText.trim();
    if (!trimmed) return;
    const cur = formState[productId];
    if (cur?.selectedImeis.includes(trimmed)) {
      Alert.alert('Duplicate IMEI', 'This IMEI is already in the list.');
      return;
    }
    if (maxStock > 0 && (cur?.selectedImeis.length || 0) >= maxStock) {
      Alert.alert('Stock limit', `Cannot exceed available stock (${maxStock}).`);
      return;
    }
    const next = [...(cur?.selectedImeis || []), trimmed];
    updateState(productId, {
      selectedImeis: next,
      quantity: next.length,
      selected: true,
    });
    setCustomImeiText('');
  };

  // Count selected items
  const selectedCount = useMemo(() => {
    return Object.values(formState).filter((s) => s.selected).length;
  }, [formState]);

  // Submit to backend cart
  const handleAddSelectedToCart = async () => {
    const itemsToSubmit: AddDebitNoteItemPayload[] = [];

    for (const p of products) {
      const s = formState[p.product_id];
      if (!s || !s.selected) continue;

      const price = parseFloat(s.price) || 0;
      if (price <= 0) {
        Alert.alert('Invalid Price', `Please enter a valid price for "${p.product_name}".`);
        return;
      }

      if (p.product_type === 'Serial No') {
        if (!s.selectedImeis.length) {
          Alert.alert('Missing IMEI', `Please select at least one IMEI for "${p.product_name}".`);
          return;
        }
      } else {
        if (s.quantity <= 0) {
          Alert.alert('Invalid Quantity', `Please enter a valid quantity for "${p.product_name}".`);
          return;
        }
      }

      const discVal = parseFloat(s.discount_val) || 0;

      itemsToSubmit.push({
        product_id: p.product_id,
        quantity: p.product_type === 'Serial No' && s.selectedImeis.length > 0 ? 0 : s.quantity,
        price,
        party_id: partyId,
        party_place_of_supply: partyPlaceOfSupply,
        discount_type: s.discount_type,
        discount_val: discVal,
        bill_type: s.bill_type,
        product_type: p.product_type,
        bag_value: p.product_type === 'FMCG' ? s.bag_value : 0,
        dis_ser_config: p.product_type === 'Serial No' ? p.serialno_configuration || '' : '',
        imei: p.product_type === 'Serial No' ? s.selectedImeis : [],
      });
    }

    if (!itemsToSubmit.length) {
      Alert.alert('No Selection', 'Please select at least one item.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDebitNoteItemsToCartApi(itemsToSubmit);
      Alert.alert('Success', 'Items added to Debit Note cart!');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add items to cart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Normalized active IMEIs for modal
  const normalizedActiveImeis = useMemo(() => {
    if (!activeSerialProduct || !activeSerialProduct.serial_no_list) return [];
    return activeSerialProduct.serial_no_list
      .map((entry) => (typeof entry === 'string' ? entry : entry.IMEI))
      .filter(Boolean);
  }, [activeSerialProduct]);

  const allCombinedImeis = useMemo(() => {
    if (!activeSerialProduct) return [];
    const selected = formState[activeSerialProduct.product_id]?.selectedImeis || [];
    const set = new Set([...normalizedActiveImeis, ...selected]);
    return Array.from(set);
  }, [activeSerialProduct, normalizedActiveImeis, formState]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Add Items to Debit Note</Text>
              <Text style={styles.headerSubtitle}>Select return stock products</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Feather name="x" size={20} color="#0E204E" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Feather name="search" size={17} color="#5A6B87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products by name..."
              placeholderTextColor="#8E9CAE"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={loadProducts}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={15} color="#8E9CAE" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Product List */}
        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#0047AB" />
            <Text style={styles.loadingText}>Fetching available stock items...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => String(item.product_id)}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, 16) + 80 },
            ]}
            renderItem={({ item }) => {
              const s = formState[item.product_id] || {
                selected: false,
                quantity: 1,
                price: String(item.purchase_price || 0),
                discount_type: 'Amount',
                discount_val: '0',
                bill_type: 'Inclusive',
                bag_value: 0,
                selectedImeis: [],
              };
              const isSerial = item.product_type === 'Serial No';
              const isFMCG = item.product_type === 'FMCG';
              const maxStock = Math.max(0, Number(item.new_quantity) || 0);

              return (
                <View style={[styles.productCard, s.selected && styles.productCardSelected]}>
                  {/* Card Header Row */}
                  <TouchableOpacity
                    style={styles.cardHeaderRow}
                    onPress={() => {
                      if (isSerial && s.selectedImeis.length === 0) {
                        setActiveSerialProduct(item);
                      } else {
                        handleToggleSelect(item.product_id);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkboxTouch}>
                      <View style={[styles.checkbox, s.selected && styles.checkboxActive]}>
                        {s.selected && <Feather name="check" size={14} color="#FFFFFF" />}
                      </View>
                    </View>

                    <View style={styles.cardTitleInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {item.product_name}
                      </Text>
                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.typeBadge,
                            isFMCG ? styles.typeBadgeFmcg : styles.typeBadgeSerial,
                          ]}
                        >
                          <Text style={styles.typeBadgeText}>{item.product_type}</Text>
                        </View>
                        <Text style={styles.stockLabel}>Stock: {maxStock}</Text>
                      </View>
                    </View>

                    <View style={styles.priceContainer}>
                      <Text style={styles.priceMetaLabel}>PRICE</Text>
                      <Text style={styles.priceValue}>
                        ₹{item.purchase_price || item.purchase_price_exc || 0}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Config Row (Quantity, Unit Price) */}
                  <View style={styles.cardDetailsBox}>
                    <View style={styles.fieldsGrid}>
                      {/* Quantity Col */}
                      {isSerial ? (
                        <View style={styles.fieldItem}>
                          <Text style={styles.fieldLabel}>
                            Selected Units <Text style={styles.requiredStar}>*</Text>
                          </Text>
                          <TouchableOpacity
                            style={styles.imeiCountBox}
                            onPress={() => setActiveSerialProduct(item)}
                            activeOpacity={0.8}
                          >
                            <Feather name="cpu" size={14} color="#0047AB" />
                            <Text style={styles.imeiCountText}>
                              {s.selectedImeis.length} Unit{s.selectedImeis.length !== 1 ? 's' : ''}
                            </Text>
                            <Feather name="chevron-right" size={14} color="#5A6B87" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.fieldItem}>
                          <Text style={styles.fieldLabel}>
                            Quantity <Text style={styles.requiredStar}>*</Text>
                          </Text>
                          <View style={styles.stepperBox}>
                            <TouchableOpacity
                              style={styles.stepperBtn}
                              onPress={() => handleUpdateQty(item.product_id, -1, maxStock)}
                            >
                              <Feather name="minus" size={14} color="#0E204E" />
                            </TouchableOpacity>
                            <Text style={styles.stepperVal}>{s.quantity}</Text>
                            <TouchableOpacity
                              style={[styles.stepperBtn, styles.stepperBtnPlus]}
                              onPress={() => handleUpdateQty(item.product_id, 1, maxStock)}
                            >
                              <Feather name="plus" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* Unit Price Field */}
                      <View style={styles.fieldItem}>
                        <Text style={styles.fieldLabel}>
                          Unit Price <Text style={styles.requiredStar}>*</Text>
                        </Text>
                        <TextInput
                          style={styles.unitPriceInput}
                          keyboardType="numeric"
                          value={s.price}
                          onChangeText={(txt) => updateState(item.product_id, { price: txt })}
                          placeholder="0.00"
                          placeholderTextColor="#8E9CAE"
                        />
                      </View>
                    </View>

                    {/* Serial No Selection Button */}
                    {isSerial && (
                      <View style={styles.extraRow}>
                        <TouchableOpacity
                          style={styles.serialSelectBtn}
                          onPress={() => setActiveSerialProduct(item)}
                          activeOpacity={0.8}
                        >
                          <Feather name="list" size={15} color="#0047AB" />
                          <Text style={styles.serialSelectBtnText} numberOfLines={1}>
                            {s.selectedImeis.length > 0
                              ? `IMEI: ${s.selectedImeis.join(', ')}`
                              : 'Select Serial / IMEI numbers'}
                          </Text>
                          <Feather name="chevron-right" size={15} color="#5A6B87" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Feather name="package" size={40} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Stock Items Found</Text>
                <Text style={styles.emptySub}>
                  No returnable stock products found for this party.
                </Text>
              </View>
            }
          />
        )}

        {/* Floating Bottom Button */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[
              styles.addBtn,
              (selectedCount === 0 || isSubmitting) && styles.addBtnDisabled,
            ]}
            onPress={handleAddSelectedToCart}
            disabled={selectedCount === 0 || isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addBtnText}>
                Add to Cart {selectedCount > 0 ? `(${selectedCount})` : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Serial/IMEI Picker Modal */}
        {activeSerialProduct && (
          <Modal
            visible={!!activeSerialProduct}
            transparent
            animationType="fade"
            onRequestClose={() => {
              setActiveSerialProduct(null);
              setCustomImeiText('');
            }}
          >
            <View style={styles.modalBackdrop}>
              <TouchableOpacity
                style={styles.overlayTouch}
                activeOpacity={1}
                onPress={() => {
                  setActiveSerialProduct(null);
                  setCustomImeiText('');
                }}
              />
              <View style={[styles.selectSheetCard, { maxHeight: '82%' }]}>
                {/* Header */}
                <View style={styles.imeiModalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectSheetTitle}>Select Serial / IMEI</Text>
                    <Text style={styles.imeiModalSubtitle} numberOfLines={1}>
                      {activeSerialProduct.product_name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.imeiCloseIcon}
                    onPress={() => {
                      setActiveSerialProduct(null);
                      setCustomImeiText('');
                    }}
                  >
                    <Feather name="x" size={18} color="#0E204E" />
                  </TouchableOpacity>
                </View>

                {/* Quick bar: Count + Select/Clear All */}
                {normalizedActiveImeis.length > 0 && (
                  <View style={styles.imeiQuickBar}>
                    <Text style={styles.imeiSelectedCounter}>
                      Selected: {(formState[activeSerialProduct.product_id]?.selectedImeis || []).length} / {normalizedActiveImeis.length}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleSelectAllImeis(
                          activeSerialProduct.product_id,
                          normalizedActiveImeis,
                          Math.max(0, Number(activeSerialProduct.new_quantity) || 0)
                        )
                      }
                      style={styles.selectAllBtn}
                    >
                      <Text style={styles.selectAllBtnText}>
                        {(formState[activeSerialProduct.product_id]?.selectedImeis || []).length >=
                        normalizedActiveImeis.length
                          ? 'Clear All'
                          : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Manual IMEI Input */}
                <View style={styles.manualImeiRow}>
                  <TextInput
                    style={styles.manualImeiInput}
                    placeholder="Enter IMEI manually..."
                    placeholderTextColor="#8E9CAE"
                    value={customImeiText}
                    onChangeText={setCustomImeiText}
                    onSubmitEditing={() =>
                      handleAddManualImei(
                        activeSerialProduct.product_id,
                        Math.max(0, Number(activeSerialProduct.new_quantity) || 0)
                      )
                    }
                  />
                  <TouchableOpacity
                    style={[
                      styles.manualAddBtn,
                      !customImeiText.trim() && styles.manualAddBtnDisabled,
                    ]}
                    onPress={() =>
                      handleAddManualImei(
                        activeSerialProduct.product_id,
                        Math.max(0, Number(activeSerialProduct.new_quantity) || 0)
                      )
                    }
                    disabled={!customImeiText.trim()}
                  >
                    <Text style={styles.manualAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {/* IMEI List */}
                <FlatList
                  data={allCombinedImeis}
                  keyExtractor={(imei, index) => `${imei}_${index}`}
                  style={{ maxHeight: 260 }}
                  renderItem={({ item: imei }) => {
                    const isSelected = (
                      formState[activeSerialProduct.product_id]?.selectedImeis || []
                    ).includes(imei);
                    return (
                      <TouchableOpacity
                        style={[styles.selectOption, isSelected && styles.selectOptionActive]}
                        onPress={() =>
                          handleToggleImei(
                            activeSerialProduct.product_id,
                            imei,
                            Math.max(0, Number(activeSerialProduct.new_quantity) || 0)
                          )
                        }
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxActive,
                              { width: 18, height: 18, borderRadius: 4 },
                            ]}
                          >
                            {isSelected && <Feather name="check" size={12} color="#FFFFFF" />}
                          </View>
                          <Text
                            style={[
                              styles.selectOptionText,
                              isSelected && styles.selectOptionTextActive,
                            ]}
                          >
                            {imei}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#5A6B87', fontSize: 13 }}>
                        No IMEI numbers available. Enter IMEI manually above.
                      </Text>
                    </View>
                  }
                />

                <TouchableOpacity
                  style={styles.doneBtn}
                  onPress={() => {
                    setActiveSerialProduct(null);
                    setCustomImeiText('');
                  }}
                >
                  <Text style={styles.doneBtnText}>
                    Done ({(formState[activeSerialProduct.product_id]?.selectedImeis || []).length} Selected)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 14,
    gap: 12,
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxTouch: {
    paddingTop: 2,
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
  cardTitleInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  typeBadgeFmcg: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  typeBadgeSerial: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
  },
  stockLabel: {
    fontSize: 12,
    color: '#5A6B87',
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5A6B87',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0047AB',
    marginTop: 2,
  },
  cardDetailsBox: {
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  fieldsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldItem: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E204E',
  },
  requiredStar: {
    color: '#DC2626',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    height: 42,
    paddingHorizontal: 6,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnPlus: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  stepperVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
  },
  unitPriceInput: {
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    height: 42,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  imeiCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    height: 42,
    paddingHorizontal: 12,
  },
  imeiCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  extraRow: {
    marginTop: 4,
  },
  serialSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    gap: 8,
  },
  serialSelectBtnText: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  addBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#5A6B87',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0E204E',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  overlayTouch: {
    ...StyleSheet.absoluteFill,
  },
  selectSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 6,
    elevation: 12,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  selectSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
  },
  imeiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  imeiModalSubtitle: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  imeiCloseIcon: {
    padding: 6,
  },
  imeiQuickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  imeiSelectedCounter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  selectAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  selectAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  manualImeiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  manualImeiInput: {
    flex: 1,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0E204E',
  },
  manualAddBtn: {
    backgroundColor: '#0047AB',
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualAddBtnDisabled: {
    opacity: 0.5,
  },
  manualAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0E204E',
  },
  selectOptionTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#0047AB',
    borderRadius: 10,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
