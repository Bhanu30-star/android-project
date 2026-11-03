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
  state_code?: string;
  address: string;
  shipping_address?: string;
  party_type?: 'Retailer' | 'Dealer';
  opening_balance?: number;
  opening_balance_type?: 'To Pay' | 'To Receive';
  fos_ids?: number[];
  pincode?: string;
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
 * Extract 2-digit Indian State code
 */
export function extractStateCode(stateStr?: string, gstStr?: string): string {
  if (gstStr && gstStr.trim().length >= 2) {
    const code = gstStr.trim().slice(0, 2);
    if (/^\d{2}$/.test(code)) return code;
  }
  if (stateStr) {
    const match = stateStr.match(/^(\d{2})/);
    if (match) return match[1];
  }
  return '08'; // Default Rajasthan '08'
}

/**
 * Add Buyer or Seller
 */
export async function addBuyerSellerApi(payload: AddBuyerSellerPayload): Promise<{ message: string }> {
  try {
    const stateCode = extractStateCode(payload.state, payload.gst_number);
    const rawGst = (payload.gst_number || '').trim().toUpperCase();
    const isGstValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][A-Z][0-9A-Z]$/.test(rawGst);
    const validGst = isGstValid ? rawGst : '';

    const panCandidate = isGstValid ? rawGst.slice(2, 12) : '';
    const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panCandidate);
    const validPan = isPanValid ? panCandidate : '';

    const rawPhone = (payload.phone_number || '').trim();
    const isPhoneValid = /^[6-9]\d{9}$/.test(rawPhone);
    const validPhone = isPhoneValid ? rawPhone : (rawPhone ? rawPhone : '');

    const rawEmail = (payload.email || '').trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
    const validEmail = isEmailValid ? rawEmail : '';

    const openingBalance = Number(payload.opening_balance || 0);

    if (payload.record_type === 'Buyer') {
      const buyerBody = {
        name: payload.name.trim(),
        currancy: 'INR',
        phone: isPhoneValid ? rawPhone : '',
        email: validEmail,
        gst_no: validGst,
        placesupply: payload.state || '08 - Rajasthan',
        address: payload.address?.trim() || '',
        party_outstanding: openingBalance,
        outstanding_type: payload.opening_balance_type || 'To Receive',
        tradename: '',
        pincode: payload.pincode?.trim() || '',
        legalname: '',
        location: '',
        api_error: '',
        state_code: stateCode,
        dln_no: '',
        bankstatement_name: '',
      };
      const res = await apiClient.post('master/add_buyer', buyerBody);
      return res.data;
    } else {
      // Seller expects AddSellerPartyDto with pname (NOT name), partytype, pphone, etc.
      const ptyuser = Array.isArray(payload.fos_ids) ? payload.fos_ids.map(Number) : [];
      const sellerBody = {
        pname: payload.name.trim(),
        partytype: payload.party_type === 'Dealer' ? 'Dealer' : 'Retailer',
        paddress: payload.address?.trim() || '',
        shipaddress: payload.shipping_address?.trim() || payload.address?.trim() || '',
        placecountry: 'India',
        placesupply: payload.state || '08 - Rajasthan',
        pnamehindi: '',
        pgstin: validGst,
        gst_effect_date: '',
        ppanno: validPan,
        p_dob: '',
        pphone: validPhone,
        beatvalue: '',
        beatdetails: '',
        beat_detail: '',
        paddresshindi: '',
        shipaddresshindi: '',
        state_effect_date: '',
        latitude: 0,
        partylatitude: 0,
        longitude: 0,
        partylongitude: 0,
        einvoice_applicable: 'No',
        owner_name: '',
        party_outstanding: openingBalance,
        ptyuser: ptyuser,
        tradename: '',
        pincode: payload.pincode?.trim() || '',
        legalname: '',
        location: '',
        state_code: stateCode,
        api_error: '',
        tcs_applicable: 'No',
        dln_no: '',
      };
      const res = await apiClient.post('master/add_seller', sellerBody);
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
    const stateCode = extractStateCode(payload.state, payload.gst_number);
    const rawGst = (payload.gst_number || '').trim().toUpperCase();
    const isGstValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][A-Z][0-9A-Z]$/.test(rawGst);
    const validGst = isGstValid ? rawGst : '';

    const panCandidate = isGstValid ? rawGst.slice(2, 12) : '';
    const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panCandidate);
    const validPan = isPanValid ? panCandidate : '';

    const rawPhone = (payload.phone_number || '').trim();
    const isPhoneValid = /^[6-9]\d{9}$/.test(rawPhone);
    const validPhone = isPhoneValid ? rawPhone : (rawPhone ? rawPhone : '');

    const rawEmail = (payload.email || '').trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail);
    const validEmail = isEmailValid ? rawEmail : '';

    const openingBalance = Number(payload.opening_balance || 0);

    if (payload.record_type === 'Buyer') {
      const editBuyerBody = {
        partid: Number(payload.party_id),
        name: payload.name.trim(),
        placesupply: payload.state || '08 - Rajasthan',
        party_outstanding: openingBalance,
        phone: isPhoneValid ? rawPhone : '9876543210',
        email: validEmail,
        gst_no: validGst,
        address: payload.address?.trim() || '',
        state_code: stateCode,
        legalname: '',
        tradename: '',
        pincode: payload.pincode?.trim() || '',
        location: '',
        dln_no: '',
        bank_statement_name: '',
      };
      const res = await apiClient.post('master/edit_buyer', editBuyerBody);
      return res.data;
    } else {
      const ptyuser = Array.isArray(payload.fos_ids) ? payload.fos_ids.map(Number) : [];
      const editSellerBody = {
        pid: Number(payload.party_id),
        placecurrency: 'INR',
        pname: payload.name.trim(),
        pnamehindi: '',
        pgstin: validGst,
        gst_effect_date: '',
        ppanno: validPan,
        dob: '',
        pphone: validPhone,
        paddress: payload.address?.trim() || '',
        paddresshindi: '',
        shipaddress: payload.shipping_address?.trim() || payload.address?.trim() || '',
        shipaddresshindi: '',
        placecountry: 'India',
        psupply: payload.state || '08 - Rajasthan',
        state_code: stateCode,
        partytype: payload.party_type === 'Dealer' ? 'Dealer' : 'Retailer',
        beatvalue: '',
        beatdetails: '',
        beat_detail: '',
        state_effect_date: '',
        latitude: 0,
        longitude: 0,
        partylatitude: 0,
        partylongitude: 0,
        einvoice_applicable: 'No',
        owner_name: '',
        party_outstanding: openingBalance,
        ptyuser: ptyuser,
        tradename: '',
        pincode: payload.pincode?.trim() || '',
        legalname: '',
        location: '',
        dln_no: '',
        api_error: '',
      };
      const res = await apiClient.post('master/edit_seller', editSellerBody);
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
