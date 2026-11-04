import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { invoiceService, RetailerParty } from '@/api/invoiceService';
import { Colors } from '@/theme/tokens';

export const CASH_PARTY: RetailerParty = {
  partyId: 0,
  partyName: 'Cash',
  partyPhone: '',
  partyGst: '',
  partyAddress: 'Cash Sale',
};

interface PartySearchSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (party: RetailerParty) => void;
  selectedPartyId?: number;
  onAddNew?: () => void;
}

export const PartySearchSheet: React.FC<PartySearchSheetProps> = ({
  visible,
  onClose,
  onSelect,
  selectedPartyId,
  onAddNew,
}) => {
  const [search, setSearch] = useState('');

  const { data: allParties = [], isLoading } = useQuery({
    queryKey: ['retailer-parties'],
    queryFn: () => invoiceService.fetchRetailerParties(''),
    enabled: visible,
    staleTime: 60000,
  });

  const filteredParties = useMemo(() => {
    if (!search.trim()) return allParties;
    const q = search.toLowerCase().trim();
    return allParties.filter(
      (p) =>
        (p.partyName || '').toLowerCase().includes(q) ||
        (p.partyPhone || '').toLowerCase().includes(q) ||
        (p.partyGst || '').toLowerCase().includes(q)
    );
  }, [allParties, search]);

  const isCashSelected = useMemo(() => {
    if (!selectedPartyId || selectedPartyId <= 0) return false;
    const cur = allParties.find((p) => p.partyId === selectedPartyId);
    return cur ? (cur.partyName || '').toLowerCase().includes('cash') : false;
  }, [allParties, selectedPartyId]);

  const handleSelect = (party: RetailerParty) => {
    if (!party || !party.partyId || party.partyId <= 0) {
      Alert.alert('Invalid Party', 'Please select a valid registered customer.');
      return;
    }
    onSelect(party);
    onClose();
  };

  const handleCashOption = () => {
    const cashParty = allParties.find(
      (p) =>
        (p.partyName || '').toLowerCase().includes('cash') ||
        (p.partyName || '').toLowerCase().includes('counter')
    );
    if (cashParty && cashParty.partyId > 0) {
      handleSelect(cashParty);
    } else if (onAddNew) {
      Alert.alert(
        'Cash Customer Not Found',
        'No "Cash" customer exists in your customer records. Would you like to create one now?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Customer',
            onPress: () => {
              onClose();
              onAddNew();
            },
          },
        ]
      );
    } else {
      Alert.alert('Customer Required', 'Please select a registered customer from the list below.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Customer / Party</Text>
              <Text style={styles.subtitle}>Choose an existing party or select Cash Sale</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={Colors.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone, or GST..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Top Options: Cash Sale & Add New Party */}
          <View style={styles.topOptionsRow}>
            {/* Cash Sale Option */}
            <TouchableOpacity
              style={[styles.topOptionBtn, isCashSelected && styles.topOptionBtnActive]}
              onPress={handleCashOption}
              activeOpacity={0.8}
            >
              <Ionicons
                name="cash-outline"
                size={18}
                color={isCashSelected ? '#FFFFFF' : Colors.primary}
              />
              <Text
                style={[
                  styles.topOptionBtnText,
                  isCashSelected && styles.topOptionBtnTextActive,
                ]}
              >
                Cash Customer
              </Text>
            </TouchableOpacity>

            {/* Quick Add Party */}
            {onAddNew && (
              <TouchableOpacity
                style={styles.addNewPartyBtn}
                onPress={() => {
                  onClose();
                  onAddNew();
                }}
                activeOpacity={0.8}
              >
                <Feather name="user-plus" size={16} color="#0047AB" />
                <Text style={styles.addNewPartyBtnText}>+ Add New</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* List of Parties */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading customers...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredParties}
              keyExtractor={(item) => String(item.partyId)}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.partyId === selectedPartyId;
                const initial = (item.partyName || 'P').charAt(0).toUpperCase();

                return (
                  <TouchableOpacity
                    style={[styles.partyCard, isSelected && styles.partyCardSelected]}
                    onPress={() => handleSelect(item)}
                    activeOpacity={0.7}
                  >
                    {/* Avatar Icon */}
                    <View style={[styles.avatarBox, isSelected && styles.avatarBoxSelected]}>
                      <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                        {initial}
                      </Text>
                    </View>

                    {/* Party Details */}
                    <View style={styles.partyDetailsCol}>
                      <View style={styles.nameRow}>
                        <Text style={styles.partyNameText} numberOfLines={1}>
                          {item.partyName}
                        </Text>
                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <Feather name="check" size={11} color="#FFFFFF" style={{ marginRight: 2 }} />
                            <Text style={styles.selectedBadgeText}>Selected</Text>
                          </View>
                        )}
                      </View>

                      {/* Phone & GST Chips */}
                      <View style={styles.chipsRow}>
                        {item.partyPhone ? (
                          <View style={styles.infoChip}>
                            <Feather name="phone" size={10} color={Colors.textSecondary} />
                            <Text style={styles.infoChipText}>{item.partyPhone}</Text>
                          </View>
                        ) : null}

                        {item.partyGst ? (
                          <View style={[styles.infoChip, styles.gstChip]}>
                            <Text style={styles.gstChipText}>GST: {item.partyGst}</Text>
                          </View>
                        ) : (
                          <View style={styles.infoChip}>
                            <Text style={styles.infoChipText}>Unregistered</Text>
                          </View>
                        )}
                      </View>

                      {/* Address */}
                      {item.partyAddress ? (
                        <View style={styles.addressRow}>
                          <Feather name="map-pin" size={10} color="#94A3B8" />
                          <Text style={styles.addressText} numberOfLines={1}>
                            {item.partyAddress}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Radio Checkmark */}
                    <View style={[styles.radioBox, isSelected && styles.radioBoxSelected]}>
                      {isSelected && <Feather name="check" size={14} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather name="users" size={36} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No matching parties found</Text>
                </View>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DFE7F2',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
  },
  subtitle: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4F8FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
  },
  topOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  topOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 6,
  },
  topOptionBtnActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  topOptionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  topOptionBtnTextActive: {
    color: '#FFFFFF',
  },
  addNewPartyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  addNewPartyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#5A6B87',
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 12,
  },
  partyCardSelected: {
    borderColor: '#0047AB',
    borderWidth: 1.5,
    backgroundColor: '#F8FAFF',
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F1FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBoxSelected: {
    backgroundColor: '#0047AB',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0047AB',
  },
  avatarTextSelected: {
    color: '#FFFFFF',
  },
  partyDetailsCol: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partyNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0047AB',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    gap: 4,
  },
  infoChipText: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
  },
  gstChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gstChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0047AB',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
  },
  radioBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioBoxSelected: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
