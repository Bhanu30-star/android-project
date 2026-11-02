import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
  ProductItem,
  CategoryItem,
  SubCategoryItem,
  HSNItem,
  MeasurementUnitItem,
  AddEditProductPayload,
  addEditProductApi,
} from '@/api/products';
import { CategorySelectSheet } from './CategorySelectSheet';
import { SubCategorySelectSheet } from './SubCategorySelectSheet';
import { HSNSelectSheet } from './HSNSelectSheet';
import { UnitSelectSheet } from './UnitSelectSheet';

interface AddEditProductModalProps {
  visible: boolean;
  product: ProductItem | null; // null for add, object for edit
  onClose: () => void;
  onSuccess: () => void;
  categories: CategoryItem[];
  subcategories: SubCategoryItem[];
  measurementUnits: MeasurementUnitItem[];
  onRefreshCategories: () => void;
  onRefreshSubCategories: (catId: number) => void;
  dynamicProductTypes?: string[];
}

export const AddEditProductModal: React.FC<AddEditProductModalProps> = ({
  visible,
  product,
  onClose,
  onSuccess,
  categories,
  subcategories,
  measurementUnits,
  onRefreshCategories,
  onRefreshSubCategories,
  dynamicProductTypes = ['FMCG', 'Serial No', 'Service', 'Commission'],
}) => {
  const insets = useSafeAreaInsets();
  const isEditMode = Boolean(product);

  // Stepper state: 1, 2, or 3
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Sheets state
  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [subCategorySheetVisible, setSubCategorySheetVisible] = useState(false);
  const [hsnSheetVisible, setHsnSheetVisible] = useState(false);
  const [primaryUnitSheetVisible, setPrimaryUnitSheetVisible] = useState(false);
  const [secondaryUnitSheetVisible, setSecondaryUnitSheetVisible] = useState(false);
  const [typeSheetVisible, setTypeSheetVisible] = useState(false);
  const [gstRateSheetVisible, setGstRateSheetVisible] = useState(false);
  const [inventorySheetVisible, setInventorySheetVisible] = useState(false);
  const [itemTypeSheetVisible, setItemTypeSheetVisible] = useState(false);

  // STEP 1 FIELDS: Basic Information
  const [productType, setProductType] = useState('FMCG');
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategoryItem | null>(null);
  const [productName, setProductName] = useState('');
  const [maintainInventory, setMaintainInventory] = useState<'Yes' | 'No'>('Yes');
  const [itemType, setItemType] = useState<'Finished' | 'Raw'>('Finished');
  const [proSerialCategory, setProSerialCategory] = useState<'Mobile' | 'Accessories'>('Mobile');

  // STEP 2 FIELDS: Pricing & Tax
  const [salePriceInc, setSalePriceInc] = useState('');
  const [purchasePriceInc, setPurchasePriceInc] = useState('');
  const [gstApplicable, setGstApplicable] = useState<'Yes' | 'No'>('Yes');
  const [gstPercent, setGstPercent] = useState('18');
  const [discountApplicable, setDiscountApplicable] = useState<'Yes' | 'No'>('No');
  const [discountPercent, setDiscountPercent] = useState('');
  const [selectedHsn, setSelectedHsn] = useState<HSNItem | null>(null);
  const [primaryUnit, setPrimaryUnit] = useState('PCS');
  const [secondaryUnit, setSecondaryUnit] = useState('PCS');
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));

  // STEP 3 FIELDS: Additional Details & Configurations
  const [mrpPrice, setMrpPrice] = useState('');
  const [dealerPrice, setDealerPrice] = useState('');
  const [alias, setAlias] = useState('');
  const [barcode, setBarcode] = useState('');
  const [warranty, setWarranty] = useState('');
  const [lowStockQty, setLowStockQty] = useState('');
  const [stockInHand, setStockInHand] = useState('');

  // Configurations
  const [allowDecimal, setAllowDecimal] = useState<'Yes' | 'No'>('Yes');
  const [cessApplicable, setCessApplicable] = useState<'Yes' | 'No'>('No');
  const [cessDiscount, setCessDiscount] = useState('');
  const [cessOnSale, setCessOnSale] = useState(true);
  const [cessOnPurchase, setCessOnPurchase] = useState(true);
  const [consumeRawProduct, setConsumeRawProduct] = useState<'Yes' | 'No'>('No');
  const [barcodeGenerate, setBarcodeGenerate] = useState<'Yes' | 'No'>('No');
  const [isEcom, setIsEcom] = useState<'Yes' | 'No'>('No');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (!visible) return;
    setStep(1);

    if (product) {
      setProductType(product.product_type || 'FMCG');
      setProductName(product.product_name || '');
      setMaintainInventory((product.maintain_inventory as any) || 'Yes');
      setItemType((product.item_type as any) || 'Finished');
      setProSerialCategory((product.serial_type as any) || 'Mobile');

      // Category
      const foundCat = categories.find((c) => c.categoryId === product.category_id);
      setSelectedCategory(
        foundCat ||
          (product.category_id && product.category_name
            ? { categoryId: product.category_id, categoryName: product.category_name }
            : null)
      );

      // SubCategory
      const foundSub = subcategories.find((s) => s.subcategoryId === product.subcategory_id);
      setSelectedSubCategory(
        foundSub ||
          (product.subcategory_id && product.subcategory_name
            ? { subcategoryId: product.subcategory_id, subcategoryName: product.subcategory_name }
            : null)
      );

      // Pricing
      setSalePriceInc(product.product_price != null ? String(product.product_price) : '');
      setPurchasePriceInc(product.purchase_price != null ? String(product.purchase_price) : '');
      setGstApplicable((product.gst_applicable as any) || 'Yes');
      setGstPercent(product.IGST != null ? String(product.IGST) : '18');
      setDiscountApplicable((product.discount_applicable as any) || 'No');
      setDiscountPercent(
        product.discount_percentage != null ? String(product.discount_percentage) : ''
      );

      if (product.hsn_code) {
        setSelectedHsn({
          hsn_id: 0,
          hsn_code: product.hsn_code,
          description: '',
        });
      } else {
        setSelectedHsn(null);
      }

      setPrimaryUnit(product.unit || 'PCS');
      setSecondaryUnit(product.secondary_unit || 'PCS');

      // Additional
      setMrpPrice(product.mrp_price != null ? String(product.mrp_price) : '');
      setDealerPrice(product.dealer_price != null ? String(product.dealer_price) : '');
      setAlias(product.alias || '');
      setBarcode(product.product_barcode || '');
      setWarranty(product.warranty || '');
      setLowStockQty(
        product.low_stock_quantity != null ? String(product.low_stock_quantity) : ''
      );
      setStockInHand(product.stock_quantity != null ? String(product.stock_quantity) : '');

      // Configurations
      setAllowDecimal((product.decimal_category as any) || 'Yes');
      setCessApplicable((product.cess_applicable as any) || 'No');
      setCessDiscount(product.cess_percentage != null ? String(product.cess_percentage) : '');
      setCessOnSale(product.cess_on_sale !== 'No');
      setCessOnPurchase(product.cess_on_purchase !== 'No');
      setConsumeRawProduct('No');
      setBarcodeGenerate((product.barcode_generator as any) || 'No');
      setIsEcom((product.is_ecom as any) || 'No');
    } else {
      // Defaults for new product
      setProductType('FMCG');
      setProductName('');
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setMaintainInventory('Yes');
      setItemType('Finished');
      setProSerialCategory('Mobile');

      setSalePriceInc('');
      setPurchasePriceInc('');
      setGstApplicable('Yes');
      setGstPercent('18');
      setDiscountApplicable('No');
      setDiscountPercent('');
      setSelectedHsn(null);
      setPrimaryUnit('PCS');
      setSecondaryUnit('PCS');
      setEffectiveDate(new Date().toISOString().slice(0, 10));

      setMrpPrice('');
      setDealerPrice('');
      setAlias('');
      setBarcode('');
      setWarranty('');
      setLowStockQty('');
      setStockInHand('');

      setAllowDecimal('Yes');
      setCessApplicable('No');
      setCessDiscount('');
      setCessOnSale(true);
      setCessOnPurchase(true);
      setConsumeRawProduct('No');
      setBarcodeGenerate('No');
      setIsEcom('No');
    }
  }, [visible, product, categories]);

  // When category changes, load its subcategories
  useEffect(() => {
    if (selectedCategory?.categoryId) {
      onRefreshSubCategories(selectedCategory.categoryId);
    }
  }, [selectedCategory?.categoryId]);

  // Auto calculate exclusive prices
  const salePriceExc = useMemo(() => {
    const inc = parseFloat(salePriceInc);
    if (isNaN(inc) || inc <= 0) return '0.00';
    if (gstApplicable === 'No') return inc.toFixed(2);
    const gst = parseFloat(gstPercent) || 0;
    return (inc / (1 + gst / 100)).toFixed(2);
  }, [salePriceInc, gstApplicable, gstPercent]);

  const purchasePriceExc = useMemo(() => {
    const inc = parseFloat(purchasePriceInc);
    if (isNaN(inc) || inc <= 0) return '0.00';
    if (gstApplicable === 'No') return inc.toFixed(2);
    const gst = parseFloat(gstPercent) || 0;
    return (inc / (1 + gst / 100)).toFixed(2);
  }, [purchasePriceInc, gstApplicable, gstPercent]);

  // Validation
  const validateStep1 = (): boolean => {
    if (!productType) {
      Alert.alert('Required', 'Please select a Product Type.');
      return false;
    }
    if (!selectedCategory) {
      Alert.alert('Required', 'Please select a Category.');
      return false;
    }
    if (!selectedSubCategory) {
      Alert.alert('Required', 'Please select a Sub Category.');
      return false;
    }
    if (!productName.trim()) {
      Alert.alert('Required', 'Please enter Product Name.');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const sInc = parseFloat(salePriceInc);
    if (isNaN(sInc) || sInc < 0) {
      Alert.alert('Required', 'Please enter a valid Sale Price.');
      return false;
    }
    const pInc = parseFloat(purchasePriceInc);
    if (isNaN(pInc) || pInc < 0) {
      Alert.alert('Required', 'Please enter a valid Purchase Price.');
      return false;
    }
    if (!selectedHsn?.hsn_code) {
      Alert.alert('Required', 'Please select an HSN Code.');
      return false;
    }
    if (!primaryUnit) {
      Alert.alert('Required', 'Please select a Primary Unit.');
      return false;
    }
    if (gstApplicable === 'Yes' && !gstPercent) {
      Alert.alert('Required', 'Please select a GST Rate.');
      return false;
    }
    if (discountApplicable === 'Yes' && discountPercent) {
      const disc = parseFloat(discountPercent);
      if (isNaN(disc) || disc < 0 || disc > 100) {
        Alert.alert('Validation Error', 'Discount percentage must be between 0 and 100.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    try {
      setIsSubmitting(true);
      const payload: AddEditProductPayload = {
        product_id: product?.product_id || 0,
        category_id: selectedCategory!.categoryId,
        subcategory_id: selectedSubCategory!.subcategoryId,
        product_name: productName.trim(),
        product_type: productType,
        pro_serial_category: productType === 'Serial No' ? proSerialCategory : '',
        maintain_inventory: maintainInventory,
        item_type: itemType,
        consume_raw_product: consumeRawProduct,
        barcode_generate: barcodeGenerate,
        barcode: barcode.trim(),
        gst_applicable: gstApplicable,
        gst_percentage: gstApplicable === 'Yes' ? gstPercent : '',
        sale_price_inclusive: parseFloat(salePriceInc) || 0,
        sale_price_exclusive: parseFloat(salePriceExc) || 0,
        purchase_price_inclusive: parseFloat(purchasePriceInc) || 0,
        purchase_price_exclusive: parseFloat(purchasePriceExc) || 0,
        dealer_price: dealerPrice.trim(),
        mrp_price: mrpPrice.trim(),
        alias: alias.trim(),
        hsn_code: selectedHsn!.hsn_code,
        primary_measure_unit: primaryUnit,
        secondary_measure_unit: secondaryUnit || primaryUnit,
        decimal_quantity: allowDecimal,
        discount_applicable: discountApplicable,
        discount: discountApplicable === 'Yes' ? parseFloat(discountPercent) || 0 : '',
        warranty: warranty.trim(),
        low_stock_quantity: lowStockQty.trim(),
        stock_in_hand: productType === 'Serial No' ? '0' : stockInHand.trim() || '0',
        stock_effect_date: effectiveDate,
        cess_applicable: cessApplicable,
        on_sale: cessApplicable === 'Yes' ? (cessOnSale ? 'Yes' : 'No') : 'Yes',
        on_purchase: cessApplicable === 'Yes' ? (cessOnPurchase ? 'Yes' : 'No') : 'Yes',
        cess_discount: cessDiscount.trim(),
        source: 'Mobile',
        is_ecom: isEcom,
      };

      const res = await addEditProductApi(payload);
      Alert.alert('Success', res.message || 'Product saved successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const gstRates = ['5', '12', '18', '28'];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={22} color="#0E204E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* Stepper Progress Bar */}
        <View style={styles.stepperContainer}>
          <View style={styles.stepperRow}>
            {/* Step 1 */}
            <TouchableOpacity
              style={[
                styles.stepCircle,
                step >= 1 ? styles.stepCircleActive : styles.stepCircleInactive,
              ]}
              onPress={() => setStep(1)}
              activeOpacity={0.8}
            >
              {step > 1 ? (
                <Feather name="check" size={20} color="#FFFFFF" />
              ) : (
                <Feather name="box" size={20} color={step === 1 ? '#FFFFFF' : '#5A6B87'} />
              )}
            </TouchableOpacity>

            {/* Line 1 -> 2 */}
            <View
              style={[
                styles.stepConnector,
                step >= 2 ? styles.stepConnectorActive : styles.stepConnectorInactive,
              ]}
            />

            {/* Step 2 */}
            <TouchableOpacity
              style={[
                styles.stepCircle,
                step >= 2 ? styles.stepCircleActive : styles.stepCircleInactive,
              ]}
              onPress={() => {
                if (validateStep1()) setStep(2);
              }}
              activeOpacity={0.8}
            >
              {step > 2 ? (
                <Feather name="check" size={20} color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.stepRupeeIcon,
                    step >= 2 ? styles.stepTextActive : styles.stepTextInactive,
                  ]}
                >
                  ₹
                </Text>
              )}
            </TouchableOpacity>

            {/* Line 2 -> 3 */}
            <View
              style={[
                styles.stepConnector,
                step >= 3 ? styles.stepConnectorActive : styles.stepConnectorInactive,
              ]}
            />

            {/* Step 3 */}
            <TouchableOpacity
              style={[
                styles.stepCircle,
                step === 3 ? styles.stepCircleActive : styles.stepCircleInactive,
              ]}
              onPress={() => {
                if (validateStep1() && validateStep2()) setStep(3);
              }}
              activeOpacity={0.8}
            >
              <Feather
                name="settings"
                size={20}
                color={step === 3 ? '#FFFFFF' : '#5A6B87'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Step Title Header */}
        <View style={styles.stepTitleBox}>
          <Text style={styles.stepSubtitle}>
            {step === 1
              ? 'Step 1 of 3: Basic Info'
              : step === 2
              ? 'Step 2 of 3: Pricing & Tax'
              : 'Step 3 of 3: Additional'}
          </Text>
          <Text style={styles.stepHeading}>
            {step === 1
              ? 'Basic Information'
              : step === 2
              ? 'Pricing & Tax'
              : 'Additional Details'}
          </Text>
          <Text style={styles.stepDesc}>
            {step === 1
              ? 'Enter the product details'
              : step === 2
              ? 'Set product pricing, tax rates, and units'
              : 'Optional product pricing and inventory settings'}
          </Text>
        </View>

        {/* Scrollable Form Body */}
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: Basic Information */}
          {step === 1 && (
            <View style={styles.stepSection}>
              {/* Product Type */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Product Type <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setTypeSheetVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnText}>{productType || 'Select'}</Text>
                  <Feather name="chevron-down" size={18} color="#8E9EB5" />
                </TouchableOpacity>
              </View>

              {/* Category */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Category <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setCategorySheetVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownBtnText,
                      !selectedCategory && styles.dropdownBtnPlaceholder,
                    ]}
                  >
                    {selectedCategory?.categoryName || 'Select'}
                  </Text>
                  <Feather name="chevron-down" size={18} color="#8E9EB5" />
                </TouchableOpacity>
              </View>

              {/* Sub Category */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Sub Category <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => {
                    if (!selectedCategory) {
                      Alert.alert('Notice', 'Please select a Category first.');
                      return;
                    }
                    setSubCategorySheetVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownBtnText,
                      !selectedSubCategory && styles.dropdownBtnPlaceholder,
                    ]}
                  >
                    {selectedSubCategory?.subcategoryName || 'Select'}
                  </Text>
                  <Feather name="chevron-down" size={18} color="#8E9EB5" />
                </TouchableOpacity>
              </View>

              {/* Product Name */}
              <View style={styles.fieldGroup}>
                <View style={styles.inputWithCounter}>
                  <TextInput
                    style={styles.inputInner}
                    placeholder="Product Name *"
                    placeholderTextColor="#64748B"
                    value={productName}
                    maxLength={100}
                    onChangeText={setProductName}
                  />
                  <Text style={styles.counterText}>{productName.length}/100</Text>
                </View>
              </View>

              {/* Maintain Inventory */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Maintain Inventory <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setInventorySheetVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnText}>{maintainInventory}</Text>
                  <Feather name="chevron-down" size={18} color="#8E9EB5" />
                </TouchableOpacity>
              </View>

              {/* Item Type */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Item Type <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setItemTypeSheetVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownBtnText}>{itemType}</Text>
                  <Feather name="chevron-down" size={18} color="#8E9EB5" />
                </TouchableOpacity>
              </View>

              {/* Serial Category (conditional) */}
              {productType === 'Serial No' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Product Category (Serial No)</Text>
                  <View style={styles.segmentedRow}>
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        proSerialCategory === 'Mobile' && styles.segmentBtnActive,
                      ]}
                      onPress={() => setProSerialCategory('Mobile')}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          proSerialCategory === 'Mobile' && styles.segmentTextActive,
                        ]}
                      >
                        Mobile
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.segmentBtn,
                        proSerialCategory === 'Accessories' && styles.segmentBtnActive,
                      ]}
                      onPress={() => setProSerialCategory('Accessories')}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          proSerialCategory === 'Accessories' && styles.segmentTextActive,
                        ]}
                      >
                        Accessories
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* STEP 2: Pricing & Tax */}
          {step === 2 && (
            <View style={styles.stepSection}>
              {/* Sale Price & Purchase Price side-by-side */}
              <View style={styles.rowTwoCols}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>
                    Sale Price <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.currencyInputBox}>
                    <Text style={styles.currencyPrefix}>₹</Text>
                    <TextInput
                      style={styles.currencyInput}
                      placeholder="0.00"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={salePriceInc}
                      onChangeText={setSalePriceInc}
                    />
                  </View>
                  <Text style={styles.autoCalcText}>
                    Exc: ₹{salePriceExc}
                  </Text>
                </View>

                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>
                    Purchase Price <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.currencyInputBox}>
                    <Text style={styles.currencyPrefix}>₹</Text>
                    <TextInput
                      style={styles.currencyInput}
                      placeholder="0.00"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={purchasePriceInc}
                      onChangeText={setPurchasePriceInc}
                    />
                  </View>
                  <Text style={styles.autoCalcText}>
                    Exc: ₹{purchasePriceExc}
                  </Text>
                </View>
              </View>

              {/* GST Applicable Toggle */}
              <View style={styles.toggleRowClean}>
                <Text style={styles.toggleTitleClean}>
                  GST Applicable <Text style={styles.requiredStar}>*</Text>
                </Text>
                <Switch
                  value={gstApplicable === 'Yes'}
                  onValueChange={(val) => setGstApplicable(val ? 'Yes' : 'No')}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={gstApplicable === 'Yes' ? '#0047AB' : '#F8FAFC'}
                />
              </View>

              {/* GST Rate Dropdown */}
              {gstApplicable === 'Yes' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    GST Rate <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setGstRateSheetVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownBtnText}>
                      {gstPercent ? `${gstPercent}%` : 'Select'}
                    </Text>
                    <Feather name="chevron-down" size={18} color="#8E9EB5" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Discount Toggle */}
              <View style={styles.toggleRowClean}>
                <Text style={styles.toggleTitleClean}>Discount</Text>
                <Switch
                  value={discountApplicable === 'Yes'}
                  onValueChange={(val) => setDiscountApplicable(val ? 'Yes' : 'No')}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={discountApplicable === 'Yes' ? '#0047AB' : '#F8FAFC'}
                />
              </View>

              {/* Discount % (if applicable) */}
              {discountApplicable === 'Yes' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Discount % (0 - 100)</Text>
                  <View style={styles.inputWithCounter}>
                    <TextInput
                      style={styles.inputInner}
                      placeholder="e.g. 10"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={discountPercent}
                      onChangeText={setDiscountPercent}
                    />
                    <Text style={styles.counterText}>%</Text>
                  </View>
                </View>
              )}

              {/* HSN Code Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  HSN Code <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setHsnSheetVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.dropdownInfo}>
                    <Text
                      style={[
                        styles.dropdownBtnText,
                        !selectedHsn && styles.dropdownBtnPlaceholder,
                      ]}
                    >
                      {selectedHsn ? selectedHsn.hsn_code : 'Select HSN Code'}
                    </Text>
                    {selectedHsn?.description ? (
                      <Text style={styles.hsnDescSnippet} numberOfLines={1}>
                        {selectedHsn.description}
                      </Text>
                    ) : null}
                  </View>
                  <Feather name="chevron-right" size={18} color="#8E9EB5" />
                </TouchableOpacity>
              </View>

              {/* Primary & Secondary Unit Row */}
              <View style={styles.rowTwoCols}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>
                    Primary Unit <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setPrimaryUnitSheetVisible(true)}
                  >
                    <Text style={styles.dropdownBtnText}>{primaryUnit || 'PCS'}</Text>
                    <Feather name="chevron-down" size={16} color="#8E9EB5" />
                  </TouchableOpacity>
                </View>

                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Secondary Unit</Text>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setSecondaryUnitSheetVisible(true)}
                  >
                    <Text style={styles.dropdownBtnText}>{secondaryUnit || 'PCS'}</Text>
                    <Feather name="chevron-down" size={16} color="#8E9EB5" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Effective Date with Calendar Icon */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Effective Date</Text>
                <View style={styles.dateInputBox}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                    value={effectiveDate}
                    onChangeText={setEffectiveDate}
                  />
                  <Feather name="calendar" size={18} color="#0047AB" />
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: Additional Details & Configurations */}
          {step === 3 && (
            <View style={styles.stepSection}>
              {/* Row 1: MRP & Dealer Price */}
              <View style={styles.rowTwoCols}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>MRP</Text>
                  <TextInput
                    style={styles.standardInput}
                    placeholder="MRP"
                    placeholderTextColor="#8E9CAE"
                    keyboardType="numeric"
                    value={mrpPrice}
                    onChangeText={setMrpPrice}
                  />
                </View>

                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Dealer Price</Text>
                  <TextInput
                    style={styles.standardInput}
                    placeholder="Dealer Price"
                    placeholderTextColor="#8E9CAE"
                    keyboardType="numeric"
                    value={dealerPrice}
                    onChangeText={setDealerPrice}
                  />
                </View>
              </View>

              {/* Row 2: Alias & Barcode */}
              <View style={styles.rowTwoCols}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Alias</Text>
                  <TextInput
                    style={styles.standardInput}
                    placeholder="Alias"
                    placeholderTextColor="#8E9CAE"
                    value={alias}
                    onChangeText={setAlias}
                  />
                </View>

                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Barcode</Text>
                  <TextInput
                    style={styles.standardInput}
                    placeholder="Barcode"
                    placeholderTextColor="#8E9CAE"
                    value={barcode}
                    onChangeText={setBarcode}
                  />
                </View>
              </View>

              {/* Row 3: Warranty & Low Stock Quantity */}
              <View style={styles.rowTwoCols}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Warranty</Text>
                  <TextInput
                    style={styles.standardInput}
                    placeholder="e.g., 1 Year"
                    placeholderTextColor="#8E9CAE"
                    value={warranty}
                    onChangeText={setWarranty}
                  />
                </View>

                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Low Stock Quantity</Text>
                  <TextInput
                    style={styles.standardInput}
                    placeholder="Low Stock Qty"
                    placeholderTextColor="#8E9CAE"
                    keyboardType="numeric"
                    value={lowStockQty}
                    onChangeText={setLowStockQty}
                  />
                </View>
              </View>

              {/* Full Width: Stock In Hand */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Stock In Hand</Text>
                <TextInput
                  style={[
                    styles.standardInput,
                    productType === 'Serial No' && styles.disabledInput,
                  ]}
                  placeholder="Stock In Hand"
                  placeholderTextColor="#8E9CAE"
                  keyboardType="numeric"
                  editable={productType !== 'Serial No'}
                  value={productType === 'Serial No' ? '0' : stockInHand}
                  onChangeText={setStockInHand}
                />
                {productType === 'Serial No' && (
                  <Text style={styles.helperText}>Managed by Serial / IMEI numbers</Text>
                )}
              </View>

              {/* Section Header: Configurations */}
              <View style={styles.configHeaderBox}>
                <Text style={styles.configSectionTitle}>Configurations</Text>
              </View>

              {/* Configurations List with Dividers */}
              <View style={styles.configListCard}>
                {/* 1. Allow Decimal Quantity */}
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Allow Decimal Quantity</Text>
                  <Switch
                    value={allowDecimal === 'Yes'}
                    onValueChange={(val) => setAllowDecimal(val ? 'Yes' : 'No')}
                    trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                    thumbColor={allowDecimal === 'Yes' ? '#0047AB' : '#F8FAFC'}
                  />
                </View>
                <View style={styles.configDivider} />

                {/* 2. Cess Applicable */}
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Cess Applicable</Text>
                  <Switch
                    value={cessApplicable === 'Yes'}
                    onValueChange={(val) => setCessApplicable(val ? 'Yes' : 'No')}
                    trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                    thumbColor={cessApplicable === 'Yes' ? '#0047AB' : '#F8FAFC'}
                  />
                </View>

                {/* Expanded Cess Details if ON */}
                {cessApplicable === 'Yes' && (
                  <View style={styles.cessExpandedCard}>
                    <Text style={styles.fieldLabel}>Cess Discount / Rate</Text>
                    <TextInput
                      style={styles.standardInput}
                      placeholder="e.g., 12"
                      placeholderTextColor="#8E9CAE"
                      keyboardType="numeric"
                      value={cessDiscount}
                      onChangeText={setCessDiscount}
                    />
                    <View style={styles.checkboxRow}>
                      <TouchableOpacity
                        style={styles.checkOption}
                        onPress={() => setCessOnSale(!cessOnSale)}
                      >
                        <Feather
                          name={cessOnSale ? 'check-square' : 'square'}
                          size={18}
                          color={cessOnSale ? '#0047AB' : '#8E9CAE'}
                        />
                        <Text style={styles.checkOptionText}>On Sale</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.checkOption}
                        onPress={() => setCessOnPurchase(!cessOnPurchase)}
                      >
                        <Feather
                          name={cessOnPurchase ? 'check-square' : 'square'}
                          size={18}
                          color={cessOnPurchase ? '#0047AB' : '#8E9CAE'}
                        />
                        <Text style={styles.checkOptionText}>On Purchase</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                <View style={styles.configDivider} />

                {/* 3. Consume Raw Product */}
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Consume Raw Product</Text>
                  <Switch
                    value={consumeRawProduct === 'Yes'}
                    onValueChange={(val) => setConsumeRawProduct(val ? 'Yes' : 'No')}
                    trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                    thumbColor={consumeRawProduct === 'Yes' ? '#0047AB' : '#F8FAFC'}
                  />
                </View>
                <View style={styles.configDivider} />

                {/* 4. Barcode Generate */}
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>Barcode Generate</Text>
                  <Switch
                    value={barcodeGenerate === 'Yes'}
                    onValueChange={(val) => setBarcodeGenerate(val ? 'Yes' : 'No')}
                    trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                    thumbColor={barcodeGenerate === 'Yes' ? '#0047AB' : '#F8FAFC'}
                  />
                </View>
                <View style={styles.configDivider} />

                {/* 5. E-Commerce */}
                <View style={styles.configRow}>
                  <Text style={styles.configLabel}>E-Commerce</Text>
                  <Switch
                    value={isEcom === 'Yes'}
                    onValueChange={(val) => setIsEcom(val ? 'Yes' : 'No')}
                    trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                    thumbColor={isEcom === 'Yes' ? '#0047AB' : '#F8FAFC'}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation Buttons */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {step === 1 ? (
            <TouchableOpacity
              style={styles.fullWidthNextBtn}
              onPress={() => {
                if (validateStep1()) setStep(2);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          ) : step === 2 ? (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={() => setStep(1)}
                activeOpacity={0.8}
              >
                <Text style={styles.prevBtnText}>← Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() => {
                  if (validateStep2()) setStep(3);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={() => setStep(2)}
                activeOpacity={0.8}
              >
                <Text style={styles.prevBtnText}>← Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.nextBtnText}>
                    {isEditMode ? 'Update' : 'Submit'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sheets */}
        <CategorySelectSheet
          visible={categorySheetVisible}
          selectedCategoryId={selectedCategory?.categoryId || null}
          categories={categories}
          onClose={() => setCategorySheetVisible(false)}
          onSelect={(cat) => setSelectedCategory(cat)}
          onCategoryAdded={onRefreshCategories}
        />

        <SubCategorySelectSheet
          visible={subCategorySheetVisible}
          selectedCategoryId={selectedCategory?.categoryId || null}
          selectedSubCategoryId={selectedSubCategory?.subcategoryId || null}
          subcategories={subcategories}
          onClose={() => setSubCategorySheetVisible(false)}
          onSelect={(sub) => setSelectedSubCategory(sub)}
          onSubCategoryAdded={() => {
            if (selectedCategory) onRefreshSubCategories(selectedCategory.categoryId);
          }}
        />

        <HSNSelectSheet
          visible={hsnSheetVisible}
          selectedHsnCode={selectedHsn?.hsn_code || ''}
          onClose={() => setHsnSheetVisible(false)}
          onSelect={(hsn) => setSelectedHsn(hsn)}
        />

        <UnitSelectSheet
          visible={primaryUnitSheetVisible}
          title="Select Primary Unit"
          selectedUnit={primaryUnit}
          units={measurementUnits}
          onClose={() => setPrimaryUnitSheetVisible(false)}
          onSelect={(unit) => setPrimaryUnit(unit)}
        />

        <UnitSelectSheet
          visible={secondaryUnitSheetVisible}
          title="Select Secondary Unit"
          selectedUnit={secondaryUnit}
          units={measurementUnits}
          onClose={() => setSecondaryUnitSheetVisible(false)}
          onSelect={(unit) => setSecondaryUnit(unit)}
        />

        {/* GST Rate Selector Modal */}
        <Modal
          visible={gstRateSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setGstRateSheetVisible(false)}
        >
          <View style={styles.typeModalBackdrop}>
            <TouchableOpacity
              style={styles.overlayTouch}
              activeOpacity={1}
              onPress={() => setGstRateSheetVisible(false)}
            />
            <View style={styles.typeSheetCard}>
              <Text style={styles.typeSheetTitle}>Select GST Rate</Text>
              {gstRates.map((rate) => {
                const isSelected = gstPercent === rate;
                return (
                  <TouchableOpacity
                    key={rate}
                    style={[styles.typeItem, isSelected && styles.typeItemSelected]}
                    onPress={() => {
                      setGstPercent(rate);
                      setGstRateSheetVisible(false);
                    }}
                  >
                    <Text style={[styles.typeItemText, isSelected && styles.typeItemTextSelected]}>
                      {rate}%
                    </Text>
                    {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

        {/* Product Type Sheet */}
        <Modal
          visible={typeSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setTypeSheetVisible(false)}
        >
          <View style={styles.typeModalBackdrop}>
            <TouchableOpacity
              style={styles.overlayTouch}
              activeOpacity={1}
              onPress={() => setTypeSheetVisible(false)}
            />
            <View style={styles.typeSheetCard}>
              <Text style={styles.typeSheetTitle}>Select Product Type</Text>
              {dynamicProductTypes.map((type) => {
                const isSelected = productType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeItem, isSelected && styles.typeItemSelected]}
                    onPress={() => {
                      setProductType(type);
                      setTypeSheetVisible(false);
                    }}
                  >
                    <Text style={[styles.typeItemText, isSelected && styles.typeItemTextSelected]}>
                      {type}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>
        {/* Maintain Inventory Sheet */}
        <Modal
          visible={inventorySheetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setInventorySheetVisible(false)}
        >
          <View style={styles.typeModalBackdrop}>
            <TouchableOpacity
              style={styles.overlayTouch}
              activeOpacity={1}
              onPress={() => setInventorySheetVisible(false)}
            />
            <View style={styles.typeSheetCard}>
              <Text style={styles.typeSheetTitle}>Maintain Inventory</Text>
              {(['Yes', 'No'] as const).map((opt) => {
                const isSelected = maintainInventory === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.typeItem, isSelected && styles.typeItemSelected]}
                    onPress={() => {
                      setMaintainInventory(opt);
                      setInventorySheetVisible(false);
                    }}
                  >
                    <Text style={[styles.typeItemText, isSelected && styles.typeItemTextSelected]}>
                      {opt}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

        {/* Item Type Sheet */}
        <Modal
          visible={itemTypeSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setItemTypeSheetVisible(false)}
        >
          <View style={styles.typeModalBackdrop}>
            <TouchableOpacity
              style={styles.overlayTouch}
              activeOpacity={1}
              onPress={() => setItemTypeSheetVisible(false)}
            />
            <View style={styles.typeSheetCard}>
              <Text style={styles.typeSheetTitle}>Select Item Type</Text>
              {(['Finished', 'Raw'] as const).map((t) => {
                const isSelected = itemType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeItem, isSelected && styles.typeItemSelected]}
                    onPress={() => {
                      setItemType(t);
                      setItemTypeSheetVisible(false);
                    }}
                  >
                    <Text style={[styles.typeItemText, isSelected && styles.typeItemTextSelected]}>
                      {t === 'Finished' ? 'Finished Product' : 'Raw Material'}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
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
  headerRightPlaceholder: {
    width: 38,
  },
  stepperContainer: {
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#0047AB',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  stepCircleInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  stepConnectorActive: {
    backgroundColor: '#0047AB',
  },
  stepConnectorInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepRupeeIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  stepTextInactive: {
    color: '#5A6B87',
  },
  stepTitleBox: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  stepSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  stepDesc: {
    fontSize: 13,
    color: '#5A6B87',
    marginTop: 3,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  stepSection: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  requiredStar: {
    color: '#DC2626',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownBtnText: {
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '500',
  },
  dropdownBtnPlaceholder: {
    color: '#8E9CAE',
  },
  dropdownInfo: {
    flex: 1,
    marginRight: 8,
  },
  hsnDescSnippet: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
  },
  inputWithCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputInner: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
  },
  counterText: {
    fontSize: 12,
    color: '#8E9CAE',
    marginLeft: 8,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#0047AB',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
    gap: 6,
  },
  currencyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 6,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0047AB',
  },
  currencyInput: {
    flex: 1,
    fontSize: 15,
    color: '#0E204E',
    fontWeight: '600',
    paddingVertical: 0,
  },
  autoCalcText: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
    paddingLeft: 2,
  },
  standardInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#0E204E',
    fontSize: 14,
  },
  disabledInput: {
    backgroundColor: '#F8FAFD',
    color: '#8E9CAE',
  },
  helperText: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
  },
  toggleRowClean: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleTitleClean: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0E204E',
  },
  configHeaderBox: {
    marginTop: 10,
    marginBottom: 6,
  },
  configSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  configListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 16,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  configLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0E204E',
  },
  configDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  cessExpandedCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  checkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkOptionText: {
    fontSize: 13,
    color: '#0E204E',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fullWidthNextBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  prevBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5A6B87',
  },
  nextBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  typeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 88, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  typeSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 6,
    elevation: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  typeSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  typeItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  typeItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5A6B87',
  },
  typeItemTextSelected: {
    color: '#0047AB',
    fontWeight: '700',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFill,
  },
});
