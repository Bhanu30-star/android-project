import { apiClient, parseApiError } from './client';

export interface SalesExecutiveUser {
  user_id: string | number;
  user_name: string;
  name?: string;
  user_phone: string;
  invoiceType: string;
  eRecharge?: string;
  imeiNo?: string;
  appVersion?: string;
  userPassword?: string;
  password?: string;
  status: 'Active' | 'Deactive';
}

export interface FetchSalesExecutivesResponse {
  users: SalesExecutiveUser[];
  total: number;
}

/**
 * Fetch list of sales executives with pagination and search
 */
export async function fetchSalesExecutivesApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<FetchSalesExecutivesResponse> {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const search = params?.search || '';
    const res = await apiClient.get(
      `/master/sales_executive?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
    );

    // Support both web response shapes
    const dataSet = res.data?.data;
    if (Array.isArray(dataSet) && dataSet[0]?.user_details) {
      return {
        users: dataSet[0].user_details || [],
        total: dataSet[0].total || (dataSet[0].user_details || []).length,
      };
    }
    if (Array.isArray(dataSet)) {
      return {
        users: dataSet,
        total: dataSet.length,
      };
    }
    if (dataSet?.user_details) {
      return {
        users: dataSet.user_details,
        total: dataSet.total || dataSet.user_details.length,
      };
    }
    return { users: [], total: 0 };
  } catch (err: any) {
    console.warn('fetchSalesExecutivesApi error:', parseApiError(err));
    return { users: [], total: 0 };
  }
}

/**
 * Toggle active / deactive status
 */
export async function updateExecutiveStatusApi(
  saleId: string | number,
  status: 'Active' | 'Deactive'
): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/master/update_status', {
      sale_id: saleId,
      status,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Clear user credentials (device binding / IMEI reset)
 */
export async function clearExecutiveCredentialsApi(
  saleId: string | number
): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/master/clear_credentials', {
      sale_id: saleId,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Fetch single user details for editing
 */
export async function fetchExecutiveDetailsApi(saleId: string | number): Promise<any> {
  try {
    const res = await apiClient.post('/master/fetch_user', {
      sale_id: saleId,
    });
    return res.data?.data?.[0] || res.data?.data || null;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Update executive profile
 */
export async function updateExecutiveProfileApi(payload: {
  sale_id: string | number;
  user_name: string;
  invoice_type: string;
  rechargetype?: string;
}): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/master/update_user', payload);
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Update executive password
 */
export async function updateExecutivePasswordApi(payload: {
  sale_id: string | number;
  old_password?: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/master/update_password', payload);
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

export interface ExecutiveStockItem {
  product_id: number;
  product_name: string;
  quantity: number;
  product_type?: 'Serial No' | string;
  imei_no?: Array<string | { imei_no: string }>;
}

export interface ReturnProductPayload {
  product_id: number;
  product_name: string;
  quantity: number;
}

export interface ReturnSerialProductPayload {
  product_id: number;
  product_name: string;
  quantity: number;
  imeis: string[];
}

export interface SubmitStockReturnPayload {
  sale_id: string | number;
  return_product: ReturnProductPayload[];
  return_serial_product: ReturnSerialProductPayload[];
}

/**
 * Fetch executive stock & IMEIs for return
 */
export async function fetchExecutiveStockReturnApi(params: {
  saleId: string | number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ stock: ExecutiveStockItem[]; total: number }> {
  try {
    const res = await apiClient.post<any>('/master/return_stock_serial_detail', {
      sale_id: params.saleId,
      page: params.page || 1,
      limit: params.limit || 100,
      search: params.search || '',
    });
    const data = res.data?.data;
    return {
      stock: data?.stock || [],
      total: data?.total || (data?.stock || []).length,
    };
  } catch (err: any) {
    console.warn('fetchExecutiveStockReturnApi error:', parseApiError(err));
    return { stock: [], total: 0 };
  }
}

/**
 * Submit executive stock return
 */
export async function submitExecutiveStockReturnApi(
  payload: SubmitStockReturnPayload
): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/master/return_stock', payload);
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

