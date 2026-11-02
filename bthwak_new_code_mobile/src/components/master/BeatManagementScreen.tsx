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
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  BeatItem,
  fetchBeatListApi,
  addBeatApi,
  updateBeatApi,
  updateBeatStatusApi,
} from '@/api/beat';

interface BeatManagementScreenProps {
  onBack?: () => void;
}

export const BeatManagementScreen: React.FC<BeatManagementScreenProps> = ({ onBack }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Search & List State
  const [search, setSearch] = useState('');
  const [beats, setBeats] = useState<BeatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add / Edit Modal State
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBeat, setEditingBeat] = useState<BeatItem | null>(null);
  const [beatNameInput, setBeatNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Change Confirmation State
  const [statusTargetBeat, setStatusTargetBeat] = useState<BeatItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load Beats
  const loadBeats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await fetchBeatListApi({ search: search.trim(), limit: 200 });
      setBeats(res.beats || []);
    } catch (err: any) {
      console.warn('Failed to load beats', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    loadBeats();
  }, [loadBeats]);

  // Client-side filtering
  const filteredBeats = useMemo(() => {
    if (!search.trim()) return beats;
    const q = search.trim().toLowerCase();
    return beats.filter((b) => b.beatName?.toLowerCase().includes(q));
  }, [beats, search]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingBeat(null);
    setBeatNameInput('');
    setIsAddEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (beat: BeatItem) => {
    setEditingBeat(beat);
    setBeatNameInput(beat.beatName || '');
    setIsAddEditOpen(true);
  };

  // Handle Save (Add or Edit)
  const handleSaveBeat = async () => {
    const cleanName = beatNameInput.trim();
    if (!cleanName) {
      Alert.alert('Required', 'Please enter a valid beat name.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingBeat) {
        await updateBeatApi(editingBeat.beatId, cleanName);
        Alert.alert('Success', 'Beat updated successfully!');
      } else {
        await addBeatApi(cleanName);
        Alert.alert('Success', 'Beat added successfully!');
      }

      setIsAddEditOpen(false);
      setEditingBeat(null);
      setBeatNameInput('');
      loadBeats(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save beat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Toggle Confirmation
  const handleConfirmStatusToggle = async () => {
    if (!statusTargetBeat) return;
    const nextStatus = statusTargetBeat.status === 'Active' ? 'Deactive' : 'Active';

    try {
      setIsUpdatingStatus(true);
      await updateBeatStatusApi(statusTargetBeat.beatId, nextStatus);

      // Local state update
      setBeats((prev) =>
        prev.map((b) =>
          b.beatId === statusTargetBeat.beatId ? { ...b, status: nextStatus } : b
        )
      );
      setStatusTargetBeat(null);
    } catch (err: any) {
      Alert.alert('Failed', err?.message || 'Could not update beat status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderBeatCard = ({ item }: { item: BeatItem }) => {
    const isActive = item.status === 'Active';

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={styles.iconCircle}>
            <Feather name="map-pin" size={17} color="#0047AB" />
          </View>
          <Text style={styles.beatNameText} numberOfLines={1}>
            {item.beatName}
          </Text>
        </View>

        <View style={styles.cardRight}>
          {/* Status Pill */}
          <TouchableOpacity
            style={[styles.statusPill, isActive ? styles.statusPillActive : styles.statusPillDeactive]}
            onPress={() => setStatusTargetBeat(item)}
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

          {/* Edit Button */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => handleOpenEdit(item)}
            activeOpacity={0.7}
          >
            <Feather name="edit-2" size={15} color="#0047AB" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
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

        <Text style={styles.headerTitle}>Beat Management</Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenAdd}
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
            placeholder="Search here..."
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

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0047AB" />
          <Text style={styles.loadingText}>Loading beats...</Text>
        </View>
      ) : filteredBeats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="map" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>No Beats Found</Text>
          <Text style={styles.emptyDesc}>
            {search.trim()
              ? `No beat found matching "${search}".`
              : 'You have not added any beats yet. Tap below to create your first beat.'}
          </Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAdd}>
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.emptyAddBtnText}>Add Beat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBeats}
          keyExtractor={(item) => String(item.beatId)}
          renderItem={renderBeatCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadBeats(true)}
              tintColor="#0047AB"
              colors={['#0047AB']}
            />
          }
        />
      )}

      {/* ADD / EDIT MODAL SHEET (Matching Screenshots 2 & 3 in Light Theme) */}
      <Modal
        visible={isAddEditOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddEditOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsAddEditOpen(false)}
          />

          <View style={[styles.sheetCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.dragHandle} />

            {/* Modal Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {!editingBeat && <Feather name="plus" size={18} color="#0047AB" />}
                <Text style={styles.sheetTitle}>
                  {editingBeat ? 'Edit Beat' : 'Add Beat'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={() => setIsAddEditOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            {/* Input Box */}
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Beat Name</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="Enter Beat Name"
                placeholderTextColor="#94A3B8"
                value={beatNameInput}
                onChangeText={setBeatNameInput}
                autoFocus
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.sheetBtnRow}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setIsAddEditOpen(false)}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sheetSubmitBtn, isSubmitting && styles.btnDisabled]}
                onPress={handleSaveBeat}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sheetSubmitText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* UPDATE STATUS CONFIRMATION MODAL */}
      <Modal
        visible={Boolean(statusTargetBeat)}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusTargetBeat(null)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={styles.confirmCircle}>
              <Feather
                name={statusTargetBeat?.status === 'Active' ? 'slash' : 'check'}
                size={24}
                color="#0047AB"
              />
            </View>

            <Text style={styles.confirmTitle}>Update Status</Text>
            <Text style={styles.confirmDesc}>
              Are you sure you want to{' '}
              {statusTargetBeat?.status === 'Active' ? 'deactivate' : 'activate'}{' '}
              <Text style={{ fontWeight: '700', color: '#0E204E' }}>
                {statusTargetBeat?.beatName}
              </Text>
              ?
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmNoBtn}
                onPress={() => setStatusTargetBeat(null)}
                disabled={isUpdatingStatus}
              >
                <Text style={styles.confirmNoText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmYesBtn, isUpdatingStatus && styles.btnDisabled]}
                onPress={handleConfirmStatusToggle}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmYesText}>Yes</Text>
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
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  beatNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
    letterSpacing: -0.2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 10,
    paddingHorizontal: 20,
    elevation: 24,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    gap: 16,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrap: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  sheetInput: {
    height: 48,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '600',
  },
  sheetBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  sheetCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
  sheetSubmitBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sheetSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
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
  confirmCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
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
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmNoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5A6B87',
  },
  confirmYesBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmYesText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
