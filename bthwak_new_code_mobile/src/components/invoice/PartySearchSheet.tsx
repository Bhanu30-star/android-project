import React, { useState } from 'react';
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
}

export const PartySearchSheet: React.FC<PartySearchSheetProps> = ({
  visible,
  onClose,
  onSelect,
  selectedPartyId,
}) => {
  const [search, setSearch] = useState('');

  const { data: parties = [], isLoading } = useQuery({
    queryKey: ['retailer-parties', search],
    queryFn: () => invoiceService.fetchRetailerParties(search),
    enabled: visible,
  });

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
              <Text style={styles.title}>Select Party</Text>
              <Text style={styles.subtitle}>Search customer or retailer</Text>
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
              placeholder="Search by party name or phone..."
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

          {/* List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : (
            <FlatList
              data={parties}
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
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(item.partyName || 'P').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.partyInfo}>
                      <Text style={styles.partyName} numberOfLines={1}>
                        {item.partyName}
                      </Text>
                      {item.partyPhone ? (
                        <Text style={styles.partyPhone}>{item.partyPhone}</Text>
                      ) : null}
                      {item.partyGst ? (
                        <Text style={styles.partyGst}>GSTIN: {item.partyGst}</Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Feather name="check" size={20} color={Colors.primary} />
                    ) : (
                      <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
                    )}
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  partyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  selectedPartyItem: {
    backgroundColor: '#EEEDFF',
    borderRadius: Shapes.radiusMedium,
    paddingHorizontal: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  partyPhone: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  partyGst: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.primaryDeep,
    marginTop: 1,
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
