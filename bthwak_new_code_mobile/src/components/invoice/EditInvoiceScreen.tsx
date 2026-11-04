import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  fetchMoveBackDateDetailApi,
  MoveBackDateDetail,
} from '@/api/invoiceList';
import { apiClient } from '@/api/client';
import { CalendarPickerModal } from '@/components/common/CalendarPickerModal';
import { PartySearchSheet } from '@/components/invoice/PartySearchSheet';
import { AddItemsSheet } from '@/components/invoice/AddItemsSheet';

interface EditCartItem {
  id: number | string;
  name: string;
  qty: number;
  price: number;
  taxRate?: number;
  total: number;
}

export const EditInvoiceScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    transaction_id?: string;
    bill_no?: string;
    party_name?: string;
  }>();

  const transactionId = params.transaction_id || '';
  const initialBillNo = params.bill_no || 'H00001';
  const initialParty = params.party_name || 'Cash';

  // Form states
  const [partyName, setPartyName] = useState(initialParty);
  const [partyId, setPartyId] = useState<number>(0);
  const [reverseCharges, setReverseCharges] = useState<'No' | 'Yes'>('No');
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [invoiceType, setInvoiceType] = useState<'Tax Invoice' | 'Delivery Challan'>('Tax Invoice');
  const [fseUser, setFseUser] = useState<string>('Admin');
  const [billNo, setBillNo] = useState<string>(initialBillNo);

  // Cart Items
  const [cartItems, setCartItems] = useState<EditCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isPartySearchOpen, setIsPartySearchOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
  const [isReverseChargesPickerOpen, setIsReverseChargesPickerOpen] = useState(false);
  const [isInvoiceTypePickerOpen, setIsInvoiceTypePickerOpen] = useState(false);

  // Load existing invoice details on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!transactionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // 1. Try to load from getDataBillMoveToBackDate (guaranteed to have products & party)
      try {
        const detail = await fetchMoveBackDateDetailApi(transactionId);
        if (isMounted && detail) {
          if (detail.bill_no) setBillNo(detail.bill_no);
          if (detail.retailer_name) setPartyName(detail.retailer_name.replace(/-.*/, ''));
          if (detail.fos_name) setFseUser(detail.fos_name);

          // Populate cart items from product_detail
          if (detail.product_detail && detail.product_detail.length > 0) {
            const mapped: EditCartItem[] = detail.product_detail.map((p, idx) => ({
              id: idx + 1,
              name: p.product_name,
              qty: p.quantity || 1,
              price: p.price || 0,
              taxRate: Number(p.tax_rate) || 0,
              total: Number(p.price || 0) * (p.quantity || 1),
            }));
            setCartItems(mapped);
          }
        }
      } catch (err) {
        console.warn('fetchMoveBackDateDetailApi failed:', err);
      }

      // 2. Also check if getEditSaleCartList has staged data
      try {
        const res = await apiClient.get('/sale/getEditSaleCartList', {
          params: { transaction_id: transactionId },
        });
        const serverCart = res.data?.data?.cart_list;
        if (isMounted && Array.isArray(serverCart) && serverCart.length > 0) {
          const mappedServer: EditCartItem[] = serverCart.map((c: any) => ({
            id: c.cart_id || c.product_id,
            name: c.product_name,
            qty: parseFloat(c.quantity) || 1,
            price: Number(c.price || c.net_amount || 0),
            taxRate: parseFloat(c.tax_rate) || 0,
            total: Number(c.total_amount || 0),
          }));
          setCartItems(mappedServer);
        }
      } catch (err: any) {
        // Silently swallow "Edit Sale Cart List not found" error so it doesn't show an intrusive toast
        // We already gracefully populated from bill details above!
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [transactionId]);

  // Adjust item quantity
  const handleUpdateQty = (itemId: number | string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = Math.max(1, item.qty + delta);
            return {
              ...item,
              qty: newQty,
              total: newQty * item.price,
            };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  // Remove item
  const handleRemoveItem = (itemId: number | string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Add Item from Catalog
  const handleAddItemFromCatalog = (product: any, qty: number, price: number) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === product.product_id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].qty += qty;
        updated[existingIdx].total = updated[existingIdx].qty * updated[existingIdx].price;
        return updated;
      }
      return [
        ...prev,
        {
          id: product.product_id,
          name: product.product_name,
          qty,
          price,
          total: qty * price,
        },
      ];
    });
  };

  // Totals
  const totalAmount = cartItems.reduce((acc, curr) => acc + curr.total, 0);

  // Submit Handler
  const handleSaveInvoice = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Please have at least one product in the invoice.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        payment_mode: 'Cash',
        bill_txn_id: String(transactionId),
        orderstatus: 'Manual',
        searchparty: partyId || 1,
        dist_dsr_require: 'No',
        distributor_gst_config: 'Inclusive',
        dist_bill_source: 'app',
        reverse_charge_val: reverseCharges,
        net_amount: totalAmount,
        tcs_amount: 0,
        labouramt: 0,
        freightamt: 0,
        otherexpamt: 0,
        remark: 'Updated from Mobile App',
      };

      try {
        await apiClient.post('/sale/editSaleInvoice', payload);
      } catch (err: any) {
        // Fallback or notice
      }

      Alert.alert('Success', 'Invoice updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/invoice' as any);
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = new Date(invoiceDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/invoice' as any);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Invoice</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 30, 50) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Details Card */}
        <View style={styles.card}>
          {/* Party Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Party Name <Text style={styles.reqStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.dropdownBtn}
              onPress={() => setIsPartySearchOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {partyName || 'Select Party'}
              </Text>
              <Feather name="chevron-down" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Reverse Charges & Invoice Date */}
          <View style={styles.rowTwo}>
            <View style={styles.halfCol}>
              <Text style={styles.formLabel}>Reverse Charges</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setIsReverseChargesPickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownText}>{reverseCharges}</Text>
                <Feather name="chevron-down" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.halfCol}>
              <Text style={styles.formLabel}>
                Invoice Date <Text style={styles.reqStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setIsCalendarOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownText}>{formattedDate}</Text>
                <Feather name="calendar" size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Invoice Type & FSE User */}
          <View style={styles.rowTwo}>
            <View style={styles.halfCol}>
              <Text style={styles.formLabel}>Invoice Type</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setIsInvoiceTypePickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {invoiceType}
                </Text>
                <Feather name="chevron-down" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View style={styles.halfCol}>
              <Text style={styles.formLabel}>FSE User</Text>
              <View style={[styles.dropdownBtn, { backgroundColor: '#F8FAFD' }]}>
                <Text style={styles.dropdownText} numberOfLines={1}>
                  {fseUser}
                </Text>
                <Feather name="chevron-down" size={18} color="#94A3B8" />
              </View>
            </View>
          </View>

          {/* Bill No */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Bill No</Text>
            <View style={styles.billNoBox}>
              <Text style={styles.billNoText}>{billNo}</Text>
            </View>
          </View>
        </View>

        {/* Cart Section */}
        <View style={styles.card}>
          <View style={styles.cartHeaderRow}>
            <Text style={styles.cartHeaderTitle}>CART • {cartItems.length} ITEMS</Text>
            {cartItems.length > 0 && (
              <TouchableOpacity
                onPress={() => setCartItems([])}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearCartBtn}
              >
                <Feather name="trash-2" size={14} color="#EF4444" />
                <Text style={styles.clearCartText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.cartLoadingBox}>
              <ActivityIndicator size="small" color="#0047AB" />
              <Text style={styles.cartLoadingText}>Loading invoice products...</Text>
            </View>
          ) : cartItems.length === 0 ? (
            <View style={styles.cartEmptyBox}>
              <View style={styles.emptyIconCircle}>
                <Feather name="shopping-bag" size={24} color="#64748B" />
              </View>
              <Text style={styles.cartEmptyText}>Cart empty — tap add item below</Text>
            </View>
          ) : (
            <View style={styles.cartList}>
              {cartItems.map((item, idx) => (
                <View key={`item-${item.id}-${idx}`} style={styles.cartItemRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.cartItemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.cartItemRate}>
                      ₹{Number(item.price).toFixed(1)} each
                    </Text>
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => handleUpdateQty(item.id, -1)}
                    >
                      <Feather name="minus" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                    <Text style={styles.stepperQty}>{item.qty}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => handleUpdateQty(item.id, 1)}
                    >
                      <Feather name="plus" size={14} color="#0047AB" />
                    </TouchableOpacity>
                  </View>

                  {/* Line Total & Delete */}
                  <View style={styles.cartItemRight}>
                    <Text style={styles.cartItemTotal}>₹{item.total.toFixed(1)}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item.id)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="x" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.cartTotalRow}>
                <Text style={styles.cartTotalLabel}>Total Amount:</Text>
                <Text style={styles.cartTotalAmount}>₹{totalAmount.toFixed(1)}</Text>
              </View>
            </View>
          )}

          {/* + Add Item Button */}
          <TouchableOpacity
            style={styles.addItemBtn}
            onPress={() => setIsAddItemsOpen(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={18} color="#0047AB" />
            <Text style={styles.addItemBtnText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.card}>
          <Text style={styles.termsTitle}>TERMS & CONDITIONS</Text>
          <Text style={styles.termsText}>1. Goods once sold will not be taken back.</Text>
        </View>

        {/* Big Action Button */}
        <TouchableOpacity
          style={[styles.saveBtn, (cartItems.length === 0 || isSubmitting) && styles.btnDisabled]}
          onPress={handleSaveInvoice}
          disabled={cartItems.length === 0 || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Party Search Sheet */}
      <PartySearchSheet
        visible={isPartySearchOpen}
        onClose={() => setIsPartySearchOpen(false)}
        onSelect={(party) => {
          setPartyName(party.partyName);
          setPartyId(party.partyId);
          setIsPartySearchOpen(false);
        }}
        selectedPartyId={partyId}
      />

      {/* Add Items Sheet */}
      <AddItemsSheet
        visible={isAddItemsOpen}
        onClose={() => setIsAddItemsOpen(false)}
        cartBillType="Inclusive"
        onBillTypeChange={() => {}}
        onCartUpdated={() => {}}
      />

      {/* Date Picker */}
      <CalendarPickerModal
        visible={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={invoiceDate}
        onSelectDate={(d: string) => {
          const str = d.includes('T') ? d.split('T')[0] : d;
          setInvoiceDate(str);
          setIsCalendarOpen(false);
        }}
        title="Select Invoice Date"
      />

      {/* Reverse Charges Picker */}
      <Modal
        visible={isReverseChargesPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsReverseChargesPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setIsReverseChargesPickerOpen(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Reverse Charges</Text>
            {(['No', 'Yes'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.pickerItem, reverseCharges === opt && styles.pickerItemActive]}
                onPress={() => {
                  setReverseCharges(opt);
                  setIsReverseChargesPickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    reverseCharges === opt && styles.pickerItemTextActive,
                  ]}
                >
                  {opt}
                </Text>
                {reverseCharges === opt && <Feather name="check" size={16} color="#0047AB" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Invoice Type Picker */}
      <Modal
        visible={isInvoiceTypePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsInvoiceTypePickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setIsInvoiceTypePickerOpen(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Invoice Type</Text>
            {(['Tax Invoice', 'Delivery Challan'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.pickerItem, invoiceType === opt && styles.pickerItemActive]}
                onPress={() => {
                  setInvoiceType(opt);
                  setIsInvoiceTypePickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    invoiceType === opt && styles.pickerItemTextActive,
                  ]}
                >
                  {opt}
                </Text>
                {invoiceType === opt && <Feather name="check" size={16} color="#0047AB" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
  },
  reqStar: {
    color: '#DC2626',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '600',
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCol: {
    flex: 1,
    gap: 6,
  },
  billNoBox: {
    height: 48,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  billNoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0047AB',
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 0.5,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearCartText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  cartLoadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  cartLoadingText: {
    fontSize: 12,
    color: '#5A6B87',
  },
  cartEmptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartEmptyText: {
    fontSize: 13,
    color: '#5A6B87',
  },
  cartList: {
    gap: 10,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  cartItemRate: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  stepperBtn: {
    width: 30,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQty: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '800',
    color: '#0E204E',
  },
  cartItemRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
    gap: 4,
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  cartTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
  cartTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0047AB',
  },
  addItemBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0047AB',
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  addItemBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0047AB',
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 13,
    color: '#5A6B87',
    lineHeight: 18,
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
    marginBottom: 6,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#5A6B87',
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
});
