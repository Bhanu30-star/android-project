import { apiClient, parseApiError } from './client';

// ============================================
// TYPES
// ============================================

export interface StockIssueDetail {
  type: string;
  available_serials?: string[];
  placeholder?: string;
}

export interface StockProductDetail {
  sno: number;
  transaction_detail_id: number;
  product_name: string;
  stock_quantity: number;
  requested_quantity: number;
  border_alert?: boolean;
  serial_type?: string;
  issue_detail?: StockIssueDetail;
  purchase_price?: number;
  product_price?: number;
  decimal_category?: string;
  discount?: number;
}

export interface PendingStockRow {
  transaction_id: number;
  transaction_date: string;
  transaction_time: string;
  user_transaction_id: string;
  party_id: number;
  total_amount: number;
  discount_percentage: number;
  user_id: number;
  status: string;
  request_type: string;
  confirm_datetime?: string;
  complete_date?: string;
  complete_time?: string;
  edit_datetime?: string;
  cancel_datetime?: string;
  transaction_status?: string;
  party_transaction_id?: number;
  type?: string;
  cancel_by?: string;
  action_source?: string;
  insert_source?: string;
  user_name: string;
  user_phone: string;
  user_work_type: string;
  user_status?: string;
  product_details: StockProductDetail[];
  total_products: number;
}

export interface TransferredStockRow {
  transaction_id: number;
  request_id?: number;
  transaction_date: string;
  transaction_time?: string;
  complete_date?: string;
  complete_time?: string;
  user_name: string;
  user_phone?: string;
  request_type?: string;
  status?: string;
  products?: Array<{
    product_id: number;
    product_name: string;
    product_type?: string;
    quantity: number;
    price?: number;
    imeis?: string[];
    serial_no?: string[];
  }>;
}

export interface CancelledStockRow {
  request_id: number;
  transaction_id?: number;
  transaction_date: string;
  cancel_datetime?: string;
  user_name: string;
  user_phone?: string;
  cancel_by?: string;
  reason?: string;
  products?: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    price?: number;
  }>;
}

export interface FosUserOption {
  userId: number;
  userName: string;
}

export interface ExecutiveProductItem {
  productId: number;
  productName: string;
  productType: string; // 'Service' | 'FMCG' | 'Serial No'
  newQuantity: number;
  productPrice: number;
  qty?: string;
  decimalCategory?: string;
  stock_imei?: string[];
}

// ============================================
// API CALLERS
// ============================================

export async function fetchPendingStockRequestsApi(params?: {
  page?: number;
  search?: string;
  limit?: number;
}): Promise<PendingStockRow[]> {
  try {
    const res = await apiClient.get('/stock_request/pending_stock', {
      params: {
        page: params?.page ?? 1,
        search: params?.search ?? '',
        limit: params?.limit ?? 50,
      },
    });
    const list = res.data?.data?.tbl_user_stock || [];
    return list;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

export async function approveStockRequestApi(payload: {
  request_id: number;
  request_type: string;
  imeis?: string[];
  transaction_detail_id?: number;
  quantity?: number;
  sale_price?: number;
  user_id?: number;
  negative_allow?: string;
  bill_discount?: number;
  bill_generation?: string;
  transaction_detail_ids?: number[];
}): Promise<{ status: boolean; message: string }> {
  try {
    const res = await apiClient.post('/stock_request/approve_stock_details', payload);
    return {
      status: res.data?.status ?? true,
      message: res.data?.message ?? 'Request approved successfully',
    };
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

export async function rejectStockRequestApi(transaction_id: number): Promise<{ status: boolean; message: string }> {
  try {
    const res = await apiClient.post('/stock_request/reject_user_stock_details', { transaction_id });
    return {
      status: res.data?.status ?? true,
      message: res.data?.message ?? 'Request rejected successfully',
    };
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

export async function fetchTransferredStockApi(params: {
  date: string;
  user_id?: number;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ rows: TransferredStockRow[]; total: number }> {
  try {
    const res = await apiClient.get('/stock_request/stock_request_with_products', {
      params: {
        date: params.date,
        user_id: params.user_id ?? 0,
        page: params.page ?? 1,
        limit: params.limit ?? 50,
        search: params.search ?? '',
      },
    });
    const result = res.data?.data?.result || [];
    const total = res.data?.data?.filtered_count || result.length;
    return { rows: result, total };
  } catch (err: any) {
    return { rows: [], total: 0 };
  }
}

export async function fetchCancelledStockApi(params: {
  date: string;
  user_id?: number;
}): Promise<{ rows: CancelledStockRow[]; total: number }> {
  try {
    const res = await apiClient.get('/stock_request/cancelled_stock', {
      params: {
        date: params.date,
        user_id: params.user_id ?? 0,
      },
    });
    const rows = res.data?.data?.data || [];
    const total = res.data?.data?.total || rows.length;
    return { rows, total };
  } catch (err: any) {
    return { rows: [], total: 0 };
  }
}

export async function fetchAllFosUsersApi(): Promise<FosUserOption[]> {
  try {
    const res = await apiClient.post('/master/fetch_all_fos');
    const raw = res.data?.data || [];
    return raw.map((item: any) => ({
      userId: item.user_id || item.userId || item.id,
      userName: item.user_name || item.userName || item.name || 'Executive',
    }));
  } catch {
    return [];
  }
}

export async function fetchExecutiveProductsApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ExecutiveProductItem[]> {
  try {
    const res = await apiClient.get('/stock_request/get_all_executive_product', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        search: params?.search ?? '',
      },
    });
    const rawList = Array.isArray(res.data?.data?.data)
      ? res.data.data.data
      : Array.isArray(res.data?.data?.result)
      ? res.data.data.result
      : Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data?.result)
      ? res.data.result
      : [];

    return rawList.map((p: any) => {
      const imeis: string[] = [];
      if (Array.isArray(p.stock_imei)) {
        p.stock_imei.forEach((x: any) => {
          if (typeof x === 'string') {
            if (x.trim()) imeis.push(x.trim());
          } else if (x && (x.imei || x.IMEI || x.serial_no)) {
            const im = String(x.imei || x.IMEI || x.serial_no).trim();
            if (im) imeis.push(im);
          }
        });
      }

      const availableQty = Number(
        p.new_quantity ?? p.newQuantity ?? p.stock_quantity ?? p.stockQuantity ?? imeis.length ?? 0
      );

      return {
        productId: Number(p.product_id || p.productId),
        productName: p.product_name || p.productName || 'Unnamed Product',
        productType: p.product_type || p.productType || 'Service',
        newQuantity: availableQty,
        productPrice: Number(p.product_price || p.productPrice || 0),
        qty: p.qty || 'units',
        decimalCategory: p.decimal_category || p.decimalCategory,
        stock_imei: imeis,
      };
    });
  } catch {
    return [];
  }
}

export async function fetchSerialProductImeisApi(productId: number): Promise<{ imeis: string[]; price?: number }> {
  try {
    const res = await apiClient.post('/stock_request/get_serial_product', {
      product_id: productId,
    });
    const rawList = res.data?.data?.stock_imei || [];
    const imeis: string[] = [];
    if (Array.isArray(rawList)) {
      rawList.forEach((x: any) => {
        if (typeof x === 'string') {
          if (x.trim()) imeis.push(x.trim());
        } else if (x && (x.imei || x.IMEI || x.serial_no)) {
          const im = String(x.imei || x.IMEI || x.serial_no).trim();
          if (im) imeis.push(im);
        }
      });
    }
    return {
      imeis,
      price: res.data?.data?.product_price ? Number(res.data.data.product_price) : undefined,
    };
  } catch {
    return { imeis: [] };
  }
}

export async function saveExecutiveStockTransferApi(payload: {
  sale_id: number;
  total_amount: number;
  product_cart_details: {
    product_id: number;
    product_type: string;
    price: number;
    quantity: number;
    imei_ids: (string | number)[];
  }[];
}): Promise<{ status: boolean; message: string }> {
  try {
    const res = await apiClient.post('/stock_request/save_all_cart_details', payload);
    return {
      status: res.data?.status ?? true,
      message: res.data?.message ?? 'Stock transferred successfully',
    };
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}
