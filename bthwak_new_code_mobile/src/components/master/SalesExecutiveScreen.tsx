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
  SalesExecutiveUser,
  fetchSalesExecutivesApi,
  updateExecutiveStatusApi,
  clearExecutiveCredentialsApi,
} from '@/api/salesExecutive';
import { EditExecutiveModal } from './EditExecutiveModal';
import { ExecutiveStockReturnModal } from './ExecutiveStockReturnModal';

interface SalesExecutiveScreenProps {
  onBack?: () => void;
}

export const SalesExecutiveScreen: React.FC<SalesExecutiveScreenProps> = ({ onBack }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Search & List State
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<SalesExecutiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Password visibility map (by user_id)
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string | number, boolean>>({});

  // Active Menu / Popup User
  const [activeMenuUser, setActiveMenuUser] = useState<SalesExecutiveUser | null>(null);

  // Status Change Dialog State
  const [statusConfirmUser, setStatusConfirmUser] = useState<SalesExecutiveUser | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Clear Credentials Dialog State
  const [clearConfirmUser, setClearConfirmUser] = useState<SalesExecutiveUser | null>(null);
  const [isClearingCredentials, setIsClearingCredentials] = useState(false);

  // Return Stock Modal State
  const [stockReturnUser, setStockReturnUser] = useState<SalesExecutiveUser | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<SalesExecutiveUser | null>(null);

  // Load Sales Executives
  const loadUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await fetchSalesExecutivesApi({ search: search.trim(), limit: 100 });
      setUsers(res.users || []);
    } catch (err: any) {
      console.warn('Failed to load sales executives', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filtered users for instant search
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.user_name?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.user_phone?.toLowerCase().includes(q)
    );
  }, [users, search]);

  // Toggle password visibility
  const togglePasswordVisibility = (id: string | number) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Status Change Confirm Handler
  const handleConfirmStatusChange = async () => {
    if (!statusConfirmUser) return;
    const nextStatus = statusConfirmUser.status === 'Active' ? 'Deactive' : 'Active';

    try {
      setIsUpdatingStatus(true);
      await updateExecutiveStatusApi(statusConfirmUser.user_id, nextStatus);
      setStatusConfirmUser(null);
      loadUsers();
    } catch (err: any) {
      Alert.alert('Status Update Error', err.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Clear Credentials Confirm Handler
  const handleConfirmClearCredentials = async () => {
    if (!clearConfirmUser) return;

    try {
      setIsClearingCredentials(true);
      await clearExecutiveCredentialsApi(clearConfirmUser.user_id);
      Alert.alert('Success', 'Credentials cleared successfully for this user.');
      setClearConfirmUser(null);
      loadUsers();
    } catch (err: any) {
      Alert.alert('Clear Error', err.message || 'Failed to clear credentials.');
    } finally {
      setIsClearingCredentials(false);
    }
  };

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color="#0E204E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Executive</Text>
        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={() => loadUsers(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="rotate-cw" size={18} color="#0E204E" />
        </TouchableOpacity>
      </View>

      {/* Search Bar Container */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#5A6B87" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#8E9CAE"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => loadUsers()}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={16} color="#8E9CAE" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main List */}
      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0047AB" />
          <Text style={styles.loadingText}>Loading sales executives...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.user_id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadUsers(true)}
              tintColor="#0047AB"
              colors={['#0047AB']}
            />
          }
          renderItem={({ item }) => {
            const displayName = item.user_name || item.name || 'FOS User';
            const firstLetter = displayName.trim().charAt(0).toUpperCase() || 'F';
            const isActive = item.status === 'Active';
            const isPasswordRevealed = !!showPasswordMap[item.user_id];
            const rawPassword = item.userPassword || item.password || '••••••••';

            return (
              <View style={styles.userCard}>
                {/* Top Row: Avatar, Name, Phone, Status Badge, 3-dots */}
                <View style={styles.cardTopRow}>
                  {/* Avatar */}
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetter}>{firstLetter}</Text>
                  </View>

                  {/* Name and Phone */}
                  <View style={styles.namePhoneBox}>
                    <Text style={styles.userNameText} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={styles.userPhoneText}>
                      {item.user_phone || 'No phone'}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      isActive ? styles.statusBadgeActive : styles.statusBadgeDeactive,
                    ]}
                    onPress={() => setStatusConfirmUser(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isActive ? styles.statusTextActive : styles.statusTextDeactive,
                      ]}
                    >
                      {item.status || 'Active'}
                    </Text>
                  </TouchableOpacity>

                  {/* 3 Vertical Dots Menu Button */}
                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => setActiveMenuUser(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="more-vertical" size={19} color="#5A6B87" />
                  </TouchableOpacity>
                </View>

                {/* Subtext: Invoice Type & Recharge */}
                <View style={styles.invoiceTypeRow}>
                  <Text style={styles.invoiceTypeText}>
                    {item.invoiceType || 'Tax Invoice + Delivery Challan'}
                  </Text>
                </View>

                {/* Bottom Row: Password Box with Eye Toggle */}
                <View style={styles.passwordContainer}>
                  <View style={styles.passwordLeftPart}>
                    <Feather name="lock" size={14} color="#5A6B87" />
                    <Text
                      style={[
                        styles.passwordText,
                        !isPasswordRevealed && styles.passwordMaskedText,
                      ]}
                    >
                      {isPasswordRevealed ? rawPassword : '••••••••'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => togglePasswordVisibility(item.user_id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather
                      name={isPasswordRevealed ? 'eye' : 'eye-off'}
                      size={16}
                      color="#5A6B87"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="users" size={44} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Sales Executives Found</Text>
              <Text style={styles.emptySub}>
                {search.trim()
                  ? 'No results match your search.'
                  : 'No sales executives currently available in your master.'}
              </Text>
            </View>
          }
        />
      )}

      {/* 3-DOTS ACTION SHEET MODAL (Screenshot 2) */}
      <Modal
        visible={!!activeMenuUser}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveMenuUser(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setActiveMenuUser(null)}
          />
          <View style={styles.actionMenuCard}>
            <View style={styles.actionMenuHeader}>
              <Text style={styles.actionMenuTitle} numberOfLines={1}>
                {activeMenuUser?.user_name || activeMenuUser?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveMenuUser(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color="#0E204E" />
              </TouchableOpacity>
            </View>

            {/* 1. Edit */}
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                const u = activeMenuUser;
                setActiveMenuUser(null);
                setEditingUser(u);
              }}
            >
              <Feather name="edit-2" size={17} color="#0E204E" />
              <Text style={styles.actionMenuText}>Edit</Text>
            </TouchableOpacity>

            {/* 2. Clear Credential */}
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                const u = activeMenuUser;
                setActiveMenuUser(null);
                setClearConfirmUser(u);
              }}
            >
              <Feather name="alert-circle" size={17} color="#DC2626" />
              <Text style={[styles.actionMenuText, styles.actionMenuTextDanger]}>
                Clear Credential
              </Text>
            </TouchableOpacity>

            {/* 3. Stock Return */}
            <TouchableOpacity
              style={styles.actionMenuItem}
              onPress={() => {
                const u = activeMenuUser;
                setActiveMenuUser(null);
                setStockReturnUser(u);
              }}
            >
              <Feather name="package" size={17} color="#0047AB" />
              <Text style={[styles.actionMenuText, styles.actionMenuTextPrimary]}>
                Stock Return
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UPDATE STATUS CONFIRMATION MODAL (Screenshot 3) */}
      <Modal
        visible={!!statusConfirmUser}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusConfirmUser(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setStatusConfirmUser(null)}
          />
          <View style={styles.confirmDialogCard}>
            {/* Top Graphic Circle */}
            <View style={styles.confirmCircle}>
              <Feather name="user-check" size={24} color="#0047AB" />
            </View>

            <Text style={styles.confirmTitle}>Update Status</Text>
            <Text style={styles.confirmDesc}>
              Are you sure you want to{' '}
              {statusConfirmUser?.status === 'Active' ? 'deactivate' : 'activate'}{' '}
              this user?
            </Text>

            {/* No / Yes Buttons */}
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmNoBtn}
                onPress={() => setStatusConfirmUser(null)}
                disabled={isUpdatingStatus}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmNoBtnText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmYesBtn,
                  isUpdatingStatus && styles.confirmYesBtnDisabled,
                ]}
                onPress={handleConfirmStatusChange}
                disabled={isUpdatingStatus}
                activeOpacity={0.85}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmYesBtnText}>Yes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CLEAR CREDENTIALS CONFIRMATION MODAL */}
      <Modal
        visible={!!clearConfirmUser}
        transparent
        animationType="fade"
        onRequestClose={() => setClearConfirmUser(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setClearConfirmUser(null)}
          />
          <View style={styles.confirmDialogCard}>
            <View style={[styles.confirmCircle, { backgroundColor: '#FEF2F2' }]}>
              <Feather name="alert-triangle" size={24} color="#DC2626" />
            </View>

            <Text style={styles.confirmTitle}>Clear Credentials</Text>
            <Text style={styles.confirmDesc}>
              Are you sure you want to clear device credentials and reset IMEI binding for{' '}
              {clearConfirmUser?.user_name || clearConfirmUser?.name}?
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmNoBtn}
                onPress={() => setClearConfirmUser(null)}
                disabled={isClearingCredentials}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmNoBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmYesBtn,
                  { backgroundColor: '#DC2626' },
                  isClearingCredentials && styles.confirmYesBtnDisabled,
                ]}
                onPress={handleConfirmClearCredentials}
                disabled={isClearingCredentials}
                activeOpacity={0.85}
              >
                {isClearingCredentials ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmYesBtnText}>Clear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT EXECUTIVE MODAL */}
      <EditExecutiveModal
        visible={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => {
          setEditingUser(null);
          loadUsers();
        }}
      />

      {/* RETURN STOCK MODAL */}
      <ExecutiveStockReturnModal
        visible={!!stockReturnUser}
        user={stockReturnUser}
        onClose={() => setStockReturnUser(null)}
        onSuccess={() => {
          setStockReturnUser(null);
          loadUsers();
        }}
      />
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  headerRightBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardTopRow: {
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
    borderColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0047AB',
  },
  namePhoneBox: {
    flex: 1,
    gap: 2,
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  userPhoneText: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBadgeDeactive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextDeactive: {
    color: '#DC2626',
  },
  moreBtn: {
    padding: 4,
  },
  invoiceTypeRow: {
    paddingTop: 2,
  },
  invoiceTypeText: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '500',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  passwordLeftPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  passwordText: {
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '600',
  },
  passwordMaskedText: {
    letterSpacing: 2,
    color: '#5A6B87',
  },
  eyeBtn: {
    padding: 4,
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
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0E204E',
  },
  emptySub: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
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
  actionMenuCard: {
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
  actionMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  actionMenuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  actionMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  actionMenuTextDanger: {
    color: '#DC2626',
  },
  actionMenuTextPrimary: {
    color: '#0047AB',
  },
  confirmDialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 24,
    alignItems: 'center',
    gap: 14,
    elevation: 14,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  confirmCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  confirmDesc: {
    fontSize: 14,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 6,
  },
  confirmNoBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmNoBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5A6B87',
  },
  confirmYesBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmYesBtnDisabled: {
    opacity: 0.6,
  },
  confirmYesBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
