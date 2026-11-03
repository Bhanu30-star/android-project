import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  invoiceService,
  RetailerParty,
  CartLineItem,
} from '@/api/invoiceService';
import {
  InvoiceDraftState,
  initialDraftState,
  invoiceStorage,
} from '@/features/invoice/invoiceStore';
import {
  BillType,
  formatIndianCurrency,
  calculateInvoiceTotals,
  toPaise,
  toRupees,
} from '@/features/invoice/calc';

// Subcomponents & Modals
import { PartySearchSheet } from '@/components/invoice/PartySearchSheet';
import { AddSellerModal } from '@/components/invoice/AddSellerModal';
import { AddItemsSheet } from '@/components/invoice/AddItemsSheet';
import { ReviewAndSubmitSheet } from '@/components/invoice/ReviewAndSubmitSheet';
import { AdditionalChargesSheet } from '@/components/invoice/AdditionalChargesSheet';
import { CalendarPickerModal } from '@/components/common/CalendarPickerModal';
import { SoldBySelectSheet } from '@/components/invoice/SoldBySelectSheet';
import { AppDrawer } from '@/components/navigation/AppDrawer';
import { useAuth } from '@/hooks/useAuth';

export default function GenerateInvoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  // State
  const [draft, setDraft] = useState<InvoiceDraftState>(initialDraftState);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modals & Bottom Sheets
  const [partySearchOpen, setPartySearchOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [addSellerOpen, setAddSellerOpen] = useState(false);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(false);
  const [soldByOpen, setSoldByOpen] = useState(false);

  // Quick Pickers
  const [reverseChargePickerOpen, setReverseChargePickerOpen] = useState(false);
  const [invoiceTypePickerOpen, setInvoiceTypePickerOpen] = useState(false);
  const [deliveryModePickerOpen, setDeliveryModePickerOpen] = useState(false);

  // Load draft on mount
  useEffect(() => {
    (async () => {
      const saved = await invoiceStorage.loadDraft();
      if (saved && (saved.party || saved.charges.labour || saved.remark)) {
        Alert.alert(
          'Resume Draft?',
          `An unsaved invoice draft for ${saved.party?.partyName || 'Customer'} was found. Would you like to resume it?`,
          [
            {
              text: 'Discard',
              style: 'destructive',
              onPress: async () => {
                await invoiceStorage.clearDraft();
              },
            },
            {
              text: 'Resume',
              onPress: () => {
                setDraft(saved);
              },
            },
          ]
        );
      }
    })();
  }, []);

  // Update draft & auto-save
  const updateDraft = (patch: Partial<InvoiceDraftState>) => {
    setDraft((prev) => {
      const updated = { ...prev, ...patch };
      invoiceStorage.saveDraft(updated);
      return updated;
    });
  };

  // Cart Query
  const {
    data: cartData,
    isLoading: isCartLoading,
    refetch: refetchCart,
  } = useQuery({
    queryKey: ['invoice-cart'],
    queryFn: () => invoiceService.getCartDetail('No'),
  });

  const cartLines: CartLineItem[] = cartData?.cart_list || [];

  const handlePartySelected = async (p: RetailerParty) => {
    updateDraft({ party: p });
    try {
      const overdues = await invoiceService.fetchPartyOverdues(p.partyId);
      updateDraft({
        party: p,
        creditAmount: overdues.creditOverdues,
        advanceAmount: overdues.advanceAmt,
        shippingAddress: overdues.shipAddVal || draft.shippingAddress,
        charges: {
          ...draft.charges,
          tcsApplicable: overdues.tcsApply === 'Yes',
        },
      });
    } catch {
      // party chosen without overdues network failure
    }
  };

  // Clear / remove item cart mutation
  const clearCartMutation = useMutation({
    mutationFn: (cartId?: number) => invoiceService.clearCart(cartId),
    onMutate: async (cartId) => {
      await queryClient.cancelQueries({ queryKey: ['invoice-cart'] });
      const previousData = queryClient.getQueryData(['invoice-cart']);
      queryClient.setQueryData(['invoice-cart'], (old: any) => {
        if (!old) return old;
        if (!cartId || cartId === 0) {
          return {
            ...old,
            cart_list: [],
            total_amount: 0,
            total_discount: 0,
            total_tax_amount: 0,
            total_cess_amount: 0,
            total_net_amount: 0,
            total_crate: 0,
            total_bottel: 0,
          };
        }
        return {
          ...old,
          cart_list: (old.cart_list || []).filter(
            (item: any) => (item.cart_id || item.cart_detail_id) !== cartId
          ),
        };
      });
      return { previousData };
    },
    onError: (err: any, _cartId, context: any) => {
      if (context?.previousData) {
        queryClient.setQueryData(['invoice-cart'], context.previousData);
      }
      Alert.alert('Error', err?.message || 'Could not update cart');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-cart'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-product-catalog'] });
      refetchCart();
    },
  });

  const handleClearCartPrompt = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from the cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearCartMutation.mutate(undefined),
        },
      ]
    );
  };

  const handleDeleteLine = (cartId: number) => {
    Alert.alert('Remove Item', 'Remove this product from the invoice?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => clearCartMutation.mutate(cartId),
      },
    ]);
  };

  // Unified tax preference change handler
  const handleTaxPrefChange = (pref: BillType) => {
    if (pref === draft.taxPreference) return;
    if (cartLines.length > 0) {
      Alert.alert(
        'Change Tax Mode?',
        'Changing tax mode requires clearing the existing cart items to re-apply taxes properly.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Cart Now',
            style: 'destructive',
            onPress: () => clearCartMutation.mutate(undefined),
          },
        ]
      );
      return;
    }
    updateDraft({ taxPreference: pref });
  };

  // Live Totals calculation
  const totals = calculateInvoiceTotals(
    cartLines.map((line) => ({
      baseAmount: line.total_amount,
      discountAmount: line.discount,
      taxableAmount: line.taxable_amount || line.total_amount - line.discount,
      gstAmount: line.tax_amount,
      cessAmount: line.cess_amount,
      netAmount: line.net_amount,
    })),
    draft.charges
  );

  // Formatted invoice date
  const formattedInvoiceDate = new Date(draft.invoiceDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header Bar (Matching Screenshot 1: ☰  BTHAWK +  ⚙) */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => setIsDrawerOpen(true)}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Feather name="menu" size={22} color="#0E204E" />
        </TouchableOpacity>

        <Text style={styles.headerBrandTitle}>BTHAWK +</Text>

        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Feather name="settings" size={20} color="#0E204E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Top Billing Details Card (Screenshot 1) */}
        <View style={styles.card}>
          {/* Party Name Row with + Add Seller */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Party Name <Text style={styles.reqStar}>*</Text>
            </Text>
            <View style={styles.partyRow}>
              <TouchableOpacity
                style={styles.partyDropdown}
                onPress={() => setPartySearchOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.partyDropdownText} numberOfLines={1}>
                  {draft.party ? draft.party.partyName : 'Cash'}
                </Text>
                <Feather name="chevron-down" size={16} color="#5A6B87" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addSellerBtn}
                onPress={() => setAddSellerOpen(true)}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={14} color="#0047AB" />
                <Text style={styles.addSellerBtnText}>Add Seller</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reverse Charges & Invoice Date Row */}
          <View style={styles.twoColRow}>
            {/* Reverse Charges */}
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Reverse Charges</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setReverseChargePickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownInputText}>{draft.reverseCharge || 'No'}</Text>
                <Feather name="chevron-down" size={16} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            {/* Invoice Date */}
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>
                Invoice Date <Text style={styles.reqStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setCalendarOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownInputText}>{formattedInvoiceDate}</Text>
                <Feather name="calendar" size={16} color="#5A6B87" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Invoice Type & FSE User Row */}
          <View style={styles.twoColRow}>
            {/* Invoice Type */}
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Invoice Type</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setInvoiceTypePickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownInputText} numberOfLines={1}>
                  {draft.invoiceType}
                </Text>
                <Feather name="chevron-down" size={16} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            {/* FSE User */}
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>FSE User</Text>
              <TouchableOpacity
                style={styles.dropdownInput}
                onPress={() => setSoldByOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownInputText} numberOfLines={1}>
                  {draft.soldByName || 'Admin'}
                </Text>
                <Feather name="chevron-down" size={16} color="#5A6B87" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. CART Section (Screenshot 1) */}
        <View style={styles.card}>
          <View style={styles.cartHeaderRow}>
            <Text style={styles.cartHeaderTitle}>
              CART · {cartLines.length} ITEM{cartLines.length === 1 ? '' : 'S'}
            </Text>

            {cartLines.length > 0 && (
              <TouchableOpacity
                style={styles.clearCartBtn}
                onPress={handleClearCartPrompt}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={14} color="#DC2626" />
                <Text style={styles.clearCartBtnText}>Clear Cart</Text>
              </TouchableOpacity>
            )}
          </View>

          {isCartLoading ? (
            <View style={styles.cartLoadingContainer}>
              <ActivityIndicator size="small" color="#0047AB" />
            </View>
          ) : cartLines.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <View style={styles.emptyBagCircle}>
                <Feather name="shopping-bag" size={24} color="#94A3B8" />
              </View>
              <Text style={styles.emptyCartPrompt}>
                Cart empty — tap add item below
              </Text>
            </View>
          ) : (
            <View style={styles.cartItemsList}>
              {cartLines.map((line, index) => {
                const totalGstPaise = toPaise(line.tax_amount || 0);
                const halfGstPaise = Math.floor(totalGstPaise / 2);
                const otherHalfPaise = totalGstPaise - halfGstPaise;
                const cgst = toRupees(halfGstPaise);
                const sgst = toRupees(otherHalfPaise);
                const halfRate = (line.product_gst || 0) / 2;

                return (
                  <View key={line.cart_id} style={styles.cartLineCard}>
                    <View style={styles.cartLineTop}>
                      <View style={styles.lineIndexBadge}>
                        <Text style={styles.lineIndexText}>{index + 1}</Text>
                      </View>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.cartProductName} numberOfLines={1}>
                          {line.product_name || line.item || 'Product'}
                        </Text>
                        {line.product_code ? (
                          <Text style={styles.cartProductSku}>{line.product_code}</Text>
                        ) : null}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteLine(line.cart_id)}
                        style={styles.lineDeleteBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={15} color="#DC2626" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cartLineMetrics}>
                      <View style={styles.metricCol}>
                        <Text style={styles.metricLabel}>QTY</Text>
                        <Text style={styles.metricVal}>{line.quantity}</Text>
                      </View>
                      <View style={styles.metricDivider} />
                      <View style={styles.metricCol}>
                        <Text style={styles.metricLabel}>RATE</Text>
                        <Text style={styles.metricVal}>{formatIndianCurrency(line.price)}</Text>
                      </View>
                      <View style={styles.metricDivider} />
                      <View style={styles.metricCol}>
                        <Text style={styles.metricLabel}>TAXABLE</Text>
                        <Text style={styles.metricVal}>{formatIndianCurrency(line.taxable_amount)}</Text>
                      </View>
                      <View style={styles.metricDivider} />
                      <View style={styles.metricCol}>
                        <Text style={styles.metricLabel}>NET</Text>
                        <Text style={[styles.metricVal, { color: '#0047AB', fontWeight: '800' }]}>
                          {formatIndianCurrency(line.net_amount)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cartLineGstRow}>
                      <Text style={styles.gstSplitText}>
                        GST {line.product_gst}% ({formatIndianCurrency(line.tax_amount)}): CGST {halfRate}% ({formatIndianCurrency(cgst)}) + SGST {halfRate}% ({formatIndianCurrency(sgst)})
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Buttons below Cart: + Add Item  &  + New item */}
          <View style={styles.cartButtonsRow}>
            <TouchableOpacity
              style={styles.addItemOutlineBtn}
              onPress={() => setAddItemsOpen(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#0047AB" />
              <Text style={styles.addItemOutlineText}>Add Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newItemSolidBtn}
              onPress={() => setAddItemsOpen(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#FFFFFF" />
              <Text style={styles.newItemSolidText}>New item</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. TERMS & CONDITIONS (Screenshot 1 & 2) */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>TERMS & CONDITIONS</Text>
          <View style={styles.termsList}>
            <Text style={styles.termItem}>
              1. Goods once sold will not be taken back.
            </Text>
            <Text style={styles.termItem}>
              2. Payment for goods to be made within the stipulated time.
            </Text>
            <Text style={styles.termItem}>
              3. INR 300 will be charged in case of cheque return.
            </Text>
          </View>
        </View>

        {/* 5. PAYMENT MODE (Screenshot 2) */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>PAYMENT MODE</Text>
          <View style={styles.paymentModePillsRow}>
            {(['Cash', 'Cheque', 'Credit', 'Online'] as const).map((mode) => {
              const isSelected = draft.paymentMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.paymentPill,
                    isSelected && styles.paymentPillActive,
                  ]}
                  onPress={() => updateDraft({ paymentMode: mode })}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.paymentPillText,
                      isSelected && styles.paymentPillTextActive,
                    ]}
                  >
                    {mode}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. SUMMARY (Screenshot 2) */}
        <View style={styles.card}>
          <Text style={styles.sectionHeaderTitle}>SUMMARY</Text>

          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>
              {formatIndianCurrency(totals.totalBaseAmount)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.summaryItemRow}
            onPress={() => setChargesOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.summaryLabel}>Additional Charges</Text>
            <View style={styles.additionalChargesPill}>
              {totals.totalAdditionalCharges > 0 ? (
                <Text style={styles.additionalChargesPillText}>
                  +{formatIndianCurrency(totals.totalAdditionalCharges)}
                </Text>
              ) : (
                <Feather name="plus" size={14} color="#0047AB" />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItemRow}>
            <Text style={styles.netAmountLabel}>Net Amount</Text>
            <Text style={styles.netAmountValue}>
              {formatIndianCurrency(totals.roundedPayableAmount)}
            </Text>
          </View>
        </View>

        {/* 7. Delivery Mode, Additional Charges & Remark (Screenshot 2) */}
        <View style={styles.card}>
          {/* Delivery Mode */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Delivery Mode</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={() => setDeliveryModePickerOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownInputText}>{draft.deliveryMode}</Text>
              <Feather name="chevron-down" size={16} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Additional Charges Trigger */}
          <View style={styles.formGroup}>
            <View style={styles.chargesLabelRow}>
              <Text style={styles.formLabel}>Additional Charges</Text>
              <TouchableOpacity
                style={styles.additionalChargesCircleBtn}
                onPress={() => setChargesOpen(true)}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={14} color="#0047AB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Remark */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Remark</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="Enter Remarks"
              placeholderTextColor="#94A3B8"
              value={draft.remark}
              onChangeText={(val) => updateDraft({ remark: val })}
            />
          </View>
        </View>

        {/* 8. Big Action Button: Generate Invoice (Screenshot 2) */}
        <TouchableOpacity
          style={[
            styles.generateInvoiceBtn,
            cartLines.length === 0 && styles.btnDisabled,
          ]}
          onPress={() => {
            if (cartLines.length === 0) {
              Alert.alert('Cart Empty', 'Please add at least one product before generating invoice.');
              return;
            }
            setReviewOpen(true);
          }}
          activeOpacity={0.85}
        >
          <Feather name="shopping-cart" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.generateInvoiceBtnText}>Generate Invoice</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 9. Bottom Navigation Bar (Screenshot 1 & 2) */}
      <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.8}>
          <View style={[styles.tabIconCircle, styles.tabIconCircleActive]}>
            <Ionicons name="receipt" size={18} color="#0047AB" />
          </View>
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push('/purchase-credit' as any)}
          activeOpacity={0.8}
        >
          <Feather name="shopping-cart" size={18} color="#5A6B87" />
          <Text style={styles.tabLabel}>Purchase</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push({ pathname: '/dashboard', params: { tab: 'dashboard' } } as any)}
          activeOpacity={0.8}
        >
          <Feather name="home" size={18} color="#5A6B87" />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push({ pathname: '/dashboard', params: { tab: 'reports' } } as any)}
          activeOpacity={0.8}
        >
          <Feather name="bar-chart-2" size={18} color="#5A6B87" />
          <Text style={styles.tabLabel}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => router.push({ pathname: '/dashboard', params: { tab: 'chat' } } as any)}
          activeOpacity={0.8}
        >
          <Feather name="message-square" size={18} color="#5A6B87" />
          <Text style={styles.tabLabel}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* MODALS & SHEETS */}
      <AppDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeRoute="/generate-invoice"
        onLogout={logout}
      />

      <PartySearchSheet
        visible={partySearchOpen}
        onClose={() => setPartySearchOpen(false)}
        selectedPartyId={draft.party?.partyId}
        onSelect={handlePartySelected}
        onAddNew={() => setAddSellerOpen(true)}
      />

      <CalendarPickerModal
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={draft.invoiceDate}
        onSelectDate={(ymd) => {
          const localNow = new Date();
          const [y, m, d] = ymd.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d, localNow.getHours(), localNow.getMinutes(), localNow.getSeconds());
          updateDraft({ invoiceDate: dateObj.toISOString() });
        }}
        maxDate={new Date()}
        title="Select Invoice Date"
      />

      <AddSellerModal
        visible={addSellerOpen}
        onClose={() => setAddSellerOpen(false)}
        onSuccess={handlePartySelected}
      />

      <AddItemsSheet
        visible={addItemsOpen}
        onClose={() => setAddItemsOpen(false)}
        cartBillType={draft.taxPreference}
        onBillTypeChange={handleTaxPrefChange}
        searchSource={draft.soldBy}
        cartLines={cartLines}
        onCartUpdated={() => refetchCart()}
        hasExistingCartItems={cartLines.length > 0}
        onClearCart={() => clearCartMutation.mutate(undefined)}
      />

      <SoldBySelectSheet
        visible={soldByOpen}
        onClose={() => setSoldByOpen(false)}
        selectedId={draft.soldBy}
        onSelect={(user) => {
          updateDraft({ soldBy: user.id, soldByName: user.name });
        }}
      />

      <ReviewAndSubmitSheet
        visible={reviewOpen}
        onClose={() => setReviewOpen(false)}
        draft={draft}
        cartLines={cartLines}
        cartTotals={{
          total_amount: cartData?.total_amount || 0,
          total_discount: cartData?.total_discount || 0,
          total_tax_amount: cartData?.total_tax_amount || 0,
          total_cess_amount: cartData?.total_cess_amount || 0,
          total_net_amount: cartData?.total_net_amount || 0,
          total_crate: cartData?.total_crate,
          total_bottle: cartData?.total_bottel,
        }}
        onUpdateDraft={updateDraft}
        onInvoiceCreated={() => {
          setDraft(initialDraftState);
          refetchCart();
        }}
      />

      <AdditionalChargesSheet
        visible={chargesOpen}
        onClose={() => setChargesOpen(false)}
        charges={draft.charges}
        onSave={(newCharges) => updateDraft({ charges: newCharges })}
      />

      {/* Reverse Charges Picker Modal */}
      <Modal
        visible={reverseChargePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReverseChargePickerOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setReverseChargePickerOpen(false)}
          />
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Reverse Charges</Text>
            {(['No', 'Yes'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.pickerOption,
                  draft.reverseCharge === opt && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  updateDraft({ reverseCharge: opt });
                  setReverseChargePickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    draft.reverseCharge === opt && styles.pickerOptionTextActive,
                  ]}
                >
                  {opt}
                </Text>
                {draft.reverseCharge === opt && (
                  <Feather name="check" size={16} color="#0047AB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Invoice Type Picker Modal */}
      <Modal
        visible={invoiceTypePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInvoiceTypePickerOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setInvoiceTypePickerOpen(false)}
          />
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Invoice Type</Text>
            {(['Tax Invoice', 'Delivery Challan'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.pickerOption,
                  draft.invoiceType === t && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  updateDraft({ invoiceType: t });
                  setInvoiceTypePickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    draft.invoiceType === t && styles.pickerOptionTextActive,
                  ]}
                >
                  {t}
                </Text>
                {draft.invoiceType === t && (
                  <Feather name="check" size={16} color="#0047AB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Delivery Mode Picker Modal */}
      <Modal
        visible={deliveryModePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeliveryModePickerOpen(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDeliveryModePickerOpen(false)}
          />
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Delivery Mode</Text>
            {(['Manual', 'Courier'] as const).map((dm) => (
              <TouchableOpacity
                key={dm}
                style={[
                  styles.pickerOption,
                  draft.deliveryMode === dm && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  updateDraft({ deliveryMode: dm });
                  setDeliveryModePickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    draft.deliveryMode === dm && styles.pickerOptionTextActive,
                  ]}
                >
                  {dm}
                </Text>
                {draft.deliveryMode === dm && (
                  <Feather name="check" size={16} color="#0047AB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBrandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    elevation: 2,
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    gap: 12,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  reqStar: {
    color: '#DC2626',
    fontWeight: '800',
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  partyDropdown: {
    flex: 1,
    height: 46,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyDropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
  },
  addSellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addSellerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownInput: {
    height: 46,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownInputText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
    flex: 1,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  cartHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: 0.5,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearCartBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  cartLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyCartBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyBagCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  cartItemsList: {
    gap: 10,
    marginTop: 4,
  },
  cartLineCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 12,
    gap: 8,
  },
  cartLineTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  lineIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  cartProductName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  cartProductSku: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
  },
  lineDeleteBtn: {
    padding: 4,
  },
  cartLineMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5A6B87',
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E204E',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  cartLineGstRow: {
    paddingTop: 2,
  },
  gstSplitText: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '500',
  },
  cartButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  addItemOutlineBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0047AB',
    borderStyle: 'dashed',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addItemOutlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0047AB',
  },
  newItemSolidBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  newItemSolidText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: 0.5,
  },
  termsList: {
    gap: 6,
  },
  termItem: {
    fontSize: 12,
    color: '#5A6B87',
    lineHeight: 18,
  },
  paymentModePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentPill: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentPillActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  paymentPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B87',
  },
  paymentPillTextActive: {
    color: '#FFFFFF',
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#5A6B87',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
  },
  additionalChargesPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  additionalChargesPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  netAmountLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
  },
  netAmountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0047AB',
  },
  chargesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  additionalChargesCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remarksInput: {
    height: 44,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0E204E',
  },
  generateInvoiceBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0047AB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    marginTop: 4,
  },
  generateInvoiceBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  tabIconCircle: {
    padding: 2,
  },
  tabIconCircleActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
  },
  tabLabelActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 8,
    elevation: 16,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
    marginBottom: 6,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pickerOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  pickerOptionTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
});
