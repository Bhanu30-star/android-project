import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Shapes, Shadows } from '@/theme/tokens';
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
  formatIndianCurrency,
  calculateInvoiceTotals,
} from '@/features/invoice/calc';

// Subcomponents
import { PartySearchSheet } from '@/components/invoice/PartySearchSheet';
import { SoldBySelectSheet } from '@/components/invoice/SoldBySelectSheet';
import { AddSellerModal } from '@/components/invoice/AddSellerModal';
import { AddItemsSheet } from '@/components/invoice/AddItemsSheet';
import { ReviewAndSubmitSheet } from '@/components/invoice/ReviewAndSubmitSheet';

export default function GenerateInvoiceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [draft, setDraft] = useState<InvoiceDraftState>(initialDraftState);
  const [isTaxDetailsExpanded, setIsTaxDetailsExpanded] = useState(false);

  // Modals & Bottom Sheets
  const [partySearchOpen, setPartySearchOpen] = useState(false);
  const [soldByOpen, setSoldByOpen] = useState(false);
  const [addSellerOpen, setAddSellerOpen] = useState(false);
  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

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
    queryKey: ['invoice-cart', draft.reverseCharge],
    queryFn: () => invoiceService.getCartDetail(draft.reverseCharge),
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

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: (cartId?: number) => invoiceService.clearCart(cartId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-cart'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.message || 'Could not clear cart');
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

  // Live Totals
  const totals = calculateInvoiceTotals(
    cartLines.map((line) => ({
      baseAmount: line.total_amount,
      discountAmount: line.discount,
      taxableAmount: line.total_amount - line.discount,
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

        <Text style={styles.headerTitle}>Generate invoice</Text>

        <TouchableOpacity
          style={styles.clearCartButton}
          onPress={handleClearCartPrompt}
          activeOpacity={0.7}
        >
          <Text style={styles.clearCartText}>Clear cart</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Party Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>Customer / Party details</Text>

          <View style={styles.partyRow}>
            {/* Searchable Select */}
            <TouchableOpacity
              style={styles.partySelect}
              onPress={() => setPartySearchOpen(true)}
              activeOpacity={0.7}
            >
              <View style={styles.partySelectIcon}>
                <Feather name="user" size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.partySelectLabel}>Party name *</Text>
                <Text
                  style={[
                    styles.partySelectValue,
                    !draft.party && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {draft.party?.partyName || 'Select customer / retailer'}
                </Text>
              </View>
              <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>

            {/* 48px Indigo Add Seller Button */}
            <TouchableOpacity
              style={styles.addSellerBtn}
              onPress={() => setAddSellerOpen(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Sold By Select */}
          <TouchableOpacity
            style={styles.soldByRow}
            onPress={() => setSoldByOpen(true)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.soldByLabel}>Sold by</Text>
              <Text style={styles.soldByValue}>{draft.soldByName}</Text>
            </View>
            <Feather name="chevron-down" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Credit & Advance Amt Tiles */}
          <View style={styles.tilesRow}>
            <View style={styles.amtTile}>
              <Text style={styles.amtTileLabel}>Credit Amt</Text>
              <Text style={styles.amtTileValue}>
                {formatIndianCurrency(draft.creditAmount)}
              </Text>
            </View>

            <View style={styles.amtTile}>
              <Text style={styles.amtTileLabel}>Advance Amt</Text>
              <Text style={[styles.amtTileValue, { color: '#0B7A4D' }]}>
                {formatIndianCurrency(draft.advanceAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Collapsible Invoice Details Row */}
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
                <Text style={styles.collapsibleTitle}>
                  {draft.invoiceType} ·{' '}
                  {new Date(draft.invoiceDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.collapsibleSubtitle}>
                  {draft.taxPreference} · Reverse charge: {draft.reverseCharge}
                </Text>
              </View>
            </View>
            <Feather
              name={isTaxDetailsExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textSecondary}
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

              {/* Tax Preference */}
              <View style={styles.fieldRow}>
                <Text style={styles.subFieldLabel}>Tax Preference</Text>
                <View style={styles.segmentedControl}>
                  {(['Inclusive', 'Exclusive'] as const).map((billType) => {
                    const isSelected = draft.taxPreference === billType;
                    return (
                      <TouchableOpacity
                        key={billType}
                        style={[
                          styles.segmentButton,
                          isSelected && styles.segmentButtonActive,
                        ]}
                        onPress={() => updateDraft({ taxPreference: billType })}
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            isSelected && styles.segmentButtonTextActive,
                          ]}
                        >
                          {billType}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Reverse Charge */}
              <View style={styles.fieldRow}>
                <Text style={styles.subFieldLabel}>Reverse Charge</Text>
                <View style={styles.segmentedControl}>
                  {(['No', 'Yes'] as const).map((rc) => {
                    const isSelected = draft.reverseCharge === rc;
                    return (
                      <TouchableOpacity
                        key={rc}
                        style={[
                          styles.segmentButton,
                          isSelected && styles.segmentButtonActive,
                        ]}
                        onPress={() => updateDraft({ reverseCharge: rc })}
                      >
                        <Text
                          style={[
                            styles.segmentButtonText,
                            isSelected && styles.segmentButtonTextActive,
                          ]}
                        >
                          {rc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 4. Items Section */}
        <View style={styles.card}>
          <View style={styles.itemsSectionHeader}>
            <View>
              <Text style={styles.cardTitle}>Items ({cartLines.length})</Text>
              <Text style={styles.itemsSectionSubtitle}>
                Cart Bill Type: {draft.taxPreference}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addItemsBtn}
              onPress={() => setAddItemsOpen(true)}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addItemsBtnText}>Add Items</Text>
            </TouchableOpacity>
          </View>

          {isCartLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : cartLines.length === 0 ? (
            <View style={styles.emptyCartBox}>
              <View style={styles.emptyCartIcon}>
                <Feather name="shopping-bag" size={28} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emptyCartTitle}>No items in invoice</Text>
              <Text style={styles.emptyCartSubtitle}>
                Tap &ldquo;Add Items&rdquo; to browse inventory and add products
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setAddItemsOpen(true)}
              >
                <Text style={styles.emptyAddBtnText}>Browse Catalog</Text>
              </TouchableOpacity>
            </View>
          ) : (
            cartLines.map((line) => (
              <View key={line.cart_id} style={styles.cartLineItem}>
                <View style={styles.cartLineDetails}>
                  <Text style={styles.cartLineName}>{line.product_name}</Text>
                  <Text style={styles.cartLineMeta}>
                    {line.quantity} × {formatIndianCurrency(line.price)} · {line.bill_type}
                    {line.discount > 0 ? ` · Disc: ${formatIndianCurrency(line.discount)}` : ''}
                  </Text>
                </View>

                <View style={styles.cartLineRight}>
                  <Text style={styles.cartLineTotal}>
                    {formatIndianCurrency(line.net_amount)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteLine(line.cart_id)}
                    style={styles.deleteLineBtn}
                  >
                    <Feather name="trash-2" size={16} color="#B01E25" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 5. Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomBarLabel}>Total Net</Text>
          <Text style={styles.bottomBarValue}>
            {formatIndianCurrency(totals.finalPayableAmount)}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.reviewButton,
            cartLines.length === 0 && styles.reviewButtonDisabled,
          ]}
          onPress={() => setReviewOpen(true)}
          disabled={cartLines.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.reviewButtonText}>Review & Submit</Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <PartySearchSheet
        visible={partySearchOpen}
        onClose={() => setPartySearchOpen(false)}
        selectedPartyId={draft.party?.partyId}
        onSelect={handlePartySelected}
      />

      <SoldBySelectSheet
        visible={soldByOpen}
        onClose={() => setSoldByOpen(false)}
        selectedId={draft.soldBy}
        onSelect={(user) =>
          updateDraft({ soldBy: user.id, soldByName: user.name })
        }
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
        searchSource={draft.soldBy}
        onCartUpdated={() => refetchCart()}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  clearCartButton: {
    backgroundColor: '#FFE3E3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Shapes.radiusSmall,
  },
  clearCartText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#B01E25',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.radiusLarge,
    padding: 16,
    ...Shadows.card,
  },
  cardSectionLabel: {
    fontFamily: Typography.statLabel.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  partyRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  partySelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusMedium,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  partySelectIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  partySelectLabel: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  partySelectValue: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  addSellerBtn: {
    width: 48,
    height: 48,
    borderRadius: Shapes.radiusMedium,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  soldByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusMedium,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  soldByLabel: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  soldByValue: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amtTile: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusMedium,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  amtTileLabel: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  amtTileValue: {
    fontFamily: Typography.statValue.fontFamily,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsibleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invoiceIconChip: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsibleTitle: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  collapsibleSubtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  collapsibleContent: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 12,
  },
  fieldRow: {
    flexDirection: 'column',
    gap: 6,
  },
  subFieldLabel: {
    fontFamily: Typography.statLabel.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusSmall,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: Colors.card,
    ...Shadows.card,
  },
  segmentButtonText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentButtonTextActive: {
    color: Colors.primaryDeep,
    fontWeight: '800',
  },
  itemsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  itemsSectionSubtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Shapes.radiusSmall,
  },
  addItemsBtnText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyCartBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCartIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FAF9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyCartTitle: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyCartSubtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  emptyAddBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Shapes.radiusSmall,
    backgroundColor: '#E8E6FF',
  },
  emptyAddBtnText: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  cartLineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  cartLineDetails: {
    flex: 1,
    paddingRight: 10,
  },
  cartLineName: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  cartLineMeta: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cartLineRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
  },
  cartLineTotal: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  deleteLineBtn: {
    padding: 4,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.card,
  },
  bottomBarLabel: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  bottomBarValue: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    height: 50,
    paddingHorizontal: 22,
    borderRadius: Shapes.radiusMedium,
    ...Shadows.card,
  },
  reviewButtonDisabled: {
    opacity: 0.5,
  },
  reviewButtonText: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
