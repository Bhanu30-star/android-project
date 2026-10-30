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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { invoiceService, RetailerParty } from '@/api/invoiceService';
import { Colors, Typography, Shapes, Shadows } from '@/theme/tokens';

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

  const handleSelectParty = (party: RetailerParty) => {
    onSelect(party);
    onClose();
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

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Customer / Party</Text>
              <Text style={styles.subtitle}>Choose an existing party or create a new one</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by party name, phone, or GST..."
              placeholderTextColor={Colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x-circle" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Add Party Bar if onAddNew provided */}
          {onAddNew && (
            <TouchableOpacity
              style={styles.quickAddPartyBar}
              onPress={() => {
                onClose();
                onAddNew();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.quickAddPartyIcon}>
                <Feather name="user-plus" size={16} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickAddPartyTitle}>Add New Customer / Party</Text>
                <Text style={styles.quickAddPartySub}>Register a new retailer profile</Text>
              </View>
              <Feather name="arrow-right" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}

          {/* List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filteredParties}
              keyExtractor={(item) => String(item.partyId)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = item.partyId === selectedPartyId;
                return (
                  <TouchableOpacity
                    style={[styles.partyItem, isSelected && styles.selectedPartyItem]}
                    onPress={() => handleSelectParty(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                      <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                        {(item.partyName || 'P').charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.partyInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.partyName} numberOfLines={1}>
                          {item.partyName}
                        </Text>
                        {isSelected && (
                          <View style={styles.selectedPill}>
                            <Text style={styles.selectedPillText}>Selected</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.partyBadgesRow}>
                        {item.partyPhone ? (
                          <View style={styles.partyBadge}>
                            <Feather name="phone" size={10} color={Colors.textSecondary} />
                            <Text style={styles.partyBadgeText}>{item.partyPhone}</Text>
                          </View>
                        ) : null}

                        {item.partyGst ? (
                          <View style={[styles.partyBadge, styles.partyGstBadge]}>
                            <Feather name="file-text" size={10} color={Colors.primary} />
                            <Text style={[styles.partyBadgeText, styles.partyGstBadgeText]}>
                              GST: {item.partyGst}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {item.partyAddress ? (
                        <View style={styles.partyAddressRow}>
                          <Feather name="map-pin" size={10} color={Colors.textSecondary} />
                          <Text style={styles.partyAddressText} numberOfLines={1}>
                            {item.partyAddress}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected ? (
                        <Feather name="check" size={12} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Feather name="users" size={36} color={Colors.textSecondary} />
                  <Text style={styles.emptyText}>No parties found</Text>
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
    backgroundColor: 'rgba(27, 24, 64, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 24,
    ...Shadows.card,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tabBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusLarge,
    paddingHorizontal: 14,
    height: 46,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  quickAddPartyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: Shapes.radiusMedium,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    gap: 10,
  },
  quickAddPartyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddPartyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  quickAddPartySub: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  partyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    borderRadius: 14,
    marginBottom: 4,
  },
  selectedPartyItem: {
    backgroundColor: '#F3F0FF',
    borderBottomWidth: 0,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSelected: {
    backgroundColor: Colors.primary,
  },
  avatarText: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  avatarTextSelected: {
    color: '#FFFFFF',
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  selectedPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  partyBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  partyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  partyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  partyGstBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#D9D7F9',
  },
  partyGstBadgeText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  partyAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  partyAddressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.tabBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
