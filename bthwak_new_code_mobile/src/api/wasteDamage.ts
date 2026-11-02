import { apiClient, parseApiError } from './client';

export interface ConversionUnitItem {
  bag_type: string;
  total_unit: string | number;
}

export interface WasteDamageProductItem {
  product_id: number;
  product_name: string;
  product_type: 'FMCG' | 'Serial No' | string;
  stock_quantity: number;
  price: number;
  bag_type?: string;
  total_unit?: string | number;
  total_amt?: number;
  conversion_units?: ConversionUnitItem[];
  imei_no?: string[];
}

export interface WasteDamageCartItem {
  id: string; // unique id per cart entry
  product_id: number;
  product_name: string;
  product_type: 'FMCG' | 'Serial No' | string;
  price: number;
  quantity: number;
  bag_type?: string | null;
  bag_unit?: number;
  bag_count?: number;
  selected_imeis?: string[];
  available_stock: number;
  total_amount: number;
}

export interface WasteDamageSubmitPayload {
  remark?: string;
  fmcg_product: {
    product_name: string;
    product_price: number;
    product_id: number;
    product_bag_type: number;
    product_bag_qty: number;
    product_qty: number;
    product_type: string;
  }[];
  serial_no: {
    product_name: string;
    product_price: number;
    product_id: number;
    product_qty: number;
    product_type: string;
    imei_ids: string[];
  }[];
}

export interface WasteDamageListResponse {
  total_record: number;
  filtered_record: number;
  wastage_stock: WasteDamageProductItem[];
}

export async function fetchWasteDamageProductsApi(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<WasteDamageListResponse> {
  try {
    const res = await apiClient.get('/product/get_add_cart_damage', {
      params: {
        limit: params?.limit || 50,
        page: params?.page || 1,
        search: params?.search || '',
      },
    });

    const data = res.data?.data;
    if (!data) {
      return { total_record: 0, filtered_record: 0, wastage_stock: [] };
    }

    const items: WasteDamageProductItem[] = (data.wastage_stock || []).map((row: any) => ({
      product_id: Number(row.product_id),
      product_name: String(row.product_name || ''),
      product_type: String(row.product_type || 'FMCG'),
      stock_quantity: Number(row.stock_quantity || 0),
      price: Number(row.price || row.product_price || 0),
      bag_type: row.bag_type,
      total_unit: row.total_unit,
      total_amt: Number(row.total_amt || 0),
      conversion_units: Array.isArray(row.conversion_units)
        ? row.conversion_units
        : typeof row.conversion_units === 'string'
        ? JSON.parse(row.conversion_units || '[]')
        : [],
      imei_no: Array.isArray(row.imei_no)
        ? row.imei_no
        : typeof row.imei_no === 'string'
        ? JSON.parse(row.imei_no || '[]')
        : [],
    }));

    return {
      total_record: Number(data.total_record || items.length),
      filtered_record: Number(data.filtered_record || items.length),
      wastage_stock: items,
    };
  } catch (error) {
    throw new Error(parseApiError(error));
  }
}

export async function saveWasteDamageApi(
  payload: WasteDamageSubmitPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiClient.post('/product/save_add_cart_damage', payload);
    return {
      success: true,
      message: res.data?.message || 'Waste/Damage stock submitted successfully',
    };
  } catch (error) {
    throw new Error(parseApiError(error));
  }
}
