import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { HSNItem, fetchHSNCodeListApi } from '@/api/products';

interface HSNSelectSheetProps {
  visible: boolean;
  selectedHsnCode: string;
  onClose: () => void;
  onSelect: (hsn: HSNItem) => void;
}

export const HSNSelectSheet: React.FC<HSNSelectSheetProps> = ({
  visible,
  selectedHsnCode,
  onClose,
  onSelect,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hsnList, setHsnList] = useState<HSNItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  // Fetch initial list when visible or debouncedSearch changes
  useEffect(() => {
    if (!visible) return;
    let isCancelled = false;

    async function loadInitial() {
      setIsLoading(true);
      setHasMore(true);
      try {
        const items = await fetchHSNCodeListApi(debouncedSearch, 0);
        if (!isCancelled) {
          setHsnList(items);
          if (items.length < 15) {
            setHasMore(false);
          }
        }
      } catch (err) {
        console.warn('Failed to load HSN codes', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadInitial();
    return () => {
      isCancelled = true;
    };
  }, [visible, debouncedSearch]);

  const handleLoadMore = async () => {
    if (isLoading || isLoadingMore || !hasMore || hsnList.length === 0) return;
    const lastItem = hsnList[hsnList.length - 1];
    if (!lastItem?.hsn_id) return;

    try {
      setIsLoadingMore(true);
      const moreItems = await fetchHSNCodeListApi(debouncedSearch, lastItem.hsn_id);
      if (moreItems.length === 0) {
        setHasMore(false);
      } else {
        setHsnList((prev) => [...prev, ...moreItems]);
        if (moreItems.length < 10) setHasMore(false);
      }
    } catch (err) {
      console.warn('Failed to load more HSN codes', err);
    } finally {
      setIsLoadingMore(false);
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
            <Text style={styles.title}>Select HSN Code</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={20} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#5A6B87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by HSN code or item..."
              placeholderTextColor="#8E9CAE"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x-circle" size={16} color="#8E9CAE" />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          {isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color="#0047AB" />
              <Text style={styles.loadingText}>Loading HSN codes...</Text>
            </View>
          ) : (
            <FlatList
              data={hsnList}
              keyExtractor={(item) => `${item.hsn_id}-${item.hsn_code}`}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              renderItem={({ item }) => {
                const isSelected = selectedHsnCode === item.hsn_code;
                return (
                  <TouchableOpacity
                    style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemInfo}>
                      <View style={styles.hsnBadge}>
                        <Text style={styles.hsnCodeText}>{item.hsn_code}</Text>
                      </View>
                      <Text style={styles.hsnDescription} numberOfLines={2}>
                        {item.description || 'No Description'}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Feather name="check" size={16} color="#0047AB" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator size="small" color="#0047AB" />
                  </View>
                ) : undefined
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No HSN codes found</Text>
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
    maxHeight: '85%',
    minHeight: 450,
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
  itemInfo: {
    flex: 1,
    marginRight: 10,
  },
  hsnBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  hsnCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0047AB',
  },
  hsnDescription: {
    fontSize: 13,
    color: '#5A6B87',
    lineHeight: 18,
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
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#5A6B87',
  },
  footerLoading: {
    paddingVertical: 12,
    alignItems: 'center',
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
