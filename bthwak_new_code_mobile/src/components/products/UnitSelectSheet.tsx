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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { MeasurementUnitItem } from '@/api/products';

interface UnitSelectSheetProps {
  visible: boolean;
  title?: string;
  selectedUnit: string;
  onClose: () => void;
  onSelect: (unit: string) => void;
  units: MeasurementUnitItem[];
  isLoading?: boolean;
}

const COMMON_UNITS = ['PCS', 'BOX', 'KGS', 'PKT', 'BAG', 'SET', 'DOZ', 'MTR', 'NOS'];

export const UnitSelectSheet: React.FC<UnitSelectSheetProps> = ({
  visible,
  title = 'Select Measurement Unit',
  selectedUnit,
  onClose,
  onSelect,
  units,
  isLoading = false,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const unitList = useMemo(() => {
    const list = units.map((u) => u.unitName);
    COMMON_UNITS.forEach((cu) => {
      if (!list.includes(cu)) list.push(cu);
    });
    if (!search.trim()) return list;
    const q = search.toLowerCase().trim();
    return list.filter((u) => u.toLowerCase().includes(q));
  }, [units, search]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={20} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#5A6B87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search unit..."
              placeholderTextColor="#8E9CAE"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="characters"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x-circle" size={16} color="#8E9CAE" />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick presets */}
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsLabel}>Common Units:</Text>
            <View style={styles.chipsRow}>
              {COMMON_UNITS.map((unit) => {
                const isSelected = selectedUnit?.toUpperCase() === unit.toUpperCase();
                return (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                      onSelect(unit);
                      onClose();
                    }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* List */}
          {isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#0047AB" />
              <Text style={styles.loadingText}>Loading units...</Text>
            </View>
          ) : (
            <FlatList
              data={unitList}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = selectedUnit?.toUpperCase() === item.toUpperCase();
                return (
                  <TouchableOpacity
                    style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                      {item}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Feather name="check" size={16} color="#0047AB" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No unit found</Text>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    minHeight: 380,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    elevation: 16,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DFE7F2',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    height: 44,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
  },
  presetsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  presetsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  chipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0047AB',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
  },
  chipTextSelected: {
    color: '#0047AB',
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderRadius: 10,
  },
  itemRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0E204E',
  },
  itemTextSelected: {
    color: '#0047AB',
    fontWeight: '700',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLoading: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#5A6B87',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#5A6B87',
  },
});
