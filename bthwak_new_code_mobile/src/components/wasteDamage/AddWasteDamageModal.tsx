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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  WasteDamageProductItem,
  WasteDamageCartItem,
  fetchWasteDamageProductsApi,
} from '@/api/wasteDamage';

interface AddWasteDamageModalProps {
  visible: boolean;
  onClose: () => void;
  onAddItems: (items: WasteDamageCartItem[]) => void;
  existingCartProductIds: number[];
}

interface InlineProductConfig {
  selected: boolean;
  quantity: number;
  unitPrice: string;
  selectedBagType: string | null;
  selectedBagUnit: number;
  selectedImeis: string[];
}

export const AddWasteDamageModal: React.FC<AddWasteDamageModalProps> = ({
  visible,
  onClose,
  onAddItems,
  existingCartProductIds,
}) => {
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'FMCG' | 'Serial No'>('All');
  const [products, setProducts] = useState<WasteDamageProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Per-product selection and configuration map
  const [configs, setConfigs] = useState<Record<number, InlineProductConfig>>({});

  // Active bag selection modal
  const [activeBagProduct, setActiveBagProduct] = useState<WasteDamageProductItem | null>(null);

  // Active serial/IMEI modal
  const [activeSerialProduct, setActiveSerialProduct] = useState<WasteDamageProductItem | null>(null);
  const [customImeiText, setCustomImeiText] = useState('');

  // Load products when modal opens
  useEffect(() => {
    if (!visible) return;
    loadProducts();
  }, [visible]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetchWasteDamageProductsApi({ limit: 100 });
      setProducts(res.wastage_stock || []);

      // Initialize configs
      const initialConfigs: Record<number, InlineProductConfig> = {};
      (res.wastage_stock || []).forEach((p) => {
        const firstBag = p.conversion_units?.[0];
        initialConfigs[p.product_id] = {
          selected: false,
          quantity: 1,
          unitPrice: String(p.price || 0),
          selectedBagType: firstBag?.bag_type || null,
          selectedBagUnit: firstBag ? Number(firstBag.total_unit) || 1 : 1,
          selectedImeis: [],
        };
      });
      setConfigs(initialConfigs);
    } catch (err: any) {
      console.warn('Failed to load products for waste/damage', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let list = products;
    if (filterType !== 'All') {
      list = list.filter((p) => p.product_type === filterType);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.product_name.toLowerCase().includes(q) ||
          p.product_type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, filterType, search]);

  const handleToggleSelect = (productId: number) => {
    setConfigs((prev) => {
      const current = prev[productId] || {
        selected: false,
        quantity: 1,
        unitPrice: '0',
        selectedBagType: null,
        selectedBagUnit: 1,
        selectedImeis: [],
      };
      const nextSelected = !current.selected;
      return {
        ...prev,
        [productId]: {
          ...current,
          selected: nextSelected,
          quantity: nextSelected ? Math.max(1, current.quantity) : current.quantity,
        },
      };
    });
  };

  const handleUpdateQty = (productId: number, delta: number, maxStock: number) => {
    setConfigs((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      const nextQty = Math.max(1, current.quantity + delta);
      if (maxStock > 0 && nextQty > maxStock) {
        Alert.alert('Stock limit', `Only ${maxStock} units available in stock.`);
        return prev;
      }
      return {
        ...prev,
        [productId]: {
          ...current,
          quantity: nextQty,
          selected: true, // Auto-select box when quantity is adjusted
        },
      };
    });
  };

  const handleUpdatePrice = (productId: number, priceStr: string) => {
    setConfigs((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      return {
        ...prev,
        [productId]: {
          ...current,
          unitPrice: priceStr,
        },
      };
    });
  };

  // Toggle IMEI for Serial No products
  const handleToggleImei = (productId: number, imei: string, maxStock: number) => {
    setConfigs((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      const exists = current.selectedImeis.includes(imei);
      let updatedImeis: string[];
      if (exists) {
        updatedImeis = current.selectedImeis.filter((i) => i !== imei);
      } else {
        if (maxStock > 0 && current.selectedImeis.length >= maxStock) {
          Alert.alert('Stock limit', `Cannot select more than available stock (${maxStock}).`);
          return prev;
        }
        updatedImeis = [...current.selectedImeis, imei];
      }
      return {
        ...prev,
        [productId]: {
          ...current,
          selectedImeis: updatedImeis,
          quantity: updatedImeis.length,
          selected: updatedImeis.length > 0, // Auto-select if >= 1 IMEI selected
        },
      };
    });
  };

  // Select all or deselect all IMEIs
  const handleSelectAllImeis = (productId: number, allImeis: string[], maxStock: number) => {
    setConfigs((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      const isAllSelected = current.selectedImeis.length >= allImeis.length;
      let nextImeis: string[] = [];
      if (!isAllSelected) {
        nextImeis = maxStock > 0 ? allImeis.slice(0, maxStock) : allImeis;
      }
      return {
        ...prev,
        [productId]: {
          ...current,
          selectedImeis: nextImeis,
          quantity: nextImeis.length,
          selected: nextImeis.length > 0,
        },
      };
    });
  };

  // Add manual custom IMEI
  const handleAddManualImei = (productId: number, maxStock: number) => {
    const trimmed = customImeiText.trim();
    if (!trimmed) return;
    setConfigs((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      if (current.selectedImeis.includes(trimmed)) {
        Alert.alert('Duplicate IMEI', 'This IMEI is already added.');
        return prev;
      }
      if (maxStock > 0 && current.selectedImeis.length >= maxStock) {
        Alert.alert('Stock limit', `Cannot exceed available stock (${maxStock}).`);
        return prev;
      }
      const nextImeis = [...current.selectedImeis, trimmed];
      return {
        ...prev,
        [productId]: {
          ...current,
          selectedImeis: nextImeis,
          quantity: nextImeis.length,
          selected: true,
        },
      };
    });
    setCustomImeiText('');
  };

  // Select bag
  const handleSelectBag = (
    productId: number,
    bagType: string | null,
    totalUnit: number
  ) => {
    setConfigs((prev) => {
      const current = prev[productId];
      if (!current) return prev;
      return {
        ...prev,
        [productId]: {
          ...current,
          selectedBagType: bagType,
          selectedBagUnit: totalUnit,
          selected: true, // Auto-select box when bag is chosen
          quantity: Math.max(1, current.quantity),
        },
      };
    });
    setActiveBagProduct(null);
  };

  // Normalized active IMEIs for the open modal
  const normalizedActiveImeis = useMemo(() => {
    if (!activeSerialProduct || !activeSerialProduct.imei_no) return [];
    return (activeSerialProduct.imei_no as any[])
      .map((im: any) =>
        typeof im === 'string'
          ? im.trim()
          : String(im.imei_number || im.serial_number || im.imei || '').trim()
      )
      .filter(Boolean);
  }, [activeSerialProduct]);

  // Combined list of preloaded + manually added IMEIs
  const allCombinedImeis = useMemo(() => {
    if (!activeSerialProduct) return [];
    const selected = configs[activeSerialProduct.product_id]?.selectedImeis || [];
    const set = new Set([...normalizedActiveImeis, ...selected]);
    return Array.from(set);
  }, [activeSerialProduct, normalizedActiveImeis, configs]);

  // Count selected items
  const selectedCount = useMemo(() => {
    return Object.values(configs).filter((c) => c.selected).length;
  }, [configs]);

  // Submit selected products to cart
  const handleAddSelected = () => {
    const selectedList: WasteDamageCartItem[] = [];

    for (const p of products) {
      const cfg = configs[p.product_id];
      if (!cfg || !cfg.selected) continue;

      const price = parseFloat(cfg.unitPrice) || 0;

      if (p.product_type === 'Serial No') {
        if (!cfg.selectedImeis.length) {
          Alert.alert('Missing IMEI', `Please select at least one IMEI for "${p.product_name}".`);
          return;
        }
        selectedList.push({
          id: `${p.product_id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          product_id: p.product_id,
          product_name: p.product_name,
          product_type: 'Serial No',
          price,
          quantity: cfg.selectedImeis.length,
          selected_imeis: cfg.selectedImeis,
          available_stock: p.stock_quantity,
          total_amount: cfg.selectedImeis.length * price,
        });
      } else {
        // FMCG or other standard product
        const bagMultiplier = cfg.selectedBagUnit || 1;
        const totalUnits = cfg.quantity * bagMultiplier;

        if (p.stock_quantity > 0 && totalUnits > p.stock_quantity) {
          Alert.alert(
            'Stock Limit Exceeded',
            `Total units (${totalUnits}) exceeds available stock (${p.stock_quantity}) for "${p.product_name}".`
          );
          return;
        }

        selectedList.push({
          id: `${p.product_id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          product_id: p.product_id,
          product_name: p.product_name,
          product_type: p.product_type || 'FMCG',
          price,
          quantity: totalUnits,
          bag_type: cfg.selectedBagType,
          bag_unit: cfg.selectedBagUnit,
          bag_count: cfg.quantity,
          available_stock: p.stock_quantity,
          total_amount: totalUnits * price,
        });
      }
    }

    if (selectedList.length === 0) {
      Alert.alert('No Selection', 'Please select at least one product using the checkboxes.');
      return;
    }

    onAddItems(selectedList);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Add Waste/Damage Products</Text>
              <Text style={styles.headerSubtitle}>Search or browse to add stock</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#0E204E" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#5A6B87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products"
              placeholderTextColor="#8E9CAE"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x-circle" size={16} color="#8E9CAE" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Pills */}
          <View style={styles.filterTabsRow}>
            {(['All', 'FMCG', 'Serial No'] as const).map((type) => {
              const active = filterType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterTab, active && styles.filterTabActive]}
                  onPress={() => setFilterType(type)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Product List */}
        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#0047AB" />
            <Text style={styles.loadingText}>Loading products...</Text>
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
              const cfg = configs[item.product_id] || {
                selected: false,
                quantity: 1,
                unitPrice: String(item.price || 0),
                selectedBagType: null,
                selectedBagUnit: 1,
                selectedImeis: [],
              };
              const isFMCG = item.product_type === 'FMCG';
              const isSerial = item.product_type === 'Serial No';

              return (
                <View style={[styles.productCard, cfg.selected && styles.productCardSelected]}>
                  {/* Card Header Row: Checkbox, Name, Badge, Stock, Price - Tapping toggles selection */}
                  <TouchableOpacity
                    style={styles.cardHeaderRow}
                    onPress={() => {
                      if (isSerial && cfg.selectedImeis.length === 0) {
                        setActiveSerialProduct(item);
                      } else {
                        handleToggleSelect(item.product_id);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkboxTouch}>
                      <View style={[styles.checkbox, cfg.selected && styles.checkboxActive]}>
                        {cfg.selected && <Feather name="check" size={14} color="#FFFFFF" />}
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
                        <Text style={styles.stockLabel}>Stock: {item.stock_quantity}</Text>
                      </View>
                    </View>

                    <View style={styles.priceContainer}>
                      <Text style={styles.priceMetaLabel}>PRICE</Text>
                      <Text style={styles.priceValue}>₹{item.price}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Config Row (Quantity, Unit Price, Bag / Serial Selector) */}
                  <View style={styles.cardDetailsBox}>
                    <View style={styles.fieldsGrid}>
                      {/* For Serial No: units match selected IMEIs; for FMCG: stepper */}
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
                            <Feather name="cpu" size={15} color="#0047AB" />
                            <Text style={styles.imeiCountText}>
                              {cfg.selectedImeis.length} Unit{cfg.selectedImeis.length !== 1 ? 's' : ''}
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
                              onPress={() => handleUpdateQty(item.product_id, -1, item.stock_quantity)}
                            >
                              <Feather name="minus" size={14} color="#0E204E" />
                            </TouchableOpacity>
                            <Text style={styles.stepperVal}>{cfg.quantity}</Text>
                            <TouchableOpacity
                              style={[styles.stepperBtn, styles.stepperBtnPlus]}
                              onPress={() => handleUpdateQty(item.product_id, 1, item.stock_quantity)}
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
                          value={cfg.unitPrice}
                          onChangeText={(txt) => handleUpdatePrice(item.product_id, txt)}
                          placeholder="0.00"
                          placeholderTextColor="#8E9CAE"
                        />
                      </View>
                    </View>

                    {/* For FMCG: Select Bag */}
                    {isFMCG && (
                      <View style={styles.bagSelectGroup}>
                        <Text style={styles.fieldLabel}>Select Bag</Text>
                        <TouchableOpacity
                          style={styles.bagDropdownBtn}
                          onPress={() => setActiveBagProduct(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.bagDropdownText}>
                            {cfg.selectedBagType
                              ? `${cfg.selectedBagType} (${cfg.selectedBagUnit} units)`
                              : item.conversion_units && item.conversion_units.length > 0
                              ? 'Select bag'
                              : 'No bag found'}
                          </Text>
                          <Feather name="chevron-down" size={16} color="#5A6B87" />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* For Serial No: Select Serial / IMEI */}
                    {isSerial && (
                      <View style={styles.bagSelectGroup}>
                        <Text style={styles.fieldLabel}>
                          Select IMEI ({cfg.selectedImeis.length}/{item.stock_quantity || item.imei_no?.length || 0})
                        </Text>
                        <TouchableOpacity
                          style={styles.bagDropdownBtn}
                          onPress={() => setActiveSerialProduct(item)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.bagDropdownText} numberOfLines={1}>
                            {cfg.selectedImeis.length > 0
                              ? cfg.selectedImeis.join(', ')
                              : 'Select Serial / IMEI numbers'}
                          </Text>
                          <Feather name="chevron-right" size={16} color="#5A6B87" />
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
                <Text style={styles.emptyTitle}>No Products Found</Text>
                <Text style={styles.emptySub}>
                  Try adjusting your search query or filter criteria.
                </Text>
              </View>
            }
          />
        )}

        {/* Bottom Floating Add Button */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.addBtn, selectedCount === 0 && styles.addBtnDisabled]}
            onPress={handleAddSelected}
            disabled={selectedCount === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>
              Add {selectedCount > 0 ? `(${selectedCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bag Selector Modal */}
        {activeBagProduct && (
          <Modal
            visible={!!activeBagProduct}
            transparent
            animationType="fade"
            onRequestClose={() => setActiveBagProduct(null)}
          >
            <View style={styles.modalBackdrop}>
              <TouchableOpacity
                style={styles.overlayTouch}
                activeOpacity={1}
                onPress={() => setActiveBagProduct(null)}
              />
              <View style={styles.selectSheetCard}>
                <Text style={styles.selectSheetTitle}>Select Bag Conversion</Text>
                {activeBagProduct.conversion_units &&
                activeBagProduct.conversion_units.length > 0 ? (
                  activeBagProduct.conversion_units.map((unit, idx) => {
                    const isSelected =
                      configs[activeBagProduct.product_id]?.selectedBagType === unit.bag_type;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.selectOption, isSelected && styles.selectOptionActive]}
                        onPress={() =>
                          handleSelectBag(
                            activeBagProduct.product_id,
                            unit.bag_type,
                            Number(unit.total_unit) || 1
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.selectOptionText,
                            isSelected && styles.selectOptionTextActive,
                          ]}
                        >
                          {unit.bag_type} ({unit.total_unit} units)
                        </Text>
                        {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 14 }}>
                    <Text style={{ color: '#8E98BA', fontSize: 13 }}>
                      No conversion units found for this product. Defaulting to 1 unit.
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.selectOption, { marginTop: 6 }]}
                  onPress={() =>
                    handleSelectBag(activeBagProduct.product_id, null, 1)
                  }
                >
                  <Text style={styles.selectOptionText}>Standard / Base Unit (1 unit)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

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
                    <Text style={styles.selectSheetTitle}>
                      Select Serial / IMEI
                    </Text>
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

                {/* Select All / Deselect All Bar */}
                {normalizedActiveImeis.length > 0 && (
                  <View style={styles.imeiQuickBar}>
                    <Text style={styles.imeiSelectedCounter}>
                      Selected: {(configs[activeSerialProduct.product_id]?.selectedImeis || []).length} / {normalizedActiveImeis.length}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        handleSelectAllImeis(
                          activeSerialProduct.product_id,
                          normalizedActiveImeis,
                          activeSerialProduct.stock_quantity
                        )
                      }
                      style={styles.selectAllBtn}
                    >
                      <Text style={styles.selectAllBtnText}>
                        {(configs[activeSerialProduct.product_id]?.selectedImeis || []).length >=
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
                        activeSerialProduct.stock_quantity
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
                        activeSerialProduct.stock_quantity
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
                      configs[activeSerialProduct.product_id]?.selectedImeis || []
                    ).includes(imei);
                    return (
                      <TouchableOpacity
                        style={[styles.selectOption, isSelected && styles.selectOptionActive]}
                        onPress={() =>
                          handleToggleImei(
                            activeSerialProduct.product_id,
                            imei,
                            activeSerialProduct.stock_quantity
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
                        No available IMEI serials found. Enter IMEI manually above.
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
                    Done ({(configs[activeSerialProduct.product_id]?.selectedImeis || []).length} Selected)
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
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DFE7F2',
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
    fontWeight: '700',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#5A6B87',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  filterTabActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0047AB',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  filterTabTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 14,
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
    fontSize: 16,
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
  bagSelectGroup: {
    gap: 4,
  },
  bagDropdownBtn: {
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
  bagDropdownText: {
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
    marginBottom: 10,
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
});
