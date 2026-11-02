import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  BuyerSellerItem,
  fetchBuyerSellerListApi,
  deleteBuyerSellerApi,
  toggleBuyerSellerStatusApi,
} from '@/api/buyerSeller';
import { AddEditBuyerSellerModal } from './AddEditBuyerSellerModal';

interface BuyerSellerScreenProps {
  onBack?: () => void;
}

type TabType = 'All' | 'Buyer' | 'Seller';

export const BuyerSellerScreen: React.FC<BuyerSellerScreenProps> = ({ onBack }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [items, setItems] = useState<BuyerSellerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add / Edit Modal State
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BuyerSellerItem | null>(null);

  // Status Change Dialog State
  const [statusTargetItem, setStatusTargetItem] = useState<BuyerSellerItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Delete Dialog State
  const [deleteTargetItem, setDeleteTargetItem] = useState<BuyerSellerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load parties list
  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await fetchBuyerSellerListApi({
        search: search.trim(),
        record_type: activeTab,
        limit: 100,
      });

      setItems(res.data || []);
    } catch (err: any) {
      console.warn('Failed to load buyer seller list', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side search & tab filter
  const filteredItems = useMemo(() => {
    let result = items;

    if (activeTab !== 'All') {
      result = result.filter(
        (i) => (i.record_type || '').toLowerCase() === activeTab.toLowerCase()
      );
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.party_name?.toLowerCase().includes(q) ||
          i.party_phone?.toLowerCase().includes(q) ||
          i.gstin_no?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, activeTab, search]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const buyerCount = items.filter((i) => (i.record_type || '').toLowerCase() === 'buyer').length;
    const sellerCount = items.filter((i) => (i.record_type || '').toLowerCase() === 'seller').length;
    return {
      all: items.length,
      buyer: buyerCount,
      seller: sellerCount,
    };
  }, [items]);

  // Confirm Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusTargetItem) return;

    const nextStatus = statusTargetItem.status === 'Active' ? 'Deactive' : 'Active';
    const type = (statusTargetItem.record_type === 'Seller' ? 'Seller' : 'Buyer') as 'Buyer' | 'Seller';

    try {
      setIsUpdatingStatus(true);
      await toggleBuyerSellerStatusApi(statusTargetItem.party_id, type, nextStatus);

      // Local state update
      setItems((prev) =>
        prev.map((item) =>
          item.party_id === statusTargetItem.party_id ? { ...item, status: nextStatus } : item
        )
      );
      setStatusTargetItem(null);
    } catch (err: any) {
      Alert.alert('Status Update Failed', err?.message || 'Could not update party status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetItem) return;

    const type = (deleteTargetItem.record_type === 'Seller' ? 'Seller' : 'Buyer') as 'Buyer' | 'Seller';

    try {
      setIsDeleting(true);
      await deleteBuyerSellerApi(deleteTargetItem.party_id, type);

      setItems((prev) => prev.filter((i) => i.party_id !== deleteTargetItem.party_id));
      setDeleteTargetItem(null);
      Alert.alert('Deleted', 'Party deleted successfully.');
    } catch (err: any) {
      Alert.alert('Delete Failed', err?.message || 'Could not delete party.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if delete is allowed
  const handleDeletePress = (item: BuyerSellerItem) => {
    const outstanding = Number(item.outstanding_amount || 0);
    const pending = Number(item.pending_amt || 0);

    if (outstanding > 0 || pending > 0) {
      Alert.alert(
        'Cannot Delete',
        'Cannot delete party with an existing outstanding or pending balance.'
      );
      return;
    }

    setDeleteTargetItem(item);
  };

  // Helper for initials
  const getInitials = (name: string): string => {
    if (!name) return 'BS';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Format currency
  const formatMoney = (val?: number): string => {
    const num = val || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const renderCard = ({ item }: { item: BuyerSellerItem }) => {
    const isSeller = (item.record_type || '').toLowerCase() === 'seller';
    const isActive = item.status === 'Active';
    const initials = getInitials(item.party_name);

    return (
      <View style={styles.card}>
        {/* Top Info Row */}
        <View style={styles.cardHeaderRow}>
          {/* Avatar Circle */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          {/* Name & Details */}
          <View style={styles.cardMetaCol}>
            <Text style={styles.partyName} numberOfLines={1}>
              {item.party_name}
            </Text>

            <View style={styles.badgeRow}>
              {/* Buyer / Seller pill */}
              <View style={[styles.typeBadge, isSeller ? styles.typeBadgeSeller : styles.typeBadgeBuyer]}>
                <Text
                  style={[
                    styles.typeBadgeText,
                    isSeller ? styles.typeBadgeTextSeller : styles.typeBadgeTextBuyer,
                  ]}
                >
                  {isSeller ? 'Seller' : 'Buyer'}
                </Text>
              </View>

              {item.party_phone ? (
                <Text style={styles.phoneText}>• {item.party_phone}</Text>
              ) : null}
            </View>
          </View>

          {/* Status Pill (Tap to update) */}
          <TouchableOpacity
            style={[styles.statusPill, isActive ? styles.statusPillActive : styles.statusPillDeactive]}
            onPress={() => setStatusTargetItem(item)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#059669' : '#DC2626' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                isActive ? styles.statusTextActive : styles.statusTextDeactive,
              ]}
            >
              {isActive ? 'Active' : 'Deactive'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Financial & Actions Row */}
        <View style={styles.cardBottomRow}>
          {/* Balances */}
          <View style={styles.balancesContainer}>
            <View style={styles.balanceCol}>
              <Text style={styles.balanceLabel}>Outstanding</Text>
              <Text style={styles.outstandingValue}>
                {formatMoney(item.outstanding_amount)}
              </Text>
            </View>

            <View style={styles.balanceCol}>
              <Text style={styles.balanceLabel}>Pending</Text>
              <Text style={styles.pendingValue}>{formatMoney(item.pending_amt)}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {/* Edit */}
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => {
                setEditingItem(item);
                setIsAddEditOpen(true);
              }}
              activeOpacity={0.7}
            >
              <Feather name="edit-2" size={15} color="#0047AB" />
            </TouchableOpacity>

            {/* Quick Action / Discount */}
            <TouchableOpacity
              style={[styles.actionIconBtn, styles.actionIconBtnSuccess]}
              onPress={() => {
                Alert.alert(
                  'Quick Action',
                  `Party: ${item.party_name}\nType: ${item.record_type}\nPhone: ${item.party_phone || 'N/A'}`
                );
              }}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={16} color="#16A34A" />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={[styles.actionIconBtn, styles.actionIconBtnDanger]}
              onPress={() => handleDeletePress(item)}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={15} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (onBack) onBack();
            else router.back();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0E204E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Buyer & Seller</Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditingItem(null);
            setIsAddEditOpen(true);
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search here"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs Filter */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'All' && styles.tabPillActive]}
          onPress={() => setActiveTab('All')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'All' && styles.tabTextActive]}>
            All ({tabCounts.all})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'Buyer' && styles.tabPillActive]}
          onPress={() => setActiveTab('Buyer')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'Buyer' && styles.tabTextActive]}>
            Buyer ({tabCounts.buyer})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabPill, activeTab === 'Seller' && styles.tabPillActive]}
          onPress={() => setActiveTab('Seller')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'Seller' && styles.tabTextActive]}>
            Seller ({tabCounts.seller})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List / Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0047AB" />
          <Text style={styles.loadingText}>Loading parties...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="users" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>No Parties Found</Text>
          <Text style={styles.emptyDesc}>
            {search.trim()
              ? `No matching records for "${search}".`
              : `You haven't added any ${activeTab === 'All' ? 'parties' : activeTab.toLowerCase() + 's'} yet.`}
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => {
              setEditingItem(null);
              setIsAddEditOpen(true);
            }}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.emptyAddBtnText}>Add New Party</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.party_id)}
          renderItem={renderCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadData(true)}
              tintColor="#0047AB"
              colors={['#0047AB']}
            />
          }
        />
      )}

      {/* Add / Edit Sheet Modal */}
      <AddEditBuyerSellerModal
        visible={isAddEditOpen}
        item={editingItem}
        initialType={activeTab === 'Seller' ? 'Seller' : 'Buyer'}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => loadData(true)}
      />

      {/* Status Confirmation Modal */}
      <Modal
        visible={Boolean(statusTargetItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusTargetItem(null)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={styles.confirmModalIconCircle}>
              <Feather
                name={statusTargetItem?.status === 'Active' ? 'slash' : 'check'}
                size={26}
                color="#0047AB"
              />
            </View>

            <Text style={styles.confirmModalTitle}>Update Status</Text>
            <Text style={styles.confirmModalDesc}>
              Are you sure you want to{' '}
              {statusTargetItem?.status === 'Active' ? 'deactivate' : 'activate'}{' '}
              <Text style={{ fontWeight: '700', color: '#0E204E' }}>
                {statusTargetItem?.party_name}
              </Text>
              ?
            </Text>

            <View style={styles.confirmModalBtnRow}>
              <TouchableOpacity
                style={styles.confirmModalNoBtn}
                onPress={() => setStatusTargetItem(null)}
                disabled={isUpdatingStatus}
              >
                <Text style={styles.confirmModalNoText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmModalYesBtn, isUpdatingStatus && styles.btnDisabled]}
                onPress={handleConfirmStatusChange}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmModalYesText}>Yes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={Boolean(deleteTargetItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTargetItem(null)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={[styles.confirmModalIconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Feather name="trash-2" size={26} color="#DC2626" />
            </View>

            <Text style={styles.confirmModalTitle}>Confirm Delete</Text>
            <Text style={styles.confirmModalDesc}>
              Are you sure you want to delete{' '}
              <Text style={{ fontWeight: '700', color: '#0E204E' }}>
                {deleteTargetItem?.party_name}
              </Text>
              ? This action cannot be undone.
            </Text>

            <View style={styles.confirmModalBtnRow}>
              <TouchableOpacity
                style={styles.confirmModalNoBtn}
                onPress={() => setDeleteTargetItem(null)}
                disabled={isDeleting}
              >
                <Text style={styles.confirmModalNoText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmModalYesBtn,
                  { backgroundColor: '#DC2626' },
                  isDeleting && styles.btnDisabled,
                ]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmModalYesText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
    height: 46,
    elevation: 1,
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '500',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  tabPillActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B87',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#5A6B87',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0047AB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 14,
    elevation: 2,
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0047AB',
  },
  cardMetaCol: {
    flex: 1,
    gap: 4,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeBuyer: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  typeBadgeSeller: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  typeBadgeTextBuyer: {
    color: '#1D4ED8',
  },
  typeBadgeTextSeller: {
    color: '#B45309',
  },
  phoneText: {
    fontSize: 12,
    color: '#5A6B87',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPillDeactive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextDeactive: {
    color: '#DC2626',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  balancesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  balanceCol: {
    gap: 2,
  },
  balanceLabel: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
  },
  outstandingValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
  pendingValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0047AB',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtnSuccess: {
    backgroundColor: '#F0FDF4',
  },
  actionIconBtnDanger: {
    backgroundColor: '#FEF2F2',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    gap: 14,
    elevation: 14,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  confirmModalIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
  },
  confirmModalDesc: {
    fontSize: 14,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  confirmModalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 6,
  },
  confirmModalNoBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalNoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5A6B87',
  },
  confirmModalYesBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalYesText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
