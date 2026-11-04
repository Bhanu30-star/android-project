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
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  invoiceService,
  RetailerParty,
  CartLineItem,
  GenerateInvoicePayload,
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
} from '@/features/invoice/calc';

// Subcomponents & Modals
import { PartySearchSheet } from '@/components/invoice/PartySearchSheet';
import { AddSellerModal } from '@/components/invoice/AddSellerModal';
import { AddItemsSheet } from '@/components/invoice/AddItemsSheet';
import { AdditionalChargesSheet } from '@/components/invoice/AdditionalChargesSheet';
import { CalendarPickerModal } from '@/components/common/CalendarPickerModal';
import { SoldBySelectSheet } from '@/components/invoice/SoldBySelectSheet';
import { AppDrawer } from '@/components/navigation/AppDrawer';
import { AppTabBar } from '@/components/navigation/AppTabBar';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/theme/tokens';

const CASH_PARTY: RetailerParty = {
  partyId: 0,
  partyName: 'Cash',
  partyPhone: '',
  partyGst: '',
  partyAddress: '',
};

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
  const [chargesOpen, setChargesOpen] = useState(false);
  const [soldByOpen, setSoldByOpen] = useState(false);

  // Quick Pickers
  const [reverseChargePickerOpen, setReverseChargePickerOpen] = useState(false);
  const [invoiceTypePickerOpen, setInvoiceTypePickerOpen] = useState(false);

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
      invoiceStorage.saveDraft(updated).catch(() => {});
      return updated;
    });
  };

  // Live cart query
  const {
    data: cartData,
    isLoading: isCartLoading,
    refetch: refetchCart,
  } = useQuery({
    queryKey: ['invoice-cart'],
    queryFn: () => invoiceService.getCartDetail(),
    staleTime: 5000,
  });

  const cartLines: CartLineItem[] = cartData?.cart_list || [];
  const cartTotals = cartData || {};

  // Delete line item
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

  // Party select handler
  const handlePartySelected = async (p: RetailerParty | null) => {
    if (!p || !p.partyId || p.partyId === 0) {
      updateDraft({
        party: null,
        creditAmount: 0,
        advanceAmount: 0,
        shippingAddress: '',
      });
      return;
    }

    updateDraft({ party: p });
    try {
      const overdues = await invoiceService.fetchPartyOverdues(p.partyId);
      updateDraft({
        party: p,
        creditAmount: overdues.creditOverdues,
        advanceAmount: overdues.advanceAmt,
        shippingAddress: overdues.shipAddVal || draft.shippingAddress,
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

  // Direct Submit Mutation
  const submitMutation = useMutation({
    mutationFn: (payload: GenerateInvoicePayload) => invoiceService.generateSaleInvoice(payload),
    onSuccess: async (res) => {
      await invoiceStorage.clearDraft();
      queryClient.invalidateQueries({ queryKey: ['invoice-cart'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-product-catalog'] });
      const invoiceBillNo = res?.data?.bill_no || res?.data?.invoice_no || 'Invoice';
      Alert.alert(
        'Invoice Generated Successfully',
        `Invoice #${invoiceBillNo} has been generated.`,
        [
          {
            text: 'View Invoices',
            onPress: () => router.push('/invoice' as any),
          },
          {
            text: 'New Invoice',
            onPress: () => {
              setDraft(initialDraftState);
              refetchCart();
            },
          },
        ]
      );
    },
    onError: (err: any) => {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Could not generate invoice. Please try again.';
      const displayMsg = Array.isArray(serverMsg) ? serverMsg.join('\n') : String(serverMsg);
      Alert.alert('Generation Failed', displayMsg);
    },
  });

  const handleDirectSubmit = () => {
    // 1. Party Validation (matching web frontend lines 439-442)
    if (!draft.party || !draft.party.partyId || draft.party.partyId <= 0) {
      Alert.alert(
        'Select Customer / Party',
        'Please select a valid customer/party before generating the invoice.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select Party', onPress: () => setPartySearchOpen(true) },
        ]
      );
      return;
    }

    // 2. Cart Validation (matching web frontend lines 455-458)
    if (cartLines.length === 0) {
      Alert.alert('Cart Empty', 'Please add at least one product before generating invoice.');
      return;
    }

    // 3. Payment Mode Validations (matching web frontend lines 463-481)
    if (['Cheque', 'Both'].includes(draft.paymentMode)) {
      if (!draft.chequeTxnNo || !draft.chequeTxnNo.trim()) {
        Alert.alert('Cheque No Required', 'Please enter cheque/transaction number.');
        return;
      }
      if (!draft.chequeDate || !draft.chequeDate.trim()) {
        Alert.alert('Cheque Date Required', 'Please enter cheque date.');
        return;
      }
      if (!draft.bankName || !draft.bankName.trim()) {
        Alert.alert('Bank Name Required', 'Please enter bank name.');
        return;
      }
    }

    if (draft.paymentMode === 'Credit' && (!draft.creditDays || Number(draft.creditDays) <= 0)) {
      Alert.alert('Credit Days Required', 'Please enter valid credit days for credit payment.');
      return;
    }

    // 4. Exact Math Calculation from Web Frontend (lines 483-500)
    const totalBeforeAnyDiscount = Number((cartTotals as any)?.total_amount) || totals.totalBaseAmount || 1;
    const totalAfterProductDiscount = Number((cartTotals as any)?.total_net_amount) || totals.cartNetAmount || totalBeforeAnyDiscount;
    const productDiscountsSum = Math.max(0, Number((cartTotals as any)?.total_discount || totals.totalProductDiscount || 0));

    const labour = Number(draft.charges.labour || 0);
    const freight = Number(draft.charges.freight || 0);
    const other = Number(draft.charges.other || 0);
    const tcsAmount = draft.charges.tcsApplicable ? Number(draft.charges.tcsAmount || 0) : 0;
    const totalAdditional = labour + freight + other + tcsAmount;
    const overallDiscount = Number(draft.charges.overallDiscount || 0);

    // Final net amount after ALL discounts (net_amount)
    const finalNetAmount = Math.max(1, Number((totalAfterProductDiscount + totalAdditional - overallDiscount).toFixed(2)));
    // calculate_final_amt is total after product discount + additional charges BEFORE bill discount!
    const calculateFinalAmt = Math.max(1, Number((totalAfterProductDiscount + totalAdditional).toFixed(2)));

    // 5. Date & Time Clamped to Present (cannot be future date)
    const now = new Date();
    const invDate = new Date(draft.invoiceDate);
    const validInvDate = !isNaN(invDate.getTime()) ? invDate : now;
    const finalDate = validInvDate > now ? now : validInvDate;
    const pad = (n: number) => String(n).padStart(2, '0');
    const safeTxnDate = `${finalDate.getFullYear()}-${pad(finalDate.getMonth() + 1)}-${pad(finalDate.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const isChequeOrOnline = ['Cheque', 'Both', 'Online'].includes(draft.paymentMode);

    const payload: GenerateInvoicePayload = {
      source: 'app',
      party_id: draft.party.partyId,
      searchSource_admin: String(draft.soldBy || 'admin'),
      credit_amt: Number(draft.creditAmount) || 0,
      advance_amt: Number(draft.advanceAmount) || 0,
      invoice_type: draft.invoiceType,
      invoice_txn_date: safeTxnDate,
      billtype: draft.taxPreference || 'Inclusive',
      reverse_charge: 'No',
      service_type: draft.deliveryMode || 'Manual',
      total_crate: Number((cartTotals as any).total_crate) || 0,
      total_bottle: Number((cartTotals as any).total_bottle || (cartTotals as any).total_bottel) || 0,
      purchase_orderno: draft.purchaseOrderNo || '',
      shipping_address: draft.shippingAddress || '',
      broker_no: draft.brokerNo || '',
      docket_no: draft.docketNo || '',
      courier_agency: draft.courierAgency || '',
      courier_date: draft.courierDate || '',
      remark: draft.remark || '',

      tot_amt_val: Math.max(1, Math.round(totalBeforeAnyDiscount)),
      labour_charges: labour ? String(labour) : '',
      freight_charges: freight ? String(freight) : '',
      other_expence_charges: other ? String(other) : '',
      tcs_applicable: draft.charges.tcsApplicable ? 'Yes' : 'No',
      tcs_amount: draft.charges.tcsApplicable && draft.charges.tcsAmount ? String(draft.charges.tcsAmount) : '',
      total_discount: overallDiscount,
      net_amount: finalNetAmount,

      calculate_final_amt: calculateFinalAmt,
      calculate_disc_amt: productDiscountsSum,
      calculate_cess_amt: Number((cartTotals as any)?.total_cess_amount || totals.totalCessAmount || 0),

      dist_dsr_require: 'No',
      distributor_place_supply: '',
      signature: draft.signatureBase64 || '',
      payment_mode: draft.paymentMode,
      payment_type: draft.paymentMode === 'Online' ? (draft.paymentType || 'UPI') : '',
      bank_name: isChequeOrOnline ? (draft.bankName || '') : '',
      cheque_txn_no: isChequeOrOnline ? (draft.chequeTxnNo || '') : '',
      cheque_txn_date: isChequeOrOnline ? (draft.chequeDate || '') : '',
      deposit_bank: isChequeOrOnline && draft.depositBank ? Number(draft.depositBank) : 0,
      cheque_amt: Number(draft.chequeAmt) || 0,
      credit_days: draft.paymentMode === 'Credit' ? Number(draft.creditDays || 0) : 0,
    };

    Alert.alert(
      'Generate Invoice',
      `Generate invoice for ${draft.party.partyName} with Total ${formatIndianCurrency(finalNetAmount)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => submitMutation.mutate(payload),
        },
      ]
    );
  };

  const totalQuantity = cartLines.reduce(
    (acc, l) => acc + (parseFloat(String((l as any).quantity ?? (l as any).qty ?? 1)) || 1),
    0
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => setIsDrawerOpen(true)}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Feather name="menu" size={22} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerBrandTitle}>Generate Invoice</Text>

        <TouchableOpacity
          onPress={() => router.push('/profile')}
          style={styles.headerIconBtn}
          activeOpacity={0.7}
        >
          <Feather name="settings" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Customer / Party Selection Card (Matching Screenshot 1) */}
        <View style={styles.card}>
          {/* Row 1: Party Name + Add Seller Button */}
          <View style={styles.partyRowContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formLabel}>
                Party Name <Text style={styles.reqStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.partySelectDropdown}
                onPress={() => setPartySearchOpen(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.partySelectText,
                    (!draft.party?.partyId || draft.party.partyId <= 0) && styles.partyPlaceholderText,
                  ]}
                  numberOfLines={1}
                >
                  {draft.party?.partyId && draft.party.partyId > 0
                    ? `${draft.party.partyName}${draft.party.partyPhone ? ` (${draft.party.partyPhone})` : ''}`
                    : 'Select Customer / Party'}
                </Text>
                <Feather name="chevron-down" size={18} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.addSellerBtn}
              onPress={() => setAddSellerOpen(true)}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addSellerBtnText}>Add Seller</Text>
            </TouchableOpacity>
          </View>

          {/* Selected non-cash party meta chips */}
          {draft.party && draft.party.partyId !== 0 && (
            <View style={styles.selectedPartyMetaRow}>
              {draft.party.partyPhone ? (
                <View style={styles.partyMetaChip}>
                  <Feather name="phone" size={11} color="#0047AB" />
                  <Text style={styles.partyMetaChipText}>{draft.party.partyPhone}</Text>
                </View>
              ) : null}
              {draft.party.partyGst ? (
                <View style={styles.partyMetaChip}>
                  <Text style={styles.partyMetaChipText}>GST: {draft.party.partyGst}</Text>
                </View>
              ) : null}
              {draft.creditAmount > 0 ? (
                <View style={[styles.partyMetaChip, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                  <Text style={[styles.partyMetaChipText, { color: '#DC2626' }]}>
                    Credit: ₹{draft.creditAmount}
                  </Text>
                </View>
              ) : null}
              {draft.advanceAmount > 0 ? (
                <View style={[styles.partyMetaChip, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <Text style={[styles.partyMetaChipText, { color: '#059669' }]}>
                    Advance: ₹{draft.advanceAmount}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={styles.resetToCashBtn}
                onPress={() => handlePartySelected(CASH_PARTY)}
              >
                <Text style={styles.resetToCashText}>Switch to Cash</Text>
              </TouchableOpacity>
            </View>
          )}

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
                <Feather name="chevron-down" size={16} color={Colors.textSecondary} />
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
                <Feather name="calendar" size={15} color={Colors.textSecondary} />
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
                <Feather name="chevron-down" size={16} color={Colors.textSecondary} />
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
                <Feather name="chevron-down" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. CART Section */}
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
                <Feather name="trash-2" size={14} color={Colors.error} style={{ marginRight: 4 }} />
                <Text style={styles.clearCartBtnText}>Clear Cart</Text>
              </TouchableOpacity>
            )}
          </View>

          {isCartLoading ? (
            <View style={styles.cartLoadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : cartLines.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <Feather name="shopping-bag" size={26} color={Colors.textSecondary} />
              <Text style={styles.emptyCartPrompt}>Cart empty — tap Add Item below</Text>
            </View>
          ) : (
            <View style={styles.cartItemsList}>
              {cartLines.map((line) => (
                <View key={line.cart_id} style={styles.cartLineCard}>
                  {/* Line 1: Item Name + Delete Icon */}
                  <View style={styles.cartLineTop}>
                    <Text style={styles.cartProductName} numberOfLines={1}>
                      {line.product_name || line.item || 'Item'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteLine(line.cart_id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Feather name="trash-2" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>

                  {/* Line 2: 4-Column Clean Metrics: Price | Qty | Tax | Total */}
                  <View style={styles.cartLineMetricsRow}>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Price</Text>
                      <Text style={styles.metricVal}>₹{line.price}</Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Qty</Text>
                      <Text style={styles.metricVal}>{line.quantity} PCS</Text>
                    </View>
                    <View style={styles.metricCol}>
                      <Text style={styles.metricLabel}>Tax</Text>
                      <Text style={styles.metricVal}>{line.product_gst || 0} %</Text>
                    </View>
                    <View style={[styles.metricCol, { alignItems: 'flex-end' }]}>
                      <Text style={styles.metricLabel}>Total</Text>
                      <Text style={styles.metricValTotal}>
                        {formatIndianCurrency(line.net_amount || line.total_amount)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Total Banner inside Cart Card */}
              <View style={styles.cartTotalBanner}>
                <Text style={styles.cartTotalBannerLabel}>Total</Text>
                <View style={styles.cartTotalBannerRight}>
                  <Text style={styles.cartTotalQtyText}>Qty: {totalQuantity}</Text>
                  <Text style={styles.cartTotalAmountText}>
                    {formatIndianCurrency(totals.roundedPayableAmount)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 4. Action Buttons Row: [ + Add Item ] and [ + New item ] */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.addItemDashedBtn}
            onPress={() => setAddItemsOpen(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.addItemDashedBtnText}>Add Item</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.newItemSolidBtn}
            onPress={() => setAddItemsOpen(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.newItemSolidBtnText}>New item</Text>
          </TouchableOpacity>
        </View>

        {/* 5. TERMS & CONDITIONS Card */}
        <View style={styles.card}>
          <Text style={styles.termsCardTitle}>TERMS & CONDITIONS</Text>
          <Text style={styles.termsCardText}>1. Goods once sold will not be taken back.</Text>
          <Text style={styles.termsCardText}>
            2. Interest @ 18% p.a. will be charged if payment is delayed beyond credit period.
          </Text>
        </View>

        {/* 5b. INLINE ADDITIONAL CHARGES & BILL DISCOUNT CARD */}
        <View style={styles.card}>
          <View style={styles.chargesSectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitleText}>ADDITIONAL CHARGES & BILL DISCOUNT</Text>
              <Text style={styles.chargesSectionSub}>Apply discount, freight, labour & TCS live on bill</Text>
            </View>
          </View>

          {/* Row 1: Bill Discount (Overall Discount) */}
          <View style={styles.formGroup}>
            <View style={styles.labelWithBadgeRow}>
              <Text style={styles.formLabel}>Bill Discount (₹)</Text>
              {totals.overallDiscount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>- {formatIndianCurrency(totals.overallDiscount)}</Text>
                </View>
              )}
            </View>
            <TextInput
              style={styles.textInputBox}
              placeholder="e.g. 50"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={draft.charges.overallDiscount ? String(draft.charges.overallDiscount) : ''}
              onChangeText={(val) => {
                const num = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
                updateDraft({ charges: { ...draft.charges, overallDiscount: num } });
              }}
            />
          </View>

          {/* Row 2: Labour Charges & Freight Charges */}
          <View style={styles.twoColRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Labour Charges (₹)</Text>
              <TextInput
                style={styles.textInputBox}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={draft.charges.labour ? String(draft.charges.labour) : ''}
                onChangeText={(val) => {
                  const num = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
                  updateDraft({ charges: { ...draft.charges, labour: num } });
                }}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Freight Charges (₹)</Text>
              <TextInput
                style={styles.textInputBox}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={draft.charges.freight ? String(draft.charges.freight) : ''}
                onChangeText={(val) => {
                  const num = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
                  updateDraft({ charges: { ...draft.charges, freight: num } });
                }}
              />
            </View>
          </View>

          {/* Row 3: Other Charges & TCS Applicable */}
          <View style={styles.twoColRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>Other Expenses (₹)</Text>
              <TextInput
                style={styles.textInputBox}
                placeholder="0"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={draft.charges.other ? String(draft.charges.other) : ''}
                onChangeText={(val) => {
                  const num = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
                  updateDraft({ charges: { ...draft.charges, other: num } });
                }}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.formLabel}>TCS Applicable</Text>
              <View style={styles.segmentRow}>
                {(['No', 'Yes'] as const).map((opt) => {
                  const isActive = opt === 'Yes' ? draft.charges.tcsApplicable : !draft.charges.tcsApplicable;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                      onPress={() => {
                        updateDraft({
                          charges: {
                            ...draft.charges,
                            tcsApplicable: opt === 'Yes',
                            tcsAmount: opt === 'Yes' ? draft.charges.tcsAmount : 0,
                          },
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.segmentBtnText, isActive && styles.segmentBtnTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* If TCS is Yes, show TCS Amount input */}
          {draft.charges.tcsApplicable && (
            <View style={[styles.formGroup, { marginTop: 4 }]}>
              <Text style={styles.formLabel}>TCS Amount (₹)</Text>
              <TextInput
                style={styles.textInputBox}
                placeholder="TCS amount"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={draft.charges.tcsAmount ? String(draft.charges.tcsAmount) : ''}
                onChangeText={(val) => {
                  const num = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
                  updateDraft({ charges: { ...draft.charges, tcsAmount: num } });
                }}
              />
            </View>
          )}
        </View>

        {/* 6. INVOICE SUMMARY CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitleText}>BILL CALCULATION SUMMARY</Text>

          <View style={styles.summaryList}>
            {/* Subtotal */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal (Gross)</Text>
              <Text style={styles.summaryVal}>
                {formatIndianCurrency(totals.totalBaseAmount)}
              </Text>
            </View>

            {/* Product Discount */}
            {totals.totalProductDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Item Discount</Text>
                <Text style={[styles.summaryVal, { color: '#059669' }]}>
                  - {formatIndianCurrency(totals.totalProductDiscount)}
                </Text>
              </View>
            )}

            {/* Bill Discount */}
            {totals.overallDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Bill Discount</Text>
                <Text style={[styles.summaryVal, { color: '#059669', fontWeight: '700' }]}>
                  - {formatIndianCurrency(totals.overallDiscount)}
                </Text>
              </View>
            )}

            {/* Additional Charges */}
            {totals.totalAdditionalCharges > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Additional Charges (Labour/Freight/Other)</Text>
                <Text style={[styles.summaryVal, { color: '#0047AB', fontWeight: '700' }]}>
                  + {formatIndianCurrency(totals.totalAdditionalCharges)}
                </Text>
              </View>
            )}

            {/* Taxable Amount */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxable Amount</Text>
              <Text style={styles.summaryVal}>
                {formatIndianCurrency(totals.totalTaxableAmount)}
              </Text>
            </View>

            {/* Total GST */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxes (GST)</Text>
              <Text style={styles.summaryVal}>
                + {formatIndianCurrency(totals.totalGstAmount)}
              </Text>
            </View>

            {/* Round off */}
            {totals.roundOffDifference !== 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Round Off</Text>
                <Text style={styles.summaryVal}>
                  {totals.roundOffDifference > 0
                    ? `+ ${formatIndianCurrency(totals.roundOffDifference)}`
                    : `- ${formatIndianCurrency(Math.abs(totals.roundOffDifference))}`}
                </Text>
              </View>
            )}

            {/* Final Net Payable Total */}
            <View style={styles.netPayableDivider} />
            <View style={styles.netPayableRow}>
              <Text style={styles.netPayableLabel}>Net Payable Amount</Text>
              <Text style={styles.netPayableVal}>
                {formatIndianCurrency(totals.roundedPayableAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* 7. DELIVERY & REMARKS CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitleText}>DELIVERY & REMARKS</Text>

          {/* Delivery Mode Pills */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Delivery Mode</Text>
            <View style={styles.segmentRow}>
              {(['Manual', 'Courier'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.segmentBtn, draft.deliveryMode === mode && styles.segmentBtnActive]}
                  onPress={() => updateDraft({ deliveryMode: mode })}
                >
                  <Text style={[styles.segmentBtnText, draft.deliveryMode === mode && styles.segmentBtnTextActive]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Courier Details if Courier */}
          {draft.deliveryMode === 'Courier' && (
            <View style={styles.courierFieldsGroup}>
              <View style={styles.twoColRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Courier Agency</Text>
                  <TextInput
                    style={styles.textInputBox}
                    placeholder="Agency name"
                    placeholderTextColor="#94A3B8"
                    value={draft.courierAgency}
                    onChangeText={(val) => updateDraft({ courierAgency: val })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Docket / Tracking No</Text>
                  <TextInput
                    style={styles.textInputBox}
                    placeholder="Docket number"
                    placeholderTextColor="#94A3B8"
                    value={draft.docketNo}
                    onChangeText={(val) => updateDraft({ docketNo: val })}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Remark Input */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Remarks / Notes</Text>
            <TextInput
              style={[styles.textInputBox, { height: 42 }]}
              placeholder="Enter invoice remarks..."
              placeholderTextColor="#94A3B8"
              value={draft.remark}
              onChangeText={(val) => updateDraft({ remark: val })}
            />
          </View>
        </View>

        {/* 8. PAYMENT MODE CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitleText}>PAYMENT MODE</Text>
          <View style={styles.paymentPillsGrid}>
            {(['Cash', 'Credit', 'Online', 'Cheque'] as const).map((pm) => (
              <TouchableOpacity
                key={pm}
                style={[styles.paymentPill, draft.paymentMode === pm && styles.paymentPillActive]}
                onPress={() => updateDraft({ paymentMode: pm })}
              >
                <Text style={[styles.paymentPillText, draft.paymentMode === pm && styles.paymentPillTextActive]}>
                  {pm}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* If Credit: Credit Days */}
          {draft.paymentMode === 'Credit' && (
            <View style={[styles.formGroup, { marginTop: 6 }]}>
              <Text style={styles.formLabel}>Credit Days</Text>
              <TextInput
                style={styles.textInputBox}
                keyboardType="numeric"
                placeholder="e.g. 30"
                placeholderTextColor="#94A3B8"
                value={draft.creditDays ? String(draft.creditDays) : ''}
                onChangeText={(val) => updateDraft({ creditDays: parseInt(val, 10) || 0 })}
              />
            </View>
          )}

          {/* If Cheque: Cheque fields */}
          {draft.paymentMode === 'Cheque' && (
            <View style={styles.chequeFieldsGroup}>
              <View style={styles.twoColRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.textInputBox}
                    placeholder="Bank name"
                    placeholderTextColor="#94A3B8"
                    value={draft.bankName}
                    onChangeText={(val) => updateDraft({ bankName: val })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Cheque No</Text>
                  <TextInput
                    style={styles.textInputBox}
                    placeholder="Cheque number"
                    placeholderTextColor="#94A3B8"
                    value={draft.chequeTxnNo}
                    onChangeText={(val) => updateDraft({ chequeTxnNo: val })}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* BIG PRIMARY GENERATE INVOICE BUTTON IN SCROLLVIEW */}
        <View style={styles.bigGenerateBtnContainer}>
          <TouchableOpacity
            style={[
              styles.bigGenerateInvoiceBtn,
              (cartLines.length === 0 || submitMutation.isPending) && styles.btnDisabled,
            ]}
            onPress={handleDirectSubmit}
            disabled={cartLines.length === 0 || submitMutation.isPending}
            activeOpacity={0.88}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.bigGenerateInvoiceBtnInner}>
                <Feather name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.bigGenerateInvoiceBtnText}>
                  Generate Invoice · {formatIndianCurrency(totals.roundedPayableAmount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* BOTTOM SPACING TO ENSURE CONTENT CAN BE FULLY SCROLLED ABOVE FLOATING BAR & TAB BAR */}
        <View style={{ height: Math.max(insets.bottom, 16) + 140 }} />
      </ScrollView>

      {/* FLOATING STICKY ACTION BAR ABOVE APPTABBAR */}
      {cartLines.length > 0 && (
        <View
          style={[
            styles.floatingStickyBar,
            { bottom: Math.max(insets.bottom, 10) + 68 },
          ]}
        >
          <View style={styles.floatingBarInfo}>
            <Text style={styles.floatingBarQty}>{totalQuantity} Items · Total</Text>
            <Text style={styles.floatingBarTotal}>
              {formatIndianCurrency(totals.roundedPayableAmount)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.floatingGenerateBtn,
              submitMutation.isPending && styles.btnDisabled,
            ]}
            onPress={handleDirectSubmit}
            disabled={submitMutation.isPending}
            activeOpacity={0.88}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="check-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.floatingGenerateBtnText}>Generate</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 10. Bottom Navigation Bar */}
      <AppTabBar
        activeTab="sales"
        onTabChange={(tab) => {
          if (tab === 'dashboard') {
            router.replace('/dashboard?tab=dashboard' as any);
          } else if (tab === 'parties') {
            router.replace('/add-stock' as any);
          } else if (tab === 'reports') {
            router.replace('/dashboard?tab=reports' as any);
          } else if (tab === 'chat') {
            router.replace('/dashboard?tab=chat' as any);
          }
        }}
      />

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

      <AdditionalChargesSheet
        visible={chargesOpen}
        onClose={() => setChargesOpen(false)}
        charges={draft.charges}
        onSave={(newCharges) => updateDraft({ charges: newCharges })}
      />

      <SoldBySelectSheet
        visible={soldByOpen}
        onClose={() => setSoldByOpen(false)}
        selectedId={draft.soldBy}
        onSelect={(user) => {
          updateDraft({ soldBy: user.id, soldByName: user.name });
        }}
      />

      {/* Reverse Charges Picker Modal */}
      <Modal
        visible={reverseChargePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReverseChargePickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setReverseChargePickerOpen(false)}
        >
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
                  <Feather name="check" size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Invoice Type Picker Modal */}
      <Modal
        visible={invoiceTypePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInvoiceTypePickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setInvoiceTypePickerOpen(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Invoice Type</Text>
            {(['Tax Invoice', 'Delivery Challan'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  draft.invoiceType === type && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  updateDraft({ invoiceType: type });
                  setInvoiceTypePickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    draft.invoiceType === type && styles.pickerOptionTextActive,
                  ]}
                >
                  {type}
                </Text>
                {draft.invoiceType === type && (
                  <Feather name="check" size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
    borderRadius: 10,
    backgroundColor: '#F4F8FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBrandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 12,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 0.4,
  },
  changePartyLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },

  // Customer Cards (Selected vs Cash)
  selectedCustomerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  customerAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0047AB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  customerNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
    flex: 1,
  },
  customerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerMetaText: {
    fontSize: 12,
    color: '#5A6B87',
    fontWeight: '600',
  },
  customerAddressText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  overduesStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    backgroundColor: '#FFF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creditOverdueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  advanceAmtText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  cashCustomerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 12,
  },
  cashIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E204E',
  },
  cashSubText: {
    fontSize: 11,
    color: '#5A6B87',
  },
  partyActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  choosePartyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  choosePartyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  addPartyQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0047AB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 2,
  },
  addPartyQuickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6B87',
  },
  reqStar: {
    color: '#DC2626',
    fontWeight: '800',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dropdownInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownInputText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
    flex: 1,
  },
  textInputBox: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0E204E',
  },

  // Cart Section
  cartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: 0.3,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearCartBtnText: {
    fontSize: 11,
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
    paddingVertical: 20,
    gap: 8,
  },
  emptyCartPrompt: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '500',
  },
  cartItemsList: {
    gap: 10,
  },
  cartLineCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 8,
  },
  cartLineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartProductName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
  },
  cartLineMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#5A6B87',
    marginBottom: 2,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  metricValTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
  },

  // Total Banner inside Cart
  cartTotalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F1FC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 4,
  },
  cartTotalBannerLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
  },
  cartTotalBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartTotalQtyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  cartTotalAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0047AB',
  },

  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addItemDashedBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0047AB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  addItemDashedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0047AB',
  },
  newItemSolidBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  newItemSolidBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // TERMS & CONDITIONS Card
  termsCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: 0.5,
  },
  termsCardText: {
    fontSize: 12,
    color: '#5A6B87',
    lineHeight: 18,
  },

  // BILL SUMMARY
  summaryList: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  additionalChargesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginVertical: 4,
  },
  chargesTriggerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  chargesTriggerSub: {
    fontSize: 11,
    color: '#5A6B87',
  },
  chargesPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chargesPillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  netPayableDivider: {
    height: 1,
    backgroundColor: '#DFE7F2',
    marginVertical: 4,
  },
  netPayableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  netPayableLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0E204E',
  },
  netPayableVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0047AB',
  },

  // Segment Row
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#0047AB',
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  courierFieldsGroup: {
    gap: 10,
    marginTop: 4,
  },

  // Payment Pills
  paymentPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  paymentPillActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  paymentPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  paymentPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chequeFieldsGroup: {
    gap: 10,
    marginTop: 6,
  },

  // STICKY BOTTOM GENERATE INVOICE BAR
  stickyActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  stickyActionInfo: {
    flex: 1,
  },
  stickyQtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
  },
  stickyTotalAmountText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0047AB',
  },
  stickyGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0047AB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stickyGenerateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
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
  },
  pickerOptionActive: {
    backgroundColor: '#E8F1FC',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#5A6B87',
    fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: '#0047AB',
    fontWeight: '800',
  },
  // Inline Charges Card
  chargesSectionHeader: {
    marginBottom: 8,
  },
  chargesSectionSub: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  labelWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  discountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  discountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  // Big Generate Button Container
  bigGenerateBtnContainer: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  bigGenerateInvoiceBtn: {
    backgroundColor: '#0047AB',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  bigGenerateInvoiceBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigGenerateInvoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Floating Sticky Bar Above Navigation Tabs
  floatingStickyBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#0047AB25',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 25,
    zIndex: 999,
  },
  floatingBarInfo: {
    flex: 1,
  },
  floatingBarQty: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
  },
  floatingBarTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0047AB',
  },
  floatingGenerateBtn: {
    backgroundColor: '#0047AB',
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingGenerateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Party Selection Row (Matching Screenshot 1)
  partyRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  partySelectDropdown: {
    height: 44,
    borderWidth: 1.2,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partySelectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
  },
  partyPlaceholderText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  addSellerBtn: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#0047AB',
    borderRadius: 10,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addSellerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  selectedPartyMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  partyMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 4,
  },
  partyMetaChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0047AB',
  },
  resetToCashBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  resetToCashText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
  },

});
