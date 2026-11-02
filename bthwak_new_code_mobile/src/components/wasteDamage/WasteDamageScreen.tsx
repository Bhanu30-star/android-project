import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  WasteDamageCartItem,
  WasteDamageSubmitPayload,
  saveWasteDamageApi,
} from '@/api/wasteDamage';
import { AddWasteDamageModal } from './AddWasteDamageModal';

interface WasteDamageScreenProps {
  onBack?: () => void;
}

export const WasteDamageScreen: React.FC<WasteDamageScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();

  // Cart State
  const [cart, setCart] = useState<WasteDamageCartItem[]>([]);
  const [searchCart, setSearchCart] = useState('');
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Item Modal
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Calculated Total Amount
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }, [cart]);

  // Filtered cart list for search
  const filteredCart = useMemo(() => {
    if (!searchCart.trim()) return cart;
    const q = searchCart.trim().toLowerCase();
    return cart.filter((item) => item.product_name.toLowerCase().includes(q));
  }, [cart, searchCart]);

  // Add items from picker modal
  const handleAddItemsFromModal = (newItems: WasteDamageCartItem[]) => {
    setCart((prev) => {
      const updated = [...prev];
      for (const newItem of newItems) {
        const existingIdx = updated.findIndex((i) => i.product_id === newItem.product_id);
        if (existingIdx >= 0) {
          // Replace or merge
          updated[existingIdx] = newItem;
        } else {
          updated.push(newItem);
        }
      }
      return updated;
    });
  };

  // Adjust item quantity in cart
  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            if (item.product_type === 'Serial No') {
              Alert.alert(
                'Serial/IMEI Item',
                'Quantity for serial products is controlled by individual IMEI selection. To adjust, re-add from the product picker or delete this item.'
              );
              return item;
            }
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (item.available_stock > 0 && nextQty > item.available_stock) {
              Alert.alert('Stock limit', `Only ${item.available_stock} available in stock.`);
              return item;
            }
            return {
              ...item,
              quantity: nextQty,
              total_amount: nextQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean) as WasteDamageCartItem[];
    });
  };

  // Delete single item from cart
  const handleDeleteItem = (id: string, productName: string) => {
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove "${productName}" from the cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setCart((prev) => prev.filter((i) => i.id !== id));
          },
        },
      ]
    );
  };

  // Clear entire cart
  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to clear all items from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setCart([]),
        },
      ]
    );
  };

  // Submit Waste / Damage
  const handleSubmit = async () => {
    if (cart.length === 0) {
      Alert.alert('Cart is empty', 'Please add at least one product to submit.');
      return;
    }

    Alert.alert(
      'Confirm Submission',
      `Submit ${cart.length} item(s) for waste/damage with total ₹${totalAmount.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              setIsSubmitting(true);

              const fmcgList: WasteDamageSubmitPayload['fmcg_product'] = [];
              const serialList: WasteDamageSubmitPayload['serial_no'] = [];

              for (const item of cart) {
                if (item.product_type === 'Serial No') {
                  serialList.push({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    product_price: item.price,
                    product_qty: item.quantity,
                    product_type: 'Serial No',
                    imei_ids: item.selected_imeis || [],
                  });
                } else {
                  fmcgList.push({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    product_price: item.price,
                    product_bag_type: 0,
                    product_bag_qty: item.bag_count || item.quantity,
                    product_qty: item.quantity,
                    product_type: item.product_type || 'FMCG',
                  });
                }
              }

              const payload: WasteDamageSubmitPayload = {
                remark: remark.trim() || undefined,
                fmcg_product: fmcgList,
                serial_no: serialList,
              };

              const res = await saveWasteDamageApi(payload);
              Alert.alert('Success', res.message || 'Waste/Damage stock submitted successfully!');
              setCart([]);
              setRemark('');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to submit waste/damage stock.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const isCartEmpty = cart.length === 0;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={22} color="#0E204E" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Waste Damage</Text>
        </View>
      </View>

      {isCartEmpty ? (
        /* Empty State Screen (Matches User Screenshot 2) */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCartGraphicCircle}>
            <View style={styles.emptyCartIconWrapper}>
              <MaterialCommunityIcons name="cart-outline" size={72} color="#0047AB" />
            </View>
          </View>

          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>No products found in the cart</Text>

          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.emptyAddBtnText}>Add Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Populated Cart Screen (Matches User Screenshot 1) */
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.contentFlex}
        >
          {/* Search Box */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#5A6B87" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search cart..."
                placeholderTextColor="#8E9CAE"
                value={searchCart}
                onChangeText={setSearchCart}
                autoCorrect={false}
              />
              {searchCart.length > 0 && (
                <TouchableOpacity onPress={() => setSearchCart('')}>
                  <Feather name="x-circle" size={16} color="#8E9CAE" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Cart Header Card (Matches Screenshot 1) */}
          <View style={styles.cartBannerCard}>
            <View style={styles.cartBannerLeft}>
              <View style={styles.cartIconCircle}>
                <Ionicons name="bag-handle" size={20} color="#0047AB" />
              </View>
              <View>
                <Text style={styles.cartCountText}>{cart.length} items in cart</Text>
                <Text style={styles.cartTotalSub}>Total: ₹{totalAmount.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.cartBannerActions}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearCart}
                activeOpacity={0.8}
              >
                <Feather name="minus-circle" size={14} color="#DC2626" />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addItemBtn}
                onPress={() => setAddModalVisible(true)}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={14} color="#FFFFFF" />
                <Text style={styles.addItemBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Table Header Row */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableColHeader, styles.colNum]}>#</Text>
            <Text style={[styles.tableColHeader, styles.colItem]}>ITEM</Text>
            <Text style={[styles.tableColHeader, styles.colQty]}>QUANTITY</Text>
            <Text style={[styles.tableColHeader, styles.colDelete]}>DELETE</Text>
          </View>

          {/* Items FlatList */}
          <FlatList
            data={filteredCart}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.tableListContent}
            renderItem={({ item, index }) => (
              <View style={styles.tableRow}>
                {/* # Col */}
                <Text style={[styles.tableCellText, styles.colNum]}>{index + 1}</Text>

                {/* Item Col */}
                <View style={styles.colItem}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.product_name}
                  </Text>
                  <Text style={styles.itemPrice}>₹{item.price}</Text>
                  {item.bag_type && (
                    <Text style={styles.itemBagType}>
                      {item.bag_type} ({item.bag_unit} units)
                    </Text>
                  )}
                  {item.selected_imeis && item.selected_imeis.length > 0 && (
                    <Text style={styles.itemBagType} numberOfLines={1}>
                      IMEI: {item.selected_imeis.join(', ')}
                    </Text>
                  )}
                </View>

                {/* Quantity Col: Stepper for FMCG, Pill for Serial No */}
                {item.product_type === 'Serial No' ? (
                  <View style={[styles.colQty, { alignItems: 'center', justifyContent: 'center' }]}>
                    <View style={styles.serialCartPill}>
                      <Text style={styles.serialCartPillText}>
                        {item.quantity} Unit{item.quantity !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.colQty, styles.stepperContainer]}>
                    <TouchableOpacity
                      style={styles.stepperActionBtn}
                      onPress={() => handleUpdateCartQty(item.id, -1)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="minus" size={13} color="#0E204E" />
                    </TouchableOpacity>

                    <Text style={styles.stepperNumber}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={[styles.stepperActionBtn, styles.stepperActionPlus]}
                      onPress={() => handleUpdateCartQty(item.id, 1)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="plus" size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Delete Col */}
                <View style={styles.colDelete}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteItem(item.id, item.product_name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="trash-2" size={17} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {/* Sticky Bottom Footer Card (Matches Screenshot 1) */}
          <View style={[styles.footerCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Remark Input */}
            <TextInput
              style={styles.remarkInput}
              placeholder="Add a remark..."
              placeholderTextColor="#8E9CAE"
              value={remark}
              onChangeText={setRemark}
            />

            {/* Total and Submit Row */}
            <View style={styles.footerBottomRow}>
              <View>
                <Text style={styles.totalMetaLabel}>Total Amount</Text>
                <Text style={styles.totalValueText}>₹{totalAmount.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Product Selection Modal */}
      <AddWasteDamageModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAddItems={handleAddItemsFromModal}
        existingCartProductIds={cart.map((i) => i.product_id)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  contentFlex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
  },
  cartBannerCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cartBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  cartTotalSub: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  cartBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0047AB',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
    letterSpacing: 0.5,
  },
  colNum: {
    width: 28,
  },
  colItem: {
    flex: 1,
    paddingRight: 8,
  },
  colQty: {
    width: 90,
    alignItems: 'center',
  },
  colDelete: {
    width: 44,
    alignItems: 'flex-end',
  },
  tableListContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
    marginTop: 2,
  },
  itemBagType: {
    fontSize: 11,
    color: '#0047AB',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stepperActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperActionPlus: {
    backgroundColor: '#0047AB',
  },
  stepperNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    minWidth: 16,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 6,
  },
  serialCartPill: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  serialCartPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  footerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 14,
    gap: 12,
    elevation: 4,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  remarkInput: {
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    height: 42,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0E204E',
  },
  footerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalMetaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
  },
  totalValueText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#0047AB',
    paddingVertical: 10,
    paddingHorizontal: 26,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 96,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 60,
  },
  emptyCartGraphicCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyCartIconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#5A6B87',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0047AB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
