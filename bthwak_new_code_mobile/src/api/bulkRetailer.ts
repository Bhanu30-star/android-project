import { apiClient, parseApiError } from './client';

export interface BulkPartyItem {
  party_id: number;
  party_name: string;
  gstin_no?: string;
  party_phone?: string;
  beat_detail?: string | null;
  party_address?: string;
  sales_executives?: Array<{
    user_id: number;
    user_name: string;
  }>;
}

export interface FOSOption {
  userId: number;
  userName: string;
}

export interface BeatOption {
  beatId: number;
  beatName: string;
}

/**
 * Fetch bulk retailer parties with search, pagination, and optional FSE filter
 */
export async function fetchBulkRetailersApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sale_id?: string | number;
}): Promise<{ parties: BulkPartyItem[]; total: number }> {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const search = params?.search || '';
    const sale_id = params?.sale_id != null ? String(params.sale_id) : '';

    const res = await apiClient.post<any>('/master/get_bulk_fsc_details', {
      page,
      limit,
      search,
      sale_id,
    });

    if (res.data?.status === false) {
      return { parties: [], total: 0 };
    }

    const fosDetails = res.data?.data?.fos_details || [];
    const total = res.data?.data?.total || fosDetails.length;

    return {
      parties: Array.isArray(fosDetails) ? fosDetails : [],
      total,
    };
  } catch (err: any) {
    console.warn('fetchBulkRetailersApi error:', parseApiError(err));
    return { parties: [], total: 0 };
  }
}

/**
 * Fetch all FOS / sales executives
 */
export async function fetchFosUsersApi(): Promise<FOSOption[]> {
  try {
    const res = await apiClient.post<any>('/master/fetch_all_fos');
    return res.data?.data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch all beats
 */
export async function fetchBeatsApi(): Promise<BeatOption[]> {
  try {
    const res = await apiClient.post<any>('/master/fetch_beat', {
      page: 1,
      limit: 100,
      search: '',
    });
    return res.data?.data?.beat_list || [];
  } catch {
    return [];
  }
}

/**
 * Assign Sales Executive to selected parties
 */
export async function assignSalesExecutiveApi(payload: {
  user_id: number;
  party_id: number[];
}): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/master/assign_sales_executive', payload);
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Assign Beat to selected parties
 */
export async function assignBeatApi(payload: {
  beat_value: string;
  party_id: number[];
}): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/master/assign_beat', payload);
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Remove Sales Executive assignment from selected parties
 */
export async function removeSalesExecutiveApi(payload: {
  user_id: number;
  party_id: number[];
}): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/master/delete_sales_executive', payload);
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}
