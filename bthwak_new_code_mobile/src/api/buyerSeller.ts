import { apiClient, parseApiError } from './client';

export interface BuyerSellerItem {
  party_id: number | string;
  party_name: string;
  party_phone: string;
  email?: string;
  gstin_no?: string;
  record_type?: 'Buyer' | 'Seller' | string;
  place_of_supply?: string;
  party_address?: string;
  shipping_address?: string;
  party_type?: 'Retailer' | 'Dealer' | string;
  outstanding_amount?: number;
  adjusted_outstanding_amt?: number;
  pending_amt?: number;
  status: 'Active' | 'Deactive' | string;
  fos_data?: Array<{
    userId: number;
    userName: string;
    is_checked?: boolean;
  }>;
}

export interface StateOption {
  state_id: number | string;
  state_name: string;
  state_code?: string;
}

export interface AddBuyerSellerPayload {
  record_type: 'Buyer' | 'Seller';
  name: string;
  phone_number: string;
  email?: string;
  gst_number?: string;
  state: string; // Place of supply
  address: string;
  shipping_address?: string;
  party_type?: 'Retailer' | 'Dealer';
  opening_balance?: number;
  opening_balance_type?: 'To Pay' | 'To Receive';
  fos_ids?: number[];
}

export interface EditBuyerSellerPayload extends AddBuyerSellerPayload {
  party_id: number | string;
}

/**
 * Fetch Buyers and Sellers List
 */
export async function fetchBuyerSellerListApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  record_type?: string;
}): Promise<{ data: BuyerSellerItem[]; total: number }> {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const search = params?.search || '';
    const record_type = params?.record_type && params.record_type !== 'All' ? params.record_type : '';

    const res = await apiClient.post<any>('/master/fetch_buyer_seller', {
      limit,
      page,
      search,
      record_type,
    });

    const rawData = res.data?.data?.data || [];
    const total = res.data?.data?.totalRecords || rawData.length;

    return {
      data: rawData,
      total,
    };
  } catch (err: any) {
    console.warn('fetchBuyerSellerListApi error:', parseApiError(err));
    return { data: [], total: 0 };
  }
}

/**
 * Fetch Indian States list
 */
export async function fetchStateListApi(): Promise<StateOption[]> {
  try {
    const res = await apiClient.get<any>('get_state_list?country_name=India');
    const list = res.data?.data || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [
      { state_id: '08', state_name: '08 - Rajasthan', state_code: '08' },
      { state_id: '07', state_name: '07 - Delhi', state_code: '07' },
      { state_id: '27', state_name: '27 - Maharashtra', state_code: '27' },
      { state_id: '24', state_name: '24 - Gujarat', state_code: '24' },
      { state_id: '09', state_name: '09 - Uttar Pradesh', state_code: '09' },
      { state_id: '29', state_name: '29 - Karnataka', state_code: '29' },
      { state_id: '33', state_name: '33 - Tamil Nadu', state_code: '33' },
      { state_id: '19', state_name: '19 - West Bengal', state_code: '19' },
    ];
  }
}

/**
 * Auto-fetch GST data
 */
export async function fetchGstDataApi(gstNumber: string): Promise<any> {
  try {
    const res = await apiClient.get<any>(`get_gst_data?gst_number=${encodeURIComponent(gstNumber)}`);
    return res.data?.data || null;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Fetch all sales executives (FOS) for assignment
 */
export async function fetchAllFosApi(): Promise<Array<{ userId: number; userName: string }>> {
  try {
    const res = await apiClient.post<any>('master/fetch_all_fos');
    return res.data?.data || [];
  } catch {
    return [];
  }
}

/**
 * Add Buyer or Seller
 */
export async function addBuyerSellerApi(payload: AddBuyerSellerPayload): Promise<{ message: string }> {
  try {
    if (payload.record_type === 'Buyer') {
      const res = await apiClient.post('master/add_buyer', {
        currancy: 'INR',
        name: payload.name.trim(),
        phone_number: payload.phone_number.trim(),
        email: payload.email?.trim() || '',
        gst_number: payload.gst_number?.trim() || '',
        state: payload.state || '',
        address: payload.address?.trim() || '',
        shipping_address: payload.shipping_address?.trim() || payload.address?.trim() || '',
        opening_balance: payload.opening_balance || 0,
        opening_balance_type: payload.opening_balance_type || 'To Receive',
      });
      return res.data;
    } else {
      const res = await apiClient.post('master/add_seller', {
        name: payload.name.trim(),
        phone_number: payload.phone_number.trim(),
        email: payload.email?.trim() || '',
        gst_number: payload.gst_number?.trim() || '',
        state: payload.state || '',
        address: payload.address?.trim() || '',
        shipping_address: payload.shipping_address?.trim() || payload.address?.trim() || '',
        party_type: payload.party_type || 'Retailer',
        opening_balance: payload.opening_balance || 0,
        opening_balance_type: payload.opening_balance_type || 'To Pay',
        fos_ids: payload.fos_ids || [],
      });
      return res.data;
    }
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Edit Buyer or Seller
 */
export async function editBuyerSellerApi(payload: EditBuyerSellerPayload): Promise<{ message: string }> {
  try {
    if (payload.record_type === 'Buyer') {
      const res = await apiClient.post('master/edit_buyer', {
        partid: Number(payload.party_id),
        name: payload.name.trim(),
        phone_number: payload.phone_number.trim(),
        email: payload.email?.trim() || '',
        gst_number: payload.gst_number?.trim() || '',
        state: payload.state || '',
        address: payload.address?.trim() || '',
        shipping_address: payload.shipping_address?.trim() || payload.address?.trim() || '',
        opening_balance: payload.opening_balance || 0,
        opening_balance_type: payload.opening_balance_type || 'To Receive',
      });
      return res.data;
    } else {
      const res = await apiClient.post('master/edit_seller', {
        partid: Number(payload.party_id),
        name: payload.name.trim(),
        phone_number: payload.phone_number.trim(),
        email: payload.email?.trim() || '',
        gst_number: payload.gst_number?.trim() || '',
        state: payload.state || '',
        address: payload.address?.trim() || '',
        shipping_address: payload.shipping_address?.trim() || payload.address?.trim() || '',
        party_type: payload.party_type || 'Retailer',
        opening_balance: payload.opening_balance || 0,
        opening_balance_type: payload.opening_balance_type || 'To Pay',
        fos_ids: payload.fos_ids || [],
      });
      return res.data;
    }
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Delete Party Status
 */
export async function deleteBuyerSellerApi(
  partyId: number | string,
  recordType: 'Buyer' | 'Seller'
): Promise<{ message: string }> {
  try {
    const endpoint = recordType === 'Buyer' ? 'master/delete_buyer_status' : 'master/delete_seller_status';
    const res = await apiClient.post(endpoint, {
      id: Number(partyId),
      status: 'Deleted',
    });
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Update Party Status (Active / Deactive)
 */
export async function toggleBuyerSellerStatusApi(
  partyId: number | string,
  recordType: 'Buyer' | 'Seller',
  status: 'Active' | 'Deactive'
): Promise<{ message: string }> {
  try {
    const endpoint = recordType === 'Buyer' ? 'master/update_buyer_status' : 'master/update_seller_status';
    const res = await apiClient.post(endpoint, {
      id: Number(partyId),
      status,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}
