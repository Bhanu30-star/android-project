import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SalesExecutiveUser,
  ExecutiveStockItem,
  fetchExecutiveStockReturnApi,
  submitExecutiveStockReturnApi,
} from '@/api/salesExecutive';

interface ExecutiveStockReturnModalProps {
  visible: boolean;
  user: SalesExecutiveUser | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ExecutiveStockReturnModal: React.FC<ExecutiveStockReturnModalProps> = ({
  visible,
  user,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();

  // Stock Items State
  const [stockList, setStockList] = useState<ExecutiveStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Selected Return Quantities: { [productId]: number }
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});

  // Selected IMEIs for serial products: { [productId]: string[] }
  const [selectedImeis, setSelectedImeis] = useState<Record<number, string[]>>({});

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // IMEI Picker Modal State
  const [activeImeiProduct, setActiveImeiProduct] = useState<ExecutiveStockItem | null>(null);
  const [imeiSearch, setImeiSearch] = useState('');

  // Load stock when user changes or modal opens
  useEffect(() => {
    if (!visible || !user) {
      setStockList([]);
      setReturnQuantities({});
      setSelectedImeis({});
      setSearch('');
      return;
    }

    loadStock();
  }, [visible, user]);

  const loadStock = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await fetchExecutiveStockReturnApi({
        saleId: user.user_id,
        limit: 200,
      });
      setStockList(res.stock || []);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load stock for this executive.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered Stock items
  const filteredStock = useMemo(() => {
    if (!search.trim()) return stockList;
    const q = search.trim().toLowerCase();
    return stockList.filter((item) =>
      item.product_name?.toLowerCase().includes(q)
    );
  }, [stockList, search]);

  // Handle normal quantity change
  const handleQtyChange = (productId: number, val: string, maxQty: number) => {
    if (val === '' || val === '0') {
      setReturnQuantities((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      return;
    }

    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num < 0) return;

    if (num > maxQty) {
      Alert.alert('Invalid Quantity', `Cannot return more than available stock (${maxQty}).`);
      setReturnQuantities((prev) => ({ ...prev, [productId]: maxQty }));
      return;
    }

    setReturnQuantities((prev) => ({ ...prev, [productId]: num }));
  };

  // Adjust normal qty with stepper
  const handleStepQty = (productId: number, delta: number, maxQty: number) => {
    const current = returnQuantities[productId] || 0;
    const next = current + delta;
    if (next < 0) return;
    if (next > maxQty) {
      Alert.alert('Max Stock Reached', `Available stock is ${maxQty}.`);
      return;
    }
    if (next === 0) {
      setReturnQuantities((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
    } else {
      setReturnQuantities((prev) => ({ ...prev, [productId]: next }));
    }
  };

  // Extract IMEI strings from item.imei_no
  const getImeisForItem = (item: ExecutiveStockItem): string[] => {
    if (!item.imei_no || !Array.isArray(item.imei_no)) return [];
    return item.imei_no.map((i: any) => (typeof i === 'object' && i !== null ? String(i.imei_no || '') : String(i))).filter(Boolean);
  };

  // Toggle single IMEI selection
  const handleToggleImei = (productId: number, imei: string) => {
    setSelectedImeis((prev) => {
      const current = prev[productId] || [];
      if (current.includes(imei)) {
        return { ...prev, [productId]: current.filter((x) => x !== imei) };
      } else {
        return { ...prev, [productId]: [...current, imei] };
      }
    });
  };

  // Select all / Clear all IMEIs
  const handleSelectAllImeis = (productId: number, allImeis: string[]) => {
    setSelectedImeis((prev) => {
      const current = prev[productId] || [];
      if (current.length === allImeis.length) {
        return { ...prev, [productId]: [] };
      } else {
        return { ...prev, [productId]: [...allImeis] };
      }
    });
  };

  // Submit return
  const handleSubmitReturn = async () => {
    if (!user) return;

    const return_product: Array<{ product_id: number; product_name: string; quantity: number }> = [];
    const return_serial_product: Array<{
      product_id: number;
      product_name: string;
      quantity: number;
      imeis: string[];
    }> = [];

    stockList.forEach((item) => {
      const pid = item.product_id;
      const isSerial = item.product_type === 'Serial No';

      if (!isSerial) {
        const qty = returnQuantities[pid] || 0;
        if (qty > 0) {
          return_product.push({
            product_id: pid,
            product_name: item.product_name,
            quantity: qty,
          });
        }
      } else {
        const imeis = selectedImeis[pid] || [];
        if (imeis.length > 0) {
          return_serial_product.push({
            product_id: pid,
            product_name: item.product_name,
            quantity: imeis.length,
            imeis,
          });
        }
      }
    });

    if (return_product.length === 0 && return_serial_product.length === 0) {
      Alert.alert('No Items Selected', 'Please enter a return quantity or select IMEIs to return.');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitExecutiveStockReturnApi({
        sale_id: user.user_id,
        return_product,
        return_serial_product,
      });

      Alert.alert('Success', 'Stock returned successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Return Failed', err?.message || 'Could not process stock return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count total return items
  const totalReturnCount = useMemo(() => {
    let count = 0;
    Object.values(returnQuantities).forEach((q) => {
      count += q;
    });
    Object.values(selectedImeis).forEach((arr) => {
      count += arr.length;
    });
    return count;
  }, [returnQuantities, selectedImeis]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Top Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.headerTitle}>Return Stock</Text>
                {user && (
                  <View style={styles.executiveBadge}>
                    <Text style={styles.executiveBadgeText} numberOfLines={1}>
                      {user.user_name || user.name}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.headerSubtitle}>Select IMEI / Qty to return</Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Feather name="search" size={16} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search product"
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={15} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderText, styles.colIndex]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.colProduct]}>PRODUCT</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>QTY</Text>
            <Text style={[styles.tableHeaderText, styles.colReturn]}>RETURN</Text>
          </View>

          {/* Products List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loadingText}>Loading allocated stock...</Text>
            </View>
          ) : filteredStock.length === 0 ? (
            <View style={styles.centerContainer}>
              <Feather name="package" size={40} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Stock Found</Text>
              <Text style={styles.emptyDesc}>
                {search.trim()
                  ? `No products matching "${search}".`
                  : 'This executive currently has no allocated stock.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.listArea}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredStock.map((item, index) => {
                const pid = item.product_id;
                const isSerial = item.product_type === 'Serial No';
                const returnQty = returnQuantities[pid] || 0;
                const imeisCount = (selectedImeis[pid] || []).length;
                const isItemActive = isSerial ? imeisCount > 0 : returnQty > 0;

                return (
                  <View
                    key={pid}
                    style={[styles.tableRowCard, isItemActive && styles.tableRowCardActive]}
                  >
                    {/* Index */}
                    <Text style={[styles.tableRowText, styles.colIndex]}>{index + 1}</Text>

                    {/* Product Name */}
                    <View style={styles.colProduct}>
                      <Text style={styles.productNameText} numberOfLines={2}>
                        {item.product_name}
                      </Text>
                      {isSerial && (
                        <View style={styles.serialBadge}>
                          <Text style={styles.serialBadgeText}>IMEI / Serial</Text>
                        </View>
                      )}
                    </View>

                    {/* Current Allocated Qty */}
                    <View style={styles.colQty}>
                      <Text style={styles.currentQtyText}>{item.quantity}</Text>
                    </View>

                    {/* Return Action / Input */}
                    <View style={styles.colReturn}>
                      {isSerial ? (
                        <TouchableOpacity
                          style={[
                            styles.imeiSelectTrigger,
                            imeisCount > 0 && styles.imeiSelectTriggerActive,
                          ]}
                          onPress={() => setActiveImeiProduct(item)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.imeiTriggerText,
                              imeisCount > 0 && styles.imeiTriggerTextActive,
                            ]}
                          >
                            {imeisCount > 0 ? `${imeisCount} Selected` : 'Select IMEI'}
                          </Text>
                          <Feather
                            name="chevron-right"
                            size={14}
                            color={imeisCount > 0 ? '#0047AB' : '#5A6B87'}
                          />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.stepperContainer}>
                          <TouchableOpacity
                            style={[
                              styles.stepperBtn,
                              returnQty === 0 && styles.stepperBtnDisabled,
                            ]}
                            onPress={() => handleStepQty(pid, -1, item.quantity)}
                            disabled={returnQty === 0}
                          >
                            <Feather name="minus" size={12} color={returnQty === 0 ? '#CBD5E1' : '#0E204E'} />
                          </TouchableOpacity>

                          <TextInput
                            style={styles.returnInput}
                            placeholder="0"
                            placeholderTextColor="#CBD5E1"
                            value={returnQty > 0 ? String(returnQty) : ''}
                            onChangeText={(val) => handleQtyChange(pid, val, item.quantity)}
                            keyboardType="numeric"
                            maxLength={4}
                          />

                          <TouchableOpacity
                            style={[
                              styles.stepperBtn,
                              returnQty >= item.quantity && styles.stepperBtnDisabled,
                            ]}
                            onPress={() => handleStepQty(pid, 1, item.quantity)}
                            disabled={returnQty >= item.quantity}
                          >
                            <Feather
                              name="plus"
                              size={12}
                              color={returnQty >= item.quantity ? '#CBD5E1' : '#0047AB'}
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.closeFooterBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.closeFooterBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitFooterBtn,
                (totalReturnCount === 0 || isSubmitting) && styles.btnDisabled,
              ]}
              onPress={handleSubmitReturn}
              disabled={totalReturnCount === 0 || isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitFooterBtnText} numberOfLines={1}>
                  {totalReturnCount > 0 ? `Submit (${totalReturnCount})` : 'Submit'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* IMEI Multi-Select Sheet */}
        <Modal
          visible={Boolean(activeImeiProduct)}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveImeiProduct(null)}
        >
          <View style={styles.imeiModalOverlay}>
            <View style={styles.imeiModalCard}>
              <View style={styles.imeiModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.imeiModalTitle} numberOfLines={1}>
                    {activeImeiProduct?.product_name}
                  </Text>
                  <Text style={styles.imeiModalSubtitle}>Select IMEIs to return</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setActiveImeiProduct(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={20} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              {/* Search IMEIs */}
              <View style={styles.imeiSearchBox}>
                <Feather name="search" size={15} color="#94A3B8" />
                <TextInput
                  style={styles.imeiSearchInput}
                  placeholder="Search IMEI..."
                  placeholderTextColor="#94A3B8"
                  value={imeiSearch}
                  onChangeText={setImeiSearch}
                />
              </View>

              {/* Select All Row */}
              {activeImeiProduct && (
                <View style={styles.imeiSelectAllRow}>
                  {(() => {
                    const allImeis = getImeisForItem(activeImeiProduct);
                    const selected = selectedImeis[activeImeiProduct.product_id] || [];
                    const isAll = allImeis.length > 0 && selected.length === allImeis.length;

                    return (
                      <>
                        <Text style={styles.imeiCountText}>
                          Selected: {selected.length} / {allImeis.length}
                        </Text>
                        <TouchableOpacity
                          style={styles.selectAllBtn}
                          onPress={() => handleSelectAllImeis(activeImeiProduct.product_id, allImeis)}
                        >
                          <Text style={styles.selectAllBtnText}>
                            {isAll ? 'Clear All' : 'Select All'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    );
                  })()}
                </View>
              )}

              {/* IMEI Items Scroll */}
              <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
                {activeImeiProduct && (() => {
                  const allImeis = getImeisForItem(activeImeiProduct);
                  const filtered = allImeis.filter((im) =>
                    im.toLowerCase().includes(imeiSearch.trim().toLowerCase())
                  );
                  const selected = selectedImeis[activeImeiProduct.product_id] || [];

                  if (filtered.length === 0) {
                    return (
                      <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: '#94A3B8', fontSize: 13 }}>No IMEIs available</Text>
                      </View>
                    );
                  }

                  return filtered.map((imei) => {
                    const isChecked = selected.includes(imei);
                    return (
                      <TouchableOpacity
                        key={imei}
                        style={[styles.imeiItemRow, isChecked && styles.imeiItemRowChecked]}
                        onPress={() => handleToggleImei(activeImeiProduct.product_id, imei)}
                      >
                        <Text
                          style={[
                            styles.imeiNumberText,
                            isChecked && styles.imeiNumberTextChecked,
                          ]}
                        >
                          {imei}
                        </Text>

                        <View
                          style={[
                            styles.imeiCheckbox,
                            isChecked && styles.imeiCheckboxChecked,
                          ]}
                        >
                          {isChecked && <Feather name="check" size={12} color="#FFFFFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </ScrollView>

              <TouchableOpacity
                style={styles.imeiDoneBtn}
                onPress={() => {
                  setActiveImeiProduct(null);
                  setImeiSearch('');
                }}
              >
                <Text style={styles.imeiDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '90%',
    minHeight: '60%',
    paddingTop: 10,
    elevation: 24,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#5A6B87',
    fontWeight: '500',
    marginTop: 2,
  },
  executiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  executiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
    fontWeight: '500',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5A6B87',
    letterSpacing: 0.5,
  },
  colIndex: {
    width: 24,
    textAlign: 'center',
  },
  colProduct: {
    flex: 1,
    paddingHorizontal: 8,
  },
  colQty: {
    width: 44,
    textAlign: 'center',
    alignItems: 'center',
  },
  colReturn: {
    width: 116,
    alignItems: 'flex-end',
  },
  listArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  tableRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingVertical: 10,
    paddingHorizontal: 10,
    elevation: 1,
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  tableRowCardActive: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFD',
  },
  tableRowText: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '600',
  },
  productNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  serialBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  serialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0047AB',
  },
  currentQtyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
    textAlign: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    height: 36,
  },
  stepperBtn: {
    width: 28,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  returnInput: {
    width: 36,
    height: 34,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
    padding: 0,
  },
  imeiSelectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 8,
    height: 36,
  },
  imeiSelectTriggerActive: {
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  imeiTriggerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
  },
  imeiTriggerTextActive: {
    color: '#0047AB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  closeFooterBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0E1726',
    borderWidth: 1,
    borderColor: '#232F48',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  closeFooterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  submitFooterBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#818EF8',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    elevation: 3,
  },
  submitFooterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  imeiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imeiModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    elevation: 16,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  imeiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imeiModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  imeiModalSubtitle: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  imeiSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 8,
  },
  imeiSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
  },
  imeiSelectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  imeiCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  selectAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
  },
  selectAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  imeiItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 6,
  },
  imeiItemRowChecked: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  imeiNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  imeiNumberTextChecked: {
    color: '#0047AB',
    fontWeight: '700',
  },
  imeiCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imeiCheckboxChecked: {
    borderColor: '#0047AB',
    backgroundColor: '#0047AB',
  },
  imeiDoneBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  imeiDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
