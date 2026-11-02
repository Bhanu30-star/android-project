import { apiClient, parseApiError } from './client';

export interface ProductItem {
  product_id: number;
  product_name: string;
  product_price: number;
  purchase_price: number;
  product_price_exc?: number;
  purchase_price_exc?: number;
  hsn_code?: string;
  stock_quantity: number;
  unit?: string;
  secondary_unit?: string;
  category_name?: string;
  subcategory_name?: string;
  category_id?: number;
  subcategory_id?: number;
  product_type?: string;
  status: 'Active' | 'Deactive' | string;
  maintain_inventory?: 'Yes' | 'No' | string;
  item_type?: 'Finished' | 'Raw' | string;
  serial_type?: string;
  gst_applicable?: 'Yes' | 'No' | string;
  IGST?: number;
  CGST?: number;
  SGST?: number;
  discount_applicable?: 'Yes' | 'No' | string;
  discount_percentage?: number;
  discount_amount?: number;
  dealer_price?: number | string;
  mrp_price?: number | string;
  alias?: string;
  warranty?: string;
  low_stock_quantity?: number | string;
  decimal_category?: 'Yes' | 'No' | string;
  cess_applicable?: 'Yes' | 'No' | string;
  cess_on_sale?: 'Yes' | 'No' | string;
  cess_on_purchase?: 'Yes' | 'No' | string;
  cess_percentage?: number | string;
  barcode_generator?: 'Yes' | 'No' | string;
  product_barcode?: string;
  is_ecom?: 'Yes' | 'No' | string;
  inserted_at?: string;
  status_flag?: number;
}

export interface CategoryItem {
  categoryId: number;
  categoryName: string;
  status?: string;
}

export interface SubCategoryItem {
  subcategoryId: number;
  subcategoryName: string;
  categoryId?: number;
  categoryName?: string;
  status?: string;
}

export interface HSNItem {
  hsn_id: number;
  hsn_code: string;
  description: string;
}

export interface MeasurementUnitItem {
  unitName: string;
}

export interface ConversionRateItem {
  id: number;
  product_id: number;
  unit_1: string;
  unit_2: string;
  new_stock: number;
  stock_sale_price: number;
  stock_purchase_price?: number;
  primary_value?: string;
}

export interface ProductListResponse {
  data: ProductItem[];
  total: number;
  category: string[];
}

export interface FetchProductsParams {
  category_id?: string | number;
  subcategory_id?: string | number;
  product_type_val?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface AddEditProductPayload {
  product_id?: number;
  category_id: number;
  subcategory_id: number;
  product_name: string;
  product_type: string;
  pro_serial_category?: string;
  maintain_inventory: 'Yes' | 'No';
  item_type: 'Finished' | 'Raw';
  consume_raw_product?: 'Yes' | 'No';
  barcode_generate?: 'Yes' | 'No';
  barcode?: string;
  gst_applicable: 'Yes' | 'No';
  gst_percentage?: string;
  sale_price_inclusive: number;
  sale_price_exclusive: number;
  purchase_price_inclusive: number;
  purchase_price_exclusive: number;
  dealer_price?: string;
  mrp_price?: string;
  alias?: string;
  hsn_code: string;
  primary_measure_unit: string;
  secondary_measure_unit: string;
  decimal_quantity?: 'Yes' | 'No';
  discount_applicable: 'Yes' | 'No';
  discount?: number | string;
  warranty?: string;
  low_stock_quantity?: string;
  stock_in_hand?: string;
  stock_effect_date?: string;
  cess_applicable?: 'Yes' | 'No';
  on_sale?: 'Yes' | 'No';
  on_purchase?: 'Yes' | 'No';
  cess_discount?: string;
  source?: string;
  is_ecom?: 'Yes' | 'No';
  product_color?: string;
  product_size?: string;
  product_gender?: string;
  manufacturing_date?: string;
  client_confirm_clear?: 'Yes' | 'No';
}

// 1. Fetch products list
export async function fetchProductListApi(params: FetchProductsParams): Promise<ProductListResponse> {
  try {
    const res = await apiClient.post('/product/getProductList', {
      category_id: params.category_id != null ? String(params.category_id) : '',
      subcategory_id: params.subcategory_id != null ? String(params.subcategory_id) : '',
      product_type_val: params.product_type_val || 'All',
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search || '',
    });

    const data = res.data?.data;
    return {
      data: data?.data ?? [],
      total: data?.total ?? 0,
      category: data?.category ?? [],
    };
  } catch (error) {
    console.error('fetchProductListApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 2. Fetch categories
export async function fetchProductCategoriesApi(): Promise<CategoryItem[]> {
  try {
    const res = await apiClient.get('/product/getProductCategoryList');
    return res.data?.data?.data ?? [];
  } catch (error) {
    console.error('fetchProductCategoriesApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 3. Fetch subcategories for a given category
export async function fetchProductSubCategoriesApi(categoryId: number | string): Promise<SubCategoryItem[]> {
  try {
    if (!categoryId) return [];
    const res = await apiClient.get(`/product/getProductSubCategoryList?category_id=${categoryId}`);
    return res.data?.data?.data ?? [];
  } catch (error) {
    console.error('fetchProductSubCategoriesApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 4. Add product category
export async function addProductCategoryApi(categoryName: string): Promise<{ message: string; category_id?: number }> {
  try {
    const res = await apiClient.post('/product/addProductCategory', {
      category_name: categoryName.trim(),
    });
    return { message: res.data?.message || 'Category added successfully' };
  } catch (error) {
    console.error('addProductCategoryApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 5. Add product subcategory
export async function addProductSubCategoryApi(
  categoryId: number,
  subCategoryName: string
): Promise<{ message: string; subcategory_id?: number }> {
  try {
    const res = await apiClient.post('/product/addProductSubCategory', {
      category_id: categoryId,
      subcategory_name: subCategoryName.trim(),
    });
    return { message: res.data?.message || 'Sub Category added successfully' };
  } catch (error) {
    console.error('addProductSubCategoryApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 6. Update product status (Active, Deactive, Deleted)
export async function updateProductStatusApi(
  productId: number,
  status: 'Active' | 'Deactive' | 'Deleted'
): Promise<string> {
  try {
    const res = await apiClient.post('/product/updateProductStatus', {
      product_id: productId,
      status,
    });
    return res.data?.message || 'Product status updated';
  } catch (error) {
    console.error('updateProductStatusApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 7. Fetch HSN codes with search & infinite pagination
export async function fetchHSNCodeListApi(
  searchKeyword: string = '',
  lastId: number = 0
): Promise<HSNItem[]> {
  try {
    const res = await apiClient.get(
      `/product/getHSNCodeList?search_keyword=${encodeURIComponent(searchKeyword)}&last_id=${lastId}`
    );
    return res.data?.data?.data ?? [];
  } catch (error) {
    console.error('fetchHSNCodeListApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 8. Fetch measurement units
export async function fetchMeasurementUnitsApi(): Promise<MeasurementUnitItem[]> {
  try {
    const res = await apiClient.get('/product/getMeasurementUnitList');
    return res.data?.data?.data ?? [];
  } catch (error) {
    console.error('fetchMeasurementUnitsApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 9. Add or Edit product
export async function addEditProductApi(payload: AddEditProductPayload): Promise<{ message: string; product_id?: number }> {
  try {
    const body = {
      ...payload,
      product_id: payload.product_id || 0,
      source: 'Mobile',
      client_confirm_clear: payload.client_confirm_clear || 'No',
    };
    const res = await apiClient.post('/product/addEditProduct', body);
    return {
      message: res.data?.message || `Product ${payload.product_id ? 'updated' : 'added'} successfully`,
      product_id: res.data?.data?.product_id,
    };
  } catch (error) {
    console.error('addEditProductApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 10. Fetch conversion rates for a product
export async function fetchConversionRatesApi(productId: number): Promise<any> {
  try {
    const res = await apiClient.get(`/product/getConversionRates?product_id=${productId}`);
    return res.data?.data || null;
  } catch (error) {
    console.error('fetchConversionRatesApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 11. Add conversion rate
export async function addConversionRateApi(payload: {
  product_id: number;
  unit_1: string;
  unit_2: string;
  new_stock: number;
  stock_sale_price: number;
  stock_purchase_price?: number;
}): Promise<string> {
  try {
    const res = await apiClient.post('/product/addConversionRate', payload);
    return res.data?.message || 'Conversion added successfully';
  } catch (error) {
    console.error('addConversionRateApi error:', error);
    throw new Error(parseApiError(error));
  }
}

// 12. Remove conversion rate
export async function removeConversionRateApi(conversionId: number): Promise<string> {
  try {
    const res = await apiClient.patch(`/product/removeConversionRate?conversion_id=${conversionId}`);
    return res.data?.message || 'Conversion removed successfully';
  } catch (error) {
    console.error('removeConversionRateApi error:', error);
    throw new Error(parseApiError(error));
  }
}
