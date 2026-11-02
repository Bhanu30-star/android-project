import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ProductItem,
  CategoryItem,
  SubCategoryItem,
  MeasurementUnitItem,
  fetchProductListApi,
  fetchProductCategoriesApi,
  fetchProductSubCategoriesApi,
  fetchMeasurementUnitsApi,
  updateProductStatusApi,
} from '@/api/products';
import { CategorySelectSheet } from './CategorySelectSheet';
import { SubCategorySelectSheet } from './SubCategorySelectSheet';
import { AddEditProductModal } from './AddEditProductModal';
import { UnitConversionModal } from './UnitConversionModal';

interface ProductMasterScreenProps {
  onBack?: () => void;
}

export const ProductMasterScreen: React.FC<ProductMasterScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategoryItem | null>(null);

  // Filter sheets
  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [subCategorySheetVisible, setSubCategorySheetVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);

  // Data
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategoryItem[]>([]);
  const [measurementUnits, setMeasurementUnits] = useState<MeasurementUnitItem[]>([]);
  const [dynamicTypes, setDynamicTypes] = useState<string[]>([
    'All',
    'Service',
    'FMCG',
    'Serial No',
    'Commission',
  ]);

  // Pagination & Loading
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Modals
  const [addEditModalVisible, setAddEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [conversionModalVisible, setConversionModalVisible] = useState(false);
  const [activeProductForConv, setActiveProductForConv] = useState<ProductItem | null>(null);

  // Context Menu for a product card (3-dots)
  const [actionProduct, setActionProduct] = useState<ProductItem | null>(null);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Load auxiliary data (categories, units)
  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchProductCategoriesApi();
      setCategories(cats);
    } catch (err) {
      console.warn('Failed to load categories', err);
    }
  }, []);

  const loadSubCategories = useCallback(async (catId: number) => {
    try {
      const subs = await fetchProductSubCategoriesApi(catId);
      setSubcategories(subs);
    } catch (err) {
      console.warn('Failed to load subcategories', err);
    }
  }, []);

  const loadMeasurementUnits = useCallback(async () => {
    try {
      const units = await fetchMeasurementUnitsApi();
      setMeasurementUnits(units);
    } catch (err) {
      console.warn('Failed to load units', err);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadMeasurementUnits();
  }, [loadCategories, loadMeasurementUnits]);

  // Load products list
  const loadProducts = useCallback(
    async (pageNum = 1, shouldAppend = false) => {
      try {
        if (!shouldAppend) setIsLoading(true);
        const res = await fetchProductListApi({
          page: pageNum,
          limit: 20,
          search: debouncedSearch,
          product_type_val: selectedType,
          category_id: selectedCategory?.categoryId,
          subcategory_id: selectedSubCategory?.subcategoryId,
        });

        if (shouldAppend) {
          setProducts((prev) => [...prev, ...res.data]);
        } else {
          setProducts(res.data);
        }
        setTotalCount(res.total);

        // Update dynamic types if provided
        if (res.category && res.category.length > 0) {
          const typesSet = new Set(['All', ...res.category]);
          if (res.category.includes('Service')) {
            typesSet.add('Commission');
          }
          setDynamicTypes(Array.from(typesSet));
        }
      } catch (err) {
        console.warn('Failed to load products', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, selectedType, selectedCategory, selectedSubCategory]
  );

  useEffect(() => {
    setPage(1);
    loadProducts(1, false);
  }, [debouncedSearch, selectedType, selectedCategory, selectedSubCategory, loadProducts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setPage(1);
    loadProducts(1, false);
    loadCategories();
  };

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || products.length >= totalCount) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setIsLoadingMore(true);
    loadProducts(nextPage, true);
  };

  // Toggle status
  const handleToggleStatus = async (item: ProductItem) => {
    const nextStatus = item.status === 'Active' ? 'Deactive' : 'Active';
    try {
      await updateProductStatusApi(item.product_id, nextStatus);
      setProducts((prev) =>
        prev.map((p) => (p.product_id === item.product_id ? { ...p, status: nextStatus } : p))
      );
      if (actionSheetVisible) setActionSheetVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
  };

  // Delete product
  const handleDeleteProduct = (item: ProductItem) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${item.product_name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateProductStatusApi(item.product_id, 'Deleted');
              setProducts((prev) => prev.filter((p) => p.product_id !== item.product_id));
              setTotalCount((c) => Math.max(0, c - 1));
              setActionSheetVisible(false);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  // Format currency cleanly without long decimals
  const formatPrice = (val?: number | string) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format stock display
  const formatStock = (val?: number | string, unit = 'PCS') => {
    const num = Number(val || 0);
    return `${num.toLocaleString('en-IN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })} ${unit || 'PCS'}`;
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={22} color="#0E204E" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Products</Text>
        </View>

        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => {
            setEditingProduct(null);
            setAddEditModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.headerAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#5A6B87" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Here..."
            placeholderTextColor="#8E9CAE"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x-circle" size={18} color="#8E9EB5" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Pills Row */}
      <View style={styles.filterBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {/* 1. Type Dropdown Pill */}
          <TouchableOpacity
            style={[styles.filterPill, selectedType !== 'All' && styles.filterPillActive]}
            onPress={() => setTypeModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedType !== 'All' && styles.filterPillTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedType}
            </Text>
            <Feather
              name="chevron-down"
              size={14}
              color={selectedType !== 'All' ? '#0047AB' : '#5A6B87'}
            />
          </TouchableOpacity>

          {/* 2. Category Pill */}
          <TouchableOpacity
            style={[styles.filterPill, selectedCategory && styles.filterPillActive]}
            onPress={() => setCategorySheetVisible(true)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedCategory && styles.filterPillTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedCategory ? selectedCategory.categoryName : 'Category'}
            </Text>
            {selectedCategory ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(null);
                  setSelectedSubCategory(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={13} color="#0047AB" />
              </TouchableOpacity>
            ) : (
              <Feather name="chevron-down" size={14} color="#5A6B87" />
            )}
          </TouchableOpacity>

          {/* 3. Sub Category Pill */}
          <TouchableOpacity
            style={[styles.filterPill, selectedSubCategory && styles.filterPillActive]}
            onPress={() => {
              if (!selectedCategory) {
                setCategorySheetVisible(true);
              } else {
                setSubCategorySheetVisible(true);
              }
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedSubCategory && styles.filterPillTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedSubCategory ? selectedSubCategory.subcategoryName : 'Sub Category'}
            </Text>
            {selectedSubCategory ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedSubCategory(null);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={13} color="#0047AB" />
              </TouchableOpacity>
            ) : (
              <Feather name="chevron-down" size={14} color="#5A6B87" />
            )}
          </TouchableOpacity>

          {/* Count Badge */}
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{totalCount} items</Text>
          </View>
        </ScrollView>
      </View>

      {/* Main Product List */}
      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0047AB" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.product_id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 110 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#0047AB"
              colors={['#0047AB']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => {
            const isZeroStock = Number(item.stock_quantity || 0) <= 0;
            const isActive = item.status === 'Active';

            return (
              <View style={styles.productCard}>
                {/* Top Row: Name, Status Badge, 3-Dots */}
                <View style={styles.cardHeader}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.product_name}
                  </Text>

                  <View style={styles.headerRightGroup}>
                    <TouchableOpacity
                      style={[
                        styles.statusBadge,
                        isActive ? styles.statusActive : styles.statusDeactive,
                      ]}
                      onPress={() => handleToggleStatus(item)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          isActive ? styles.statusTextActive : styles.statusTextDeactive,
                        ]}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.moreBtn}
                      onPress={() => {
                        setActionProduct(item);
                        setActionSheetVisible(true);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="more-vertical" size={18} color="#8E9EB5" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Middle Row: Category / Subtitle & HSN */}
                <View style={styles.cardSubtitleRow}>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {item.category_name || item.product_type || 'General'}
                    {item.subcategory_name ? ` · ${item.subcategory_name}` : ''}
                    {item.hsn_code ? ` · HSN ${item.hsn_code}` : ''}
                  </Text>
                </View>

                {/* Bottom Row: Price & Stock */}
                <View style={styles.cardFooter}>
                  {/* Formatted clean price */}
                  <Text
                    style={styles.priceText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatPrice(item.product_price)}
                  </Text>

                  {/* Stock pill with warning indicator if 0 */}
                  <View
                    style={[
                      styles.stockPill,
                      isZeroStock ? styles.stockPillWarning : styles.stockPillNormal,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockText,
                        isZeroStock ? styles.stockTextWarning : styles.stockTextNormal,
                      ]}
                    >
                      {isZeroStock ? '▲ ' : ''}{formatStock(item.stock_quantity, item.unit)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#0047AB" />
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="box" size={32} color="#0047AB" />
              </View>
              <Text style={styles.emptyTitle}>No Products Found</Text>
              <Text style={styles.emptySub}>
                {search.trim()
                  ? `No matches for "${search}". Try searching something else.`
                  : 'Start adding items to build your product master catalog.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => {
                  setEditingProduct(null);
                  setAddEditModalVisible(true);
                }}
              >
                <Feather name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Add Product</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
        onPress={() => {
          setEditingProduct(null);
          setAddEditModalVisible(true);
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#10142A" />
      </TouchableOpacity>

      {/* Product Card 3-Dots Action Sheet */}
      <Modal
        visible={actionSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionSheetVisible(false)}
      >
        <View style={styles.actionModalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setActionSheetVisible(false)}
          />
          <View style={[styles.actionModalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.actionModalHeader}>
              <Text style={styles.actionModalTitle} numberOfLines={1}>
                {actionProduct?.product_name}
              </Text>
              <Text style={styles.actionModalSub}>
                {formatPrice(actionProduct?.product_price)} · Stock: {actionProduct?.stock_quantity}
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActionSheetVisible(false);
                setEditingProduct(actionProduct);
                setAddEditModalVisible(true);
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(92, 96, 245, 0.15)' }]}>
                <Feather name="edit-2" size={18} color="#818CF8" />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionItemTitle}>Edit Product</Text>
                <Text style={styles.actionItemSub}>Update price, tax, units or info</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                if (actionProduct) handleToggleStatus(actionProduct);
              }}
            >
              <View
                style={[
                  styles.actionIconBox,
                  {
                    backgroundColor:
                      actionProduct?.status === 'Active'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                  },
                ]}
              >
                <Feather
                  name={actionProduct?.status === 'Active' ? 'slash' : 'check'}
                  size={18}
                  color={actionProduct?.status === 'Active' ? '#EF4444' : '#10B981'}
                />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionItemTitle}>
                  {actionProduct?.status === 'Active' ? 'Deactivate Product' : 'Activate Product'}
                </Text>
                <Text style={styles.actionItemSub}>
                  {actionProduct?.status === 'Active'
                    ? 'Hide from new invoices'
                    : 'Show in invoices and orders'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActionSheetVisible(false);
                setActiveProductForConv(actionProduct);
                setConversionModalVisible(true);
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Feather name="repeat" size={18} color="#38BDF8" />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionItemTitle}>Unit Conversions</Text>
                <Text style={styles.actionItemSub}>Manage Box, Carton, or Pack prices</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionItem, styles.deleteActionItem]}
              onPress={() => {
                if (actionProduct) handleDeleteProduct(actionProduct);
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Feather name="trash-2" size={18} color="#EF4444" />
              </View>
              <View style={styles.actionTextBox}>
                <Text style={[styles.actionItemTitle, { color: '#EF4444' }]}>Delete Product</Text>
                <Text style={styles.actionItemSub}>Remove from product master</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Product Type Filter Modal */}
      <Modal
        visible={typeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypeModalVisible(false)}
      >
        <View style={styles.actionModalBackdrop}>
          <TouchableOpacity
            style={styles.overlayTouch}
            activeOpacity={1}
            onPress={() => setTypeModalVisible(false)}
          />
          <View style={styles.typeFilterCard}>
            <Text style={styles.typeFilterTitle}>Filter by Product Type</Text>
            {dynamicTypes.map((type) => {
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOptionRow, isSelected && styles.typeOptionRowSelected]}
                  onPress={() => {
                    setSelectedType(type);
                    setTypeModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      isSelected && styles.typeOptionTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                  {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Add / Edit Wizard Modal */}
      <AddEditProductModal
        visible={addEditModalVisible}
        product={editingProduct}
        onClose={() => {
          setAddEditModalVisible(false);
          setEditingProduct(null);
        }}
        onSuccess={() => {
          loadProducts(1, false);
        }}
        categories={categories}
        subcategories={subcategories}
        measurementUnits={measurementUnits}
        onRefreshCategories={loadCategories}
        onRefreshSubCategories={loadSubCategories}
        dynamicProductTypes={dynamicTypes.filter((t) => t !== 'All')}
      />

      {/* Category Select Sheet for Filters */}
      <CategorySelectSheet
        visible={categorySheetVisible}
        selectedCategoryId={selectedCategory?.categoryId || null}
        categories={categories}
        onClose={() => setCategorySheetVisible(false)}
        onSelect={(cat) => {
          setSelectedCategory(cat);
          setSelectedSubCategory(null);
          if (cat?.categoryId) {
            loadSubCategories(cat.categoryId);
          }
        }}
        onCategoryAdded={loadCategories}
      />

      {/* Sub Category Select Sheet for Filters */}
      <SubCategorySelectSheet
        visible={subCategorySheetVisible}
        selectedCategoryId={selectedCategory?.categoryId || null}
        selectedSubCategoryId={selectedSubCategory?.subcategoryId || null}
        subcategories={subcategories}
        onClose={() => setSubCategorySheetVisible(false)}
        onSelect={(sub) => setSelectedSubCategory(sub)}
        onSubCategoryAdded={() => {
          if (selectedCategory) loadSubCategories(selectedCategory.categoryId);
        }}
      />

      {/* Unit Conversion Modal */}
      <UnitConversionModal
        visible={conversionModalVisible}
        product={activeProductForConv}
        onClose={() => {
          setConversionModalVisible(false);
          setActiveProductForConv(null);
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0047AB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
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
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
    fontWeight: '500',
  },
  filterBarContainer: {
    paddingBottom: 8,
  },
  filterPillsRow: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0047AB',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  filterPillTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
  countBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    color: '#5A6B87',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 12,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 10,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusDeactive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#16A34A',
  },
  statusTextDeactive: {
    color: '#64748B',
  },
  moreBtn: {
    padding: 2,
  },
  cardSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    gap: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0047AB',
    letterSpacing: -0.3,
    flex: 1,
    minWidth: 0,
  },
  stockPill: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  stockPillWarning: {
    backgroundColor: 'transparent',
  },
  stockPillNormal: {
    backgroundColor: 'transparent',
  },
  stockText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stockTextWarning: {
    color: '#DC2626',
  },
  stockTextNormal: {
    color: '#0E204E',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#5A6B87',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0047AB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  actionModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 88, 0.45)',
    justifyContent: 'flex-end',
  },
  overlayTouch: {
    flex: 1,
  },
  actionModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 8,
    elevation: 10,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DFE7F2',
    alignSelf: 'center',
    marginBottom: 12,
  },
  actionModalHeader: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 4,
  },
  actionModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
  },
  actionModalSub: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  deleteActionItem: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTextBox: {
    flex: 1,
  },
  actionItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  actionItemSub: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 1,
  },
  typeFilterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    alignSelf: 'center',
    width: '88%',
    maxWidth: 360,
    gap: 6,
    elevation: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  typeFilterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  typeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  typeOptionRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A6B87',
  },
  typeOptionTextSelected: {
    color: '#0047AB',
    fontWeight: '700',
  },
});
