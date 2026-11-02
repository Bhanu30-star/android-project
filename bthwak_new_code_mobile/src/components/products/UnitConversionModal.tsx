import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  ProductItem,
  fetchConversionRatesApi,
  addConversionRateApi,
  removeConversionRateApi,
} from '@/api/products';

interface UnitConversionModalProps {
  visible: boolean;
  product: ProductItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UnitConversionModal: React.FC<UnitConversionModalProps> = ({
  visible,
  product,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [conversionData, setConversionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form
  const [unit1, setUnit1] = useState('');
  const [unit2, setUnit2] = useState('');
  const [newStock, setNewStock] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadConversions = async () => {
    if (!product?.product_id) return;
    setIsLoading(true);
    try {
      const res = await fetchConversionRatesApi(product.product_id);
      setConversionData(res);
      setUnit2(res?.secondary_unit || product.secondary_unit || product.unit || 'PCS');
    } catch (err) {
      console.warn('Failed to load conversion rates', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible && product) {
      loadConversions();
      setIsAdding(false);
    }
  }, [visible, product]);

  const handleAddConversion = async () => {
    if (!product?.product_id) return;
    if (!unit1.trim() || !newStock.trim() || !salePrice.trim()) {
      Alert.alert('Required Fields', 'Please fill Unit Name, Stock Multiplier, and Sale Price.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addConversionRateApi({
        product_id: product.product_id,
        unit_1: unit1.trim(),
        unit_2: unit2.trim() || 'PCS',
        new_stock: parseFloat(newStock),
        stock_sale_price: parseFloat(salePrice),
        stock_purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
      });
      Alert.alert('Success', 'Conversion rate added successfully!');
      setUnit1('');
      setNewStock('');
      setSalePrice('');
      setPurchasePrice('');
      setIsAdding(false);
      loadConversions();
      onSuccess?.();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add conversion rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = (conversionId: number) => {
    Alert.alert('Remove Conversion', 'Are you sure you want to remove this conversion rate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeConversionRateApi(conversionId);
            loadConversions();
            onSuccess?.();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to remove conversion');
          }
        },
      },
    ]);
  };

  const conversionsList = conversionData?.conversion_rates || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Unit Conversions</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {product?.product_name || 'Product'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={20} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {/* Top Info Banner */}
            <View style={styles.baseUnitCard}>
              <View style={styles.baseUnitIcon}>
                <Feather name="package" size={16} color="#0047AB" />
              </View>
              <View style={styles.baseUnitInfo}>
                <Text style={styles.baseUnitLabel}>Primary / Secondary Unit</Text>
                <Text style={styles.baseUnitVal}>
                  {product?.unit || 'PCS'} / {product?.secondary_unit || 'PCS'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addToggleBtn}
                onPress={() => setIsAdding(!isAdding)}
              >
                <Feather name={isAdding ? 'minus' : 'plus'} size={14} color="#FFFFFF" />
                <Text style={styles.addToggleBtnText}>{isAdding ? 'Close' : 'Add'}</Text>
              </TouchableOpacity>
            </View>

            {/* Add Form */}
            {isAdding && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>New Conversion Rate</Text>

                <View style={styles.inputRow}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>New Unit (Unit 1) *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1 Box"
                      placeholderTextColor="#8E9CAE"
                      value={unit1}
                      onChangeText={setUnit1}
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Base Unit (Unit 2)</Text>
                    <TextInput
                      style={[styles.input, styles.readOnlyInput]}
                      value={unit2}
                      editable={false}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Pieces in Unit *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 10"
                      placeholderTextColor="#8E9CAE"
                      keyboardType="numeric"
                      value={newStock}
                      onChangeText={setNewStock}
                    />
                  </View>
                  <View style={styles.inputCol}>
                    <Text style={styles.inputLabel}>Sale Price *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="₹ 0.00"
                      placeholderTextColor="#8E9CAE"
                      keyboardType="numeric"
                      value={salePrice}
                      onChangeText={setSalePrice}
                    />
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setIsAdding(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleAddConversion}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitBtnText}>Save Conversion</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* List */}
            {isLoading ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color="#0047AB" />
                <Text style={styles.loadingText}>Loading conversion rates...</Text>
              </View>
            ) : conversionsList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="layers" size={32} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Conversions Added</Text>
                <Text style={styles.emptySubtitle}>
                  Set up alternative pack sizes like Box, Carton, or Pack to sell in bulk.
                </Text>
              </View>
            ) : (
              <View style={styles.conversionsList}>
                {conversionsList.map((item: any, idx: number) => (
                  <View key={item.id || idx} style={styles.conversionCard}>
                    <View style={styles.convHeader}>
                      <View style={styles.convBadge}>
                        <Text style={styles.convBadgeText}>
                          1 {item.unit_1} = {item.total_unit || item.new_stock} {item.unit_2}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemove(item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.convPricesRow}>
                      <Text style={styles.convPrice}>
                        Sale: <Text style={styles.priceHighlight}>₹{Number(item.sale_price || item.stock_sale_price || 0).toFixed(2)}</Text>
                      </Text>
                      {item.purchase_price ? (
                        <Text style={styles.convPrice}>
                          Buy: ₹{Number(item.purchase_price).toFixed(2)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 400,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    elevation: 16,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DFE7F2',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E204E',
  },
  subtitle: {
    fontSize: 13,
    color: '#5A6B87',
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  baseUnitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginBottom: 16,
  },
  baseUnitIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  baseUnitInfo: {
    flex: 1,
  },
  baseUnitLabel: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
  },
  baseUnitVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    marginTop: 2,
  },
  addToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0047AB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E204E',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    height: 42,
    paddingHorizontal: 12,
    color: '#0E204E',
    fontSize: 14,
  },
  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#5A6B87',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  submitBtn: {
    backgroundColor: '#0047AB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  conversionsList: {
    gap: 10,
    paddingBottom: 20,
  },
  conversionCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  convHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  convBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  convBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  convPricesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  convPrice: {
    fontSize: 13,
    color: '#5A6B87',
  },
  priceHighlight: {
    color: '#0047AB',
    fontWeight: '700',
  },
  centerLoading: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#5A6B87',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#5A6B87',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
