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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { CategoryItem, addProductCategoryApi } from '@/api/products';

interface CategorySelectSheetProps {
  visible: boolean;
  selectedCategoryId: number | null;
  onClose: () => void;
  onSelect: (category: CategoryItem | null) => void;
  categories: CategoryItem[];
  isLoading?: boolean;
  onCategoryAdded?: () => void;
}

export const CategorySelectSheet: React.FC<CategorySelectSheetProps> = ({
  visible,
  selectedCategoryId,
  onClose,
  onSelect,
  categories,
  isLoading = false,
  onCategoryAdded,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase().trim();
    return categories.filter((c) => c.categoryName.toLowerCase().includes(q));
  }, [categories, search]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Required', 'Please enter a category name');
      return;
    }
    try {
      setIsSubmitting(true);
      await addProductCategoryApi(newCategoryName.trim());
      setNewCategoryName('');
      setIsCreating(false);
      onCategoryAdded?.();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Text style={styles.title}>Select Category</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={20} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#5A6B87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search category..."
              placeholderTextColor="#8E9CAE"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x-circle" size={16} color="#8E9CAE" />
              </TouchableOpacity>
            )}
          </View>

          {/* Actions: + Create & Clear */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => setIsCreating(!isCreating)}
              activeOpacity={0.8}
            >
              <Feather name={isCreating ? 'minus' : 'plus'} size={15} color="#0047AB" />
              <Text style={styles.createBtnText}>
                {isCreating ? 'Cancel' : 'Create'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Feather name="x" size={14} color="#DC2626" />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Inline Create Input */}
          {isCreating && (
            <View style={styles.createCard}>
              <Text style={styles.createTitle}>New Category</Text>
              <TextInput
                style={styles.createInput}
                placeholder="Enter category name..."
                placeholderTextColor="#8E9CAE"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
              <View style={styles.createActionsRow}>
                <TouchableOpacity
                  style={styles.createCancelBtn}
                  onPress={() => {
                    setIsCreating(false);
                    setNewCategoryName('');
                  }}
                >
                  <Text style={styles.createCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.createSaveBtn}
                  onPress={handleCreateCategory}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createSaveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* List */}
          {isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#0047AB" />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => String(item.categoryId)}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = selectedCategoryId === item.categoryId;
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
                      {item.categoryName}
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
                  <Text style={styles.emptyText}>No category found</Text>
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
    maxHeight: '82%',
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0047AB',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  createCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  createTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 8,
  },
  createInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    color: '#0E204E',
    fontSize: 14,
    marginBottom: 10,
  },
  createActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  createCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
  },
  createSaveBtn: {
    backgroundColor: '#0047AB',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  createSaveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    borderRadius: 10,
  },
  itemRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  itemText: {
    fontSize: 15,
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
