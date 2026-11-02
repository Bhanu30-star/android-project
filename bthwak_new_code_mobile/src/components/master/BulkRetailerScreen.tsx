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
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  BulkPartyItem,
  FOSOption,
  BeatOption,
  fetchBulkRetailersApi,
  fetchFosUsersApi,
  fetchBeatsApi,
  assignSalesExecutiveApi,
  assignBeatApi,
  removeSalesExecutiveApi,
} from '@/api/bulkRetailer';

interface BulkRetailerScreenProps {
  onBack?: () => void;
}

export const BulkRetailerScreen: React.FC<BulkRetailerScreenProps> = ({ onBack }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedFosFilter, setSelectedFosFilter] = useState<number | null>(null);
  const [parties, setParties] = useState<BulkPartyItem[]>([]);
  const [fosList, setFosList] = useState<FOSOption[]>([]);
  const [beatList, setBeatList] = useState<BeatOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected Parties (Set of party_ids)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // FOS Filter Dropdown Modal
  const [isFosFilterOpen, setIsFosFilterOpen] = useState(false);

  // Action Modals State
  const [isAssignFseOpen, setIsAssignFseOpen] = useState(false);
  const [chosenFseId, setChosenFseId] = useState<number | null>(null);
  const [fseSearch, setFseSearch] = useState('');

  const [isAssignBeatOpen, setIsAssignBeatOpen] = useState(false);
  const [chosenBeatName, setChosenBeatName] = useState<string>('');
  const [beatSearch, setBeatSearch] = useState('');

  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [removeFseId, setRemoveFseId] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Initial remote data
  useEffect(() => {
    fetchFosUsersApi().then((list) => setFosList(list || []));
    fetchBeatsApi().then((list) => setBeatList(list || []));
  }, []);

  // Load Parties
  const loadParties = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await fetchBulkRetailersApi({
        search: search.trim(),
        sale_id: selectedFosFilter != null ? selectedFosFilter : '',
        limit: 200,
      });

      setParties(res.parties || []);
    } catch (err: any) {
      console.warn('Failed to load bulk parties', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [search, selectedFosFilter]);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  // Client-side filtering
  const filteredParties = useMemo(() => {
    if (!search.trim()) return parties;
    const q = search.trim().toLowerCase();
    return parties.filter(
      (p) =>
        p.party_name?.toLowerCase().includes(q) ||
        p.party_phone?.toLowerCase().includes(q) ||
        p.gstin_no?.toLowerCase().includes(q)
    );
  }, [parties, search]);

  // Selection toggle
  const toggleSelectParty = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select All / Deselect All
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredParties.length && filteredParties.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredParties.map((p) => p.party_id));
      setSelectedIds(allIds);
    }
  };

  const isAllSelected =
    filteredParties.length > 0 && selectedIds.size === filteredParties.length;

  // Selected Count
  const selectedCount = selectedIds.size;

  // Helper for Initials
  const getInitials = (name?: string): string => {
    if (!name) return 'RT';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // ---------------------------------------------------------
  // Handlers for Bulk Actions
  // ---------------------------------------------------------

  // 1. Assign FSE
  const handleConfirmAssignFse = async () => {
    if (chosenFseId == null) {
      Alert.alert('Required', 'Please select a Sales Executive to assign.');
      return;
    }

    try {
      setIsSubmitting(true);
      const party_id = Array.from(selectedIds);
      const res = await assignSalesExecutiveApi({
        user_id: chosenFseId,
        party_id,
      });

      Alert.alert('Success', res?.message || 'Sales Executive assigned successfully!');
      setIsAssignFseOpen(false);
      setChosenFseId(null);
      setSelectedIds(new Set());
      loadParties(true);
    } catch (err: any) {
      Alert.alert('Assign Failed', err?.message || 'Could not assign sales executive.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Assign Beat
  const handleConfirmAssignBeat = async () => {
    if (!chosenBeatName.trim()) {
      Alert.alert('Required', 'Please select a beat to assign.');
      return;
    }

    try {
      setIsSubmitting(true);
      const party_id = Array.from(selectedIds);
      const res = await assignBeatApi({
        beat_value: chosenBeatName.trim(),
        party_id,
      });

      Alert.alert('Success', res?.message || 'Beat assigned successfully!');
      setIsAssignBeatOpen(false);
      setChosenBeatName('');
      setSelectedIds(new Set());
      loadParties(true);
    } catch (err: any) {
      Alert.alert('Assign Failed', err?.message || 'Could not assign beat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Remove FSE Assignment
  const handleConfirmRemove = async () => {
    if (removeFseId == null) {
      Alert.alert('Required', 'Please select which Sales Executive assignment to remove.');
      return;
    }

    try {
      setIsSubmitting(true);
      const party_id = Array.from(selectedIds);
      const res = await removeSalesExecutiveApi({
        user_id: removeFseId,
        party_id,
      });

      Alert.alert('Success', res?.message || 'Assignment removed successfully!');
      setIsRemoveOpen(false);
      setRemoveFseId(null);
      setSelectedIds(new Set());
      loadParties(true);
    } catch (err: any) {
      Alert.alert('Remove Failed', err?.message || 'Could not remove assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get active filter label
  const activeFosLabel = useMemo(() => {
    if (selectedFosFilter == null) return 'All';
    const found = fosList.find((f) => f.userId === selectedFosFilter);
    return found ? found.userName : 'All';
  }, [fosList, selectedFosFilter]);

  const renderPartyCard = ({ item }: { item: BulkPartyItem }) => {
    const isChecked = selectedIds.has(item.party_id);
    const initials = getInitials(item.party_name);

    return (
      <TouchableOpacity
        style={[styles.card, isChecked && styles.cardSelected]}
        onPress={() => toggleSelectParty(item.party_id)}
        activeOpacity={0.8}
      >
        {/* Avatar Initials */}
        <View style={[styles.avatarCircle, isChecked && styles.avatarCircleSelected]}>
          <Text style={[styles.avatarText, isChecked && styles.avatarTextSelected]}>
            {initials}
          </Text>
        </View>

        {/* Party Details */}
        <View style={styles.cardInfo}>
          <View style={styles.partyNameRow}>
            <Text style={styles.partyName} numberOfLines={1}>
              {item.party_name}
            </Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          {/* Badges / FOS & Beat */}
          <View style={styles.badgeRow}>
            {item.sales_executives && item.sales_executives.length > 0 ? (
              item.sales_executives.map((se) => (
                <View key={se.user_id} style={styles.fseBadge}>
                  <View style={styles.fseInitialCircle}>
                    <Text style={styles.fseInitialText}>
                      {se.user_name?.charAt(0).toUpperCase() || 'F'}
                    </Text>
                  </View>
                  <Text style={styles.fseBadgeText}>{se.user_name}</Text>
                </View>
              ))
            ) : selectedFosFilter != null ? (
              <View style={styles.fseBadge}>
                <View style={styles.fseInitialCircle}>
                  <Text style={styles.fseInitialText}>
                    {activeFosLabel.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.fseBadgeText}>{activeFosLabel}</Text>
              </View>
            ) : (
              <View style={styles.unassignedBadge}>
                <Text style={styles.unassignedBadgeText}>Unassigned</Text>
              </View>
            )}

            {item.beat_detail ? (
              <View style={styles.beatBadge}>
                <Feather name="map-pin" size={10} color="#0047AB" />
                <Text style={styles.beatBadgeText} numberOfLines={1}>
                  {item.beat_detail}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Checkbox Right */}
        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
          {isChecked && <Feather name="check" size={14} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => {
            if (onBack) onBack();
            else router.back();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="x" size={22} color="#0E204E" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {selectedCount > 0
            ? `${selectedCount} Item${selectedCount > 1 ? 's' : ''} Selected`
            : 'Bulk Retailer Movement'}
        </Text>

        <TouchableOpacity
          style={styles.selectAllBtn}
          onPress={handleToggleSelectAll}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.selectAllText}>
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Row: Search & FSE Dropdown */}
      <View style={styles.filterRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Party..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={15} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterDropdown}
          onPress={() => setIsFosFilterOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterDropdownText} numberOfLines={1}>
            {activeFosLabel}
          </Text>
          <Feather name="chevron-down" size={16} color="#5A6B87" />
        </TouchableOpacity>
      </View>

      {/* Parties List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0047AB" />
          <Text style={styles.loadingText}>Loading retailer parties...</Text>
        </View>
      ) : filteredParties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="users" size={38} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>No Parties Found</Text>
          <Text style={styles.emptyDesc}>
            {search.trim()
              ? `No parties found matching "${search}".`
              : 'No retailer parties available under this filter.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredParties}
          keyExtractor={(item) => String(item.party_id)}
          renderItem={renderPartyCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadParties(true)}
              tintColor="#0047AB"
              colors={['#0047AB']}
            />
          }
        />
      )}

      {/* Floating Bottom Action Bar (Screenshot 1) */}
      <View
        style={[
          styles.bottomActionBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        {/* 1. Assign FSE */}
        <TouchableOpacity
          style={styles.bottomActionBtn}
          onPress={() => {
            if (selectedCount === 0) {
              Alert.alert('No Selection', 'Please select at least one party to assign.');
              return;
            }
            setIsAssignFseOpen(true);
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={17} color="#0047AB" />
          <Text style={styles.bottomActionTextPrimary}>Assign FSE</Text>
        </TouchableOpacity>

        {/* 2. Remove Assignment */}
        <TouchableOpacity
          style={styles.bottomActionBtn}
          onPress={() => {
            if (selectedCount === 0) {
              Alert.alert('No Selection', 'Please select at least one party to remove assignment.');
              return;
            }
            setIsRemoveOpen(true);
          }}
          activeOpacity={0.8}
        >
          <Feather name="trash-2" size={17} color="#DC2626" />
          <Text style={styles.bottomActionTextDanger} numberOfLines={1}>Remove FSE</Text>
        </TouchableOpacity>

        {/* 3. Assign Beat */}
        <TouchableOpacity
          style={styles.bottomActionBtn}
          onPress={() => {
            if (selectedCount === 0) {
              Alert.alert('No Selection', 'Please select at least one party to assign a beat.');
              return;
            }
            setIsAssignBeatOpen(true);
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={17} color="#0047AB" />
          <Text style={styles.bottomActionTextPrimary}>Assign Beat</Text>
        </TouchableOpacity>
      </View>

      {/* FSE Filter Modal */}
      <Modal
        visible={isFosFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFosFilterOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Sales Executive</Text>
              <TouchableOpacity onPress={() => setIsFosFilterOpen(false)}>
                <Feather name="x" size={20} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
              <TouchableOpacity
                style={[
                  styles.filterItem,
                  selectedFosFilter === null && styles.filterItemActive,
                ]}
                onPress={() => {
                  setSelectedFosFilter(null);
                  setIsFosFilterOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.filterItemText,
                    selectedFosFilter === null && styles.filterItemTextActive,
                  ]}
                >
                  All (Show All Parties)
                </Text>
                {selectedFosFilter === null && (
                  <Feather name="check" size={16} color="#0047AB" />
                )}
              </TouchableOpacity>

              {fosList.map((f) => {
                const isSelected = selectedFosFilter === f.userId;
                return (
                  <TouchableOpacity
                    key={f.userId}
                    style={[styles.filterItem, isSelected && styles.filterItemActive]}
                    onPress={() => {
                      setSelectedFosFilter(f.userId);
                      setIsFosFilterOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterItemText,
                        isSelected && styles.filterItemTextActive,
                      ]}
                    >
                      {f.userName}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ASSIGN FSE MODAL */}
      <Modal
        visible={isAssignFseOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAssignFseOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign Sales Executive</Text>
                <Text style={styles.modalSubtitle}>
                  Assigning to {selectedCount} selected party
                  {selectedCount > 1 ? 'ies' : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsAssignFseOpen(false)}>
                <Feather name="x" size={20} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.modalSearchBox}>
              <Feather name="search" size={15} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search executive..."
                placeholderTextColor="#94A3B8"
                value={fseSearch}
                onChangeText={setFseSearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
              {fosList
                .filter((f) =>
                  f.userName.toLowerCase().includes(fseSearch.trim().toLowerCase())
                )
                .map((f) => {
                  const isSelected = chosenFseId === f.userId;
                  return (
                    <TouchableOpacity
                      key={f.userId}
                      style={[styles.pickerRow, isSelected && styles.pickerRowActive]}
                      onPress={() => setChosenFseId(f.userId)}
                    >
                      <View
                        style={[
                          styles.radioDotOuter,
                          isSelected && styles.radioDotOuterActive,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDotInner} />}
                      </View>
                      <Text
                        style={[
                          styles.pickerRowText,
                          isSelected && styles.pickerRowTextActive,
                        ]}
                      >
                        {f.userName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAssignFseOpen(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSubmitting && styles.btnDisabled]}
                onPress={handleConfirmAssignFse}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ASSIGN BEAT MODAL */}
      <Modal
        visible={isAssignBeatOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAssignBeatOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign Beat</Text>
                <Text style={styles.modalSubtitle}>
                  Assigning to {selectedCount} selected party
                  {selectedCount > 1 ? 'ies' : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsAssignBeatOpen(false)}>
                <Feather name="x" size={20} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.modalSearchBox}>
              <Feather name="search" size={15} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search beat..."
                placeholderTextColor="#94A3B8"
                value={beatSearch}
                onChangeText={setBeatSearch}
              />
            </View>

            <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
              {beatList
                .filter((b) =>
                  b.beatName.toLowerCase().includes(beatSearch.trim().toLowerCase())
                )
                .map((b) => {
                  const isSelected = chosenBeatName === b.beatName;
                  return (
                    <TouchableOpacity
                      key={b.beatId}
                      style={[styles.pickerRow, isSelected && styles.pickerRowActive]}
                      onPress={() => setChosenBeatName(b.beatName)}
                    >
                      <View
                        style={[
                          styles.radioDotOuter,
                          isSelected && styles.radioDotOuterActive,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDotInner} />}
                      </View>
                      <Text
                        style={[
                          styles.pickerRowText,
                          isSelected && styles.pickerRowTextActive,
                        ]}
                      >
                        {b.beatName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAssignBeatOpen(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSubmitting && styles.btnDisabled]}
                onPress={handleConfirmAssignBeat}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* REMOVE ASSIGNMENT MODAL */}
      <Modal
        visible={isRemoveOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRemoveOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: '#DC2626' }]}>
                  Remove Assignment
                </Text>
                <Text style={styles.modalSubtitle}>
                  Select executive assignment to remove:
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsRemoveOpen(false)}>
                <Feather name="x" size={20} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 260 }} keyboardShouldPersistTaps="handled">
              {fosList.map((f) => {
                const isSelected = removeFseId === f.userId;
                return (
                  <TouchableOpacity
                    key={f.userId}
                    style={[styles.pickerRow, isSelected && styles.pickerRowActive]}
                    onPress={() => setRemoveFseId(f.userId)}
                  >
                    <View
                      style={[
                        styles.radioDotOuter,
                        isSelected && styles.radioDotOuterActive,
                      ]}
                    >
                      {isSelected && <View style={styles.radioDotInner} />}
                    </View>
                    <Text
                      style={[
                        styles.pickerRowText,
                        isSelected && styles.pickerRowTextActive,
                      ]}
                    >
                      {f.userName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsRemoveOpen(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: '#DC2626' },
                  isSubmitting && styles.btnDisabled,
                ]}
                onPress={handleConfirmRemove}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Remove</Text>
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
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  selectAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  selectAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
    fontWeight: '500',
  },
  filterDropdown: {
    minWidth: 90,
    maxWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    height: 44,
    gap: 6,
  },
  filterDropdownText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingVertical: 12,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    gap: 12,
  },
  cardSelected: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFD',
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
  avatarCircleSelected: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0047AB',
  },
  avatarTextSelected: {
    color: '#FFFFFF',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  partyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
    letterSpacing: -0.2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#059669',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  fseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  fseInitialCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fseInitialText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  fseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  unassignedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  unassignedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  beatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  beatBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
    paddingTop: 10,
    paddingHorizontal: 12,
    elevation: 16,
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bottomActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  bottomActionTextPrimary: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  bottomActionTextDanger: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    elevation: 16,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E204E',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  filterItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  filterItemTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 6,
  },
  pickerRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  pickerRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  pickerRowTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
  radioDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotOuterActive: {
    borderColor: '#0047AB',
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0047AB',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
  modalSubmitBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
