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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Shadows } from '@/theme/tokens';
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

// Subcomponents
import { PartySearchSheet } from '@/components/invoice/PartySearchSheet';
import { AddSellerModal } from '@/components/invoice/AddSellerModal';
import { AddItemsSheet } from '@/components/invoice/AddItemsSheet';
import { ReviewAndSubmitSheet } from '@/components/invoice/ReviewAndSubmitSheet';
import { AdditionalChargesSheet } from '@/components/invoice/AdditionalChargesSheet';
import { CalendarPickerModal } from '@/components/common/CalendarPickerModal';

export default function GenerateInvoiceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State - default soldBy to 'admin' per user specification
  const [draft, setDraft] = useState<InvoiceDraftState>(initialDraftState);
  const [isTaxDetailsExpanded, setIsTaxDetailsExpanded] = useState(false);

  // Modals & Bottom Sheets
  const [partySearchOpen, setPartySearchOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [addSellerOpen, setAddSellerOpen] = useState(false);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [chargesOpen, setChargesOpen] = useState(false);

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

  // Cart Query - always pass 'No' for reverse charge
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
        'Tax Preference Locked',
        `All items in the cart are currently ${draft.taxPreference}. Clear the cart to switch to ${pref}.`,
        [
          { text: 'OK' },
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

  // Live Totals with exact integer paise calculation
  const totals = calculateInvoiceTotals(
    cartLines.map((line) => ({
      baseAmount: line.total_amount,
      discountAmount: line.discount,
      taxableAmount: line.taxable_amount || (line.total_amount - line.discount),
      gstAmount: line.tax_amount,
      cessAmount: line.cess_amount,
      netAmount: line.net_amount,
    })),
    draft.charges
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* 1. Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Generate Invoice</Text>
          <Text style={styles.headerSubTitle} numberOfLines={1}>
            {draft.party ? draft.party.partyName : 'New Sale Billing'}
          </Text>
        </View>

        {cartLines.length > 0 ? (
          <TouchableOpacity
            style={styles.clearCartButton}
            onPress={handleClearCartPrompt}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={13} color="#B01E25" style={{ marginRight: 4 }} />
            <Text style={styles.clearCartText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerDraftBadge}>
            <Text style={styles.headerDraftText}>Draft</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Customer / Party Card */}
        <View style={styles.card}>
          <View style={styles.customerHeaderRow}>
            <Text style={styles.cardSectionLabel}>Customer / Party details</Text>
            {draft.party && (
              <TouchableOpacity
                style={styles.changePartyHeaderBtn}
                onPress={() => setPartySearchOpen(true)}
                activeOpacity={0.75}
              >
                <Feather name="refresh-cw" size={11} color={Colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.changePartyHeaderText}>Change Party</Text>
              </TouchableOpacity>
            )}
          </View>

          {draft.party ? (
            <TouchableOpacity
              style={styles.selectedPartyCard}
              onPress={() => setPartySearchOpen(true)}
              activeOpacity={0.9}
            >
              <View style={styles.selectedPartyHeader}>
                <View style={styles.partyAvatar}>
                  <Text style={styles.partyAvatarText}>
                    {(draft.party.partyName || 'P').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.selectedPartyName} numberOfLines={1}>
                      {draft.party.partyName}
                    </Text>
                    <View style={styles.verifiedBadge}>
                      <Feather name="check" size={10} color="#0B7A4D" />
                    </View>
                  </View>
                  <View style={styles.partyBadgesRow}>
                    {draft.party.partyPhone ? (
                      <View style={styles.partyBadge}>
                        <Feather name="phone" size={10} color={Colors.textSecondary} />
                        <Text style={styles.partyBadgeText}>{draft.party.partyPhone}</Text>
                      </View>
                    ) : null}
                    {draft.party.partyGst ? (
                      <View style={[styles.partyBadge, { backgroundColor: '#EEF2FF', borderColor: '#D9D7F9' }]}>
                        <Feather name="file-text" size={10} color={Colors.primary} />
                        <Text style={[styles.partyBadgeText, { color: Colors.primary, fontWeight: '700' }]}>
                          GST: {draft.party.partyGst}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {draft.shippingAddress ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                      <Feather name="map-pin" size={10} color={Colors.textSecondary} />
                      <Text style={{ fontSize: 11, color: Colors.textSecondary }} numberOfLines={1}>
                        {draft.shippingAddress}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Credit & Advance Amt Financial Highlights */}
              <View style={styles.tilesRow}>
                <View style={[styles.amtTile, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                  <View style={styles.amtTileTopRow}>
                    <Text style={[styles.amtTileLabel, { color: '#991B1B' }]}>Credit Overdue</Text>
                    <Feather name="alert-circle" size={13} color="#DC2626" />
                  </View>
                  <Text style={[styles.amtTileValue, { color: '#DC2626' }]}>
                    {formatIndianCurrency(draft.creditAmount)}
                  </Text>
                </View>

                <View style={[styles.amtTile, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <View style={styles.amtTileTopRow}>
                    <Text style={[styles.amtTileLabel, { color: '#065F46' }]}>Advance Balance</Text>
                    <Feather name="check-circle" size={13} color="#059669" />
                  </View>
                  <Text style={[styles.amtTileValue, { color: '#059669' }]}>
                    {formatIndianCurrency(draft.advanceAmount)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.unselectedPartyCard}
              onPress={() => setPartySearchOpen(true)}
              activeOpacity={0.8}
            >
              <View style={styles.unselectedPartyLeft}>
                <View style={styles.unselectedPartyAvatar}>
                  <Feather name="user-plus" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unselectedPartyTitle}>Select Customer / Party</Text>
                  <Text style={styles.unselectedPartySub}>
                    Tap to search or pick a customer to bill
                  </Text>
                </View>
              </View>
              <View style={styles.selectPartyArrow}>
                <Feather name="chevron-right" size={18} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Collapsible Invoice Details */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setIsTaxDetailsExpanded(!isTaxDetailsExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.collapsibleLeft}>
              <View style={styles.invoiceIconChip}>
                <Feather name="file-text" size={16} color={Colors.primary} />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.collapsibleTitle}>
                    {draft.invoiceType}
                  </Text>
                  <View style={styles.invoiceTypePill}>
                    <Text style={styles.invoiceTypePillText}>Config</Text>
                  </View>
                </View>
                <Text style={styles.collapsibleSubtitle}>
                  {new Date(draft.invoiceDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })} · Tap to configure date or bill type
                </Text>
              </View>
            </View>
            <Feather
              name={isTaxDetailsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {isTaxDetailsExpanded && (
            <View style={styles.collapsibleContent}>
              {/* Invoice Type */}
              <View style={styles.fieldRow}>
                <Text style={styles.subFieldLabel}>Invoice Type</Text>
                <View style={styles.segmentedControl}>
                  {(['Tax Invoice', 'Delivery Challan'] as const).map((type) => {
                    const isSelected = draft.invoiceType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.segmentButton,
                          isSelected && styles.segmentButtonActive,
                        ]}
                        onPress={() => updateDraft({ invoiceType: type })}
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            isSelected && styles.segmentButtonTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Invoice Date with Calendar Modal Trigger */}
              <View style={styles.fieldRow}>
                <View>
                  <Text style={styles.subFieldLabel}>Invoice Date</Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Tap to pick from calendar</Text>
                </View>
                <TouchableOpacity
                  style={styles.calendarTriggerBtn}
                  onPress={() => setCalendarOpen(true)}
                  activeOpacity={0.8}
                >
                  <Feather name="calendar" size={14} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.calendarTriggerText}>
                    {new Date(draft.invoiceDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Feather name="chevron-down" size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>

              {/* Delivery Mode */}
              <View style={styles.fieldRow}>
                <View>
                  <Text style={styles.subFieldLabel}>Delivery Mode</Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary }}>Shipping method</Text>
                </View>
                <View style={styles.segmentedControl}>
                  {(['Manual', 'Courier'] as const).map((dm) => {
                    const isSelected = draft.deliveryMode === dm;
                    return (
                      <TouchableOpacity
                        key={dm}
                        style={[
                          styles.segmentButton,
                          isSelected && styles.segmentButtonActive,
                        ]}
                        onPress={() => updateDraft({ deliveryMode: dm })}
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            isSelected && styles.segmentButtonTextActive,
                          ]}
                        >
                          {dm}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {draft.deliveryMode === 'Courier' && (
                <View style={styles.courierFieldsContainer}>
                  <View style={styles.courierHeaderRow}>
                    <Feather name="truck" size={13} color={Colors.primary} />
                    <Text style={styles.courierHeaderTitle}>Courier Shipping Details</Text>
                  </View>

                  <View style={styles.courierInputRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courierFieldLabel}>Courier Agency *</Text>
                      <TextInput
                        style={styles.courierInput}
                        placeholder="e.g. BlueDart"
                        placeholderTextColor={Colors.textSecondary}
                        value={draft.courierAgency}
                        onChangeText={(val) => updateDraft({ courierAgency: val })}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.courierFieldLabel}>Docket No *</Text>
                      <TextInput
                        style={styles.courierInput}
                        placeholder="Tracking #"
                        placeholderTextColor={Colors.textSecondary}
                        value={draft.docketNo}
                        onChangeText={(val) => updateDraft({ docketNo: val })}
                      />
                    </View>
                  </View>

                  <View style={styles.courierInputRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courierFieldLabel}>Courier Date *</Text>
                      <TextInput
                        style={styles.courierInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.textSecondary}
                        value={draft.courierDate}
                        onChangeText={(val) => updateDraft({ courierDate: val })}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.courierFieldLabel}>PO Number</Text>
                      <TextInput
                        style={styles.courierInput}
                        placeholder="PO Number"
                        placeholderTextColor={Colors.textSecondary}
                        value={draft.purchaseOrderNo}
                        onChangeText={(val) => updateDraft({ purchaseOrderNo: val })}
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.courierFieldLabel}>Shipping Address *</Text>
                    <TextInput
                      style={[styles.courierInput, { height: 46 }]}
                      placeholder="Delivery shipping destination address"
                      placeholderTextColor={Colors.textSecondary}
                      value={draft.shippingAddress}
                      onChangeText={(val) => updateDraft({ shippingAddress: val })}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 4. Items Section */}
        <View style={styles.card}>
          <View style={styles.itemsSectionHeader}>
            <View>
              <Text style={styles.cardTitle}>Items Added</Text>
              <View style={styles.itemsSubHeaderRow}>
                <Text style={styles.itemsSectionSubtitle}>
                  {cartLines.length} product{cartLines.length === 1 ? '' : 's'} in cart
                </Text>
                <View style={styles.taxPreferenceChip}>
                  <Feather name="check" size={10} color={Colors.primary} style={{ marginRight: 3 }} />
                  <Text style={styles.taxPreferenceChipText}>
                    Tax: {draft.taxPreference}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.addItemsBtn}
              onPress={() => setAddItemsOpen(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addItemsBtnText}>Add item</Text>
            </TouchableOpacity>
          </View>

          {isCartLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : cartLines.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <View style={styles.emptyCartIcon}>
                <Feather name="shopping-cart" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
              <Text style={styles.emptyCartSubtitle}>
                Add products from catalog to start billing
              </Text>
              <View style={styles.emptyActionButtonsRow}>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setAddItemsOpen(true)}
                >
                  <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyAddBtnText}>Add products</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emptyNewItemBtn}
                  onPress={() => setAddItemsOpen(true)}
                >
                  <Text style={styles.emptyNewItemBtnText}>New item</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            cartLines.map((line, index) => {
              const totalGstPaise = toPaise(line.tax_amount || 0);
              const halfGstPaise = Math.floor(totalGstPaise / 2);
              const otherHalfPaise = totalGstPaise - halfGstPaise;
              const cgst = toRupees(halfGstPaise);
              const sgst = toRupees(otherHalfPaise);
              const halfRate = (line.product_gst || 0) / 2;

              return (
                <View key={line.cart_id} style={styles.itemCardContainer}>
                  <View style={styles.itemCardHeaderRow}>
                    <View style={styles.itemIndexCircle}>
                      <Text style={styles.itemIndexText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.itemCardProductName}>
                        {line.product_name || line.item || 'Product'}
                      </Text>
                      {line.product_code ? (
                        <View style={styles.productCodeBadge}>
                          <Text style={styles.itemCardProductCode}>{line.product_code}</Text>
                        </View>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteLine(line.cart_id)}
                      style={styles.deleteLineBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={15} color="#B01E25" />
                    </TouchableOpacity>
                  </View>

                  {/* Clean 4-column metrics table */}
                  <View style={styles.itemMetricsGrid}>
                    <View style={styles.metricGridCol}>
                      <Text style={styles.metricGridLabel}>QTY</Text>
                      <Text style={styles.metricGridVal}>{line.quantity}</Text>
                    </View>
                    <View style={styles.metricGridDivider} />
                    <View style={styles.metricGridCol}>
                      <Text style={styles.metricGridLabel}>RATE</Text>
                      <Text style={styles.metricGridVal}>{formatIndianCurrency(line.price)}</Text>
                    </View>
                    <View style={styles.metricGridDivider} />
                    <View style={styles.metricGridCol}>
                      <Text style={styles.metricGridLabel}>TAXABLE</Text>
                      <Text style={styles.metricGridVal}>{formatIndianCurrency(line.taxable_amount)}</Text>
                    </View>
                    <View style={styles.metricGridDivider} />
                    <View style={styles.metricGridCol}>
                      <Text style={styles.metricGridLabel}>NET TOTAL</Text>
                      <Text style={[styles.metricGridVal, { color: Colors.primary, fontWeight: '800' }]}>
                        {formatIndianCurrency(line.net_amount)}
                      </Text>
                    </View>
                  </View>

                  {/* Clean GST Summary Row */}
                  <View style={styles.itemGstRow}>
                    <View style={styles.itemGstMainBadge}>
                      <Feather name="percent" size={10} color={Colors.primary} style={{ marginRight: 3 }} />
                      <Text style={styles.itemGstMainBadgeText}>
                        GST {line.product_gst}%: {formatIndianCurrency(line.tax_amount)}
                      </Text>
                    </View>
                    <View style={styles.itemGstSplitPill}>
                      <Text style={styles.itemGstSplitText}>
                        CGST {halfRate}%: <Text style={styles.itemGstSplitVal}>{formatIndianCurrency(cgst)}</Text>
                      </Text>
                    </View>
                    <View style={styles.itemGstSplitPill}>
                      <Text style={styles.itemGstSplitText}>
                        SGST {halfRate}%: <Text style={styles.itemGstSplitVal}>{formatIndianCurrency(sgst)}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Additional tags if any */}
                  {line.discount > 0 || line.cess_amount > 0 || (line.total_crate || 0) > 0 || (line.total_bottle || 0) > 0 ? (
                    <View style={styles.itemExtrasRow}>
                      {line.discount > 0 && (
                        <View style={styles.itemDiscTag}>
                          <Text style={styles.itemDiscTagText}>Disc -{formatIndianCurrency(line.discount)}</Text>
                        </View>
                      )}
                      {line.cess_amount > 0 && (
                        <View style={styles.itemExtraTag}>
                          <Text style={styles.itemExtraTagText}>CESS: {formatIndianCurrency(line.cess_amount)}</Text>
                        </View>
                      )}
                      {(line.total_crate || 0) > 0 && (
                        <View style={styles.itemExtraTag}>
                          <Text style={styles.itemExtraTagText}>Crate: {line.total_crate}</Text>
                        </View>
                      )}
                      {(line.total_bottle || 0) > 0 && (
                        <View style={styles.itemExtraTag}>
                          <Text style={styles.itemExtraTagText}>Bottle: {line.total_bottle}</Text>
                        </View>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        {/* 5. Invoice Totals & GST Summary Card */}
        {cartLines.length > 0 && (
          <View style={styles.card}>
            <View style={styles.summaryHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={styles.summaryHeaderIcon}>
                  <Feather name="file-text" size={15} color={Colors.primary} />
                </View>
                <Text style={styles.cardSectionLabel}>Billing Summary</Text>
              </View>
              <TouchableOpacity
                onPress={() => setChargesOpen(true)}
                style={styles.summaryChargesBtn}
                activeOpacity={0.7}
              >
                <Feather name="plus-circle" size={12} color={Colors.primary} />
                <Text style={styles.summaryChargesText}>Charges & Disc</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal ({cartLines.length} item{cartLines.length === 1 ? '' : 's'})</Text>
              <Text style={styles.summaryVal}>
                {formatIndianCurrency(totals.totalBaseAmount)}
              </Text>
            </View>

            {totals.totalProductDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Product Discounts</Text>
                <Text style={[styles.summaryVal, { color: '#0B7A4D' }]}>
                  -{formatIndianCurrency(totals.totalProductDiscount)}
                </Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxable Amount</Text>
              <Text style={styles.summaryVal}>
                {formatIndianCurrency(totals.totalTaxableAmount)}
              </Text>
            </View>

            {/* GST Breakdown Box */}
            {totals.totalGstAmount > 0 && (
              <View style={styles.gstSummaryBox}>
                <View style={styles.gstSummaryHeader}>
                  <View style={styles.gstSummaryIcon}>
                    <Feather name="percent" size={11} color={Colors.primary} />
                  </View>
                  <Text style={styles.gstSummaryTitle}>GST Breakdown (CGST + SGST)</Text>
                </View>
                <View style={styles.gstSummaryRow}>
                  <Text style={styles.gstSummaryLabel}>CGST (Central Tax)</Text>
                  <Text style={styles.gstSummaryVal}>
                    {formatIndianCurrency(totals.totalCgstAmount)}
                  </Text>
                </View>
                <View style={styles.gstSummaryRow}>
                  <Text style={styles.gstSummaryLabel}>SGST (State Tax)</Text>
                  <Text style={styles.gstSummaryVal}>
                    {formatIndianCurrency(totals.totalSgstAmount)}
                  </Text>
                </View>
                <View style={styles.gstSummaryDivider} />
                <View style={styles.gstSummaryRow}>
                  <Text style={styles.gstSummaryTotalLabel}>Total GST Tax</Text>
                  <Text style={styles.gstSummaryTotalVal}>
                    {formatIndianCurrency(totals.totalGstAmount)}
                  </Text>
                </View>
              </View>
            )}

            {totals.totalCessAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>CESS</Text>
                <Text style={styles.summaryVal}>
                  {formatIndianCurrency(totals.totalCessAmount)}
                </Text>
              </View>
            )}

            {totals.totalAdditionalCharges > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Additional Charges</Text>
                <Text style={styles.summaryVal}>
                  +{formatIndianCurrency(totals.totalAdditionalCharges)}
                </Text>
              </View>
            )}

            {totals.roundOffDifference !== 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Round Off</Text>
                <Text style={styles.summaryVal}>
                  {totals.roundOffDifference > 0 ? '+' : ''}
                  {formatIndianCurrency(totals.roundOffDifference)}
                </Text>
              </View>
            )}

            {/* Hero Net Payable Card matching dashboard styling */}
            <View style={styles.dashboardHeroTotal}>
              <View style={styles.heroTotalHeader}>
                <Text style={styles.dashboardHeroTotalLabel}>Net Payable Amount</Text>
                <View style={styles.dashboardHeroBadge}>
                  <Text style={styles.dashboardHeroBadgeText}>{draft.taxPreference}</Text>
                </View>
              </View>
              <Text style={styles.dashboardHeroTotalAmount}>
                {formatIndianCurrency(totals.roundedPayableAmount)}
              </Text>
              <Text style={styles.dashboardHeroTotalSub}>
                {cartLines.length} item{cartLines.length === 1 ? '' : 's'} · All taxes and charges included
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 5. Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarLeft}>
          <Text style={styles.bottomBarLabel}>NET PAYABLE</Text>
          <Text style={styles.bottomBarValue}>
            {formatIndianCurrency(totals.roundedPayableAmount)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.reviewButton,
            cartLines.length === 0 && styles.reviewButtonDisabled,
          ]}
          onPress={() => setReviewOpen(true)}
          disabled={cartLines.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.reviewButtonText}>Review & Submit</Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Modals & Sheets */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5FA',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerSubTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  headerDraftBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerDraftText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  clearCartButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
  },
  clearCartText: {
    color: '#B01E25',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  customerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  changePartyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D9D7F9',
  },
  changePartyHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  calendarTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  calendarTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  selectedPartyCard: {
    backgroundColor: '#F8F9FE',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E8F5',
  },
  selectedPartyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  selectedPartyName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  partyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ECECF8',
  },
  partyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  changePartyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changePartyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  partySelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  partySelectIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partySelectLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  partySelectValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  partySubPhone: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  addSellerBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  soldByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 10,
  },
  soldByLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  soldByValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  soldByIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  amtTileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  unselectedPartyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FE',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    borderStyle: 'dashed',
  },
  unselectedPartyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  unselectedPartyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedPartyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  unselectedPartySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectPartyArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amtTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ECECF8',
  },
  amtTileLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  amtTileValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  collapsibleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  invoiceIconChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsibleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  invoiceTypePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  invoiceTypePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  collapsibleSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  collapsibleContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subFieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  segmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: Colors.primary,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    width: 130,
    textAlign: 'center',
  },
  courierFieldsContainer: {
    backgroundColor: '#F8F9FE',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: 8,
  },
  courierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  courierHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  courierInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courierFieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  courierInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECECF8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  itemsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemsSubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  itemsSectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  taxPreferenceChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taxPreferenceChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  addItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addItemsBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCartBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyCartIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyCartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  emptyCartSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  emptyActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyNewItemBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  emptyNewItemBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  itemCardContainer: {
    backgroundColor: '#F8F9FE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECECF8',
  },
  itemCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemIndexCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  itemIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  itemCardProductName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  itemCardProductCode: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  productCodeBadge: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  deleteLineBtn: {
    padding: 4,
    backgroundColor: '#FDECEC',
    borderRadius: 6,
  },
  itemMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECECF8',
    justifyContent: 'space-between',
  },
  metricGridCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricGridDivider: {
    width: 1,
    height: '75%',
    backgroundColor: '#ECECF8',
    alignSelf: 'center',
  },
  metricGridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricGridVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  itemGstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemGstMainBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemGstMainBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  itemGstSplitPill: {
    backgroundColor: '#F8F9FE',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemGstSplitText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  itemGstSplitVal: {
    color: Colors.text,
    fontWeight: '700',
  },
  itemExtrasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  itemDiscTag: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemDiscTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B7A4D',
  },
  itemExtraTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemExtraTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  summaryHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryChargesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  summaryChargesText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  gstSummaryBox: {
    backgroundColor: '#F8F9FE',
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  gstSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  gstSummaryIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gstSummaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gstSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  gstSummaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  gstSummaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  gstSummaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  gstSummaryTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  gstSummaryTotalVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  dashboardHeroTotal: {
    backgroundColor: '#2A2470',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  heroTotalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dashboardHeroTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CFCCF7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dashboardHeroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dashboardHeroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dashboardHeroTotalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dashboardHeroTotalSub: {
    fontSize: 11,
    color: '#AEA9ED',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 4,
  },
  bottomBarLeft: {
    justifyContent: 'center',
  },
  bottomBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  bottomBarValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  reviewButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  reviewButtonDisabled: {
    opacity: 0.5,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
