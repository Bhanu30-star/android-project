import { apiClient } from './client';

export interface PartyItem {
  party_id: number | string;
  party_name: string;
  party_phone: string;
  email?: string;
  gstin_no?: string;
  place_of_supply?: string;
  party_address?: string;
  party_type?: string;
  outstanding_amount?: number;
  pending_amt?: number;
  status?: string;
}

export interface FetchPartiesResponse {
  data: PartyItem[];
  total: number;
  record_filtered: number;
}

export interface AddPartyPayload {
  name: string;
  phone: string;
  email?: string;
  gst_no?: string;
  address?: string;
  party_outstanding?: number;
  outstanding_type?: 'To Pay' | 'To Collect' | '';
  placesupply?: string;
}

/**
 * Fetch real buyers and sellers from backend
 */
export async function fetchPartiesApi(
  search = '',
  page = 1,
  limit = 30,
  recordType = ''
): Promise<PartyItem[]> {
  try {
    const response = await apiClient.post<{
      status: number;
      message: string;
      data: {
        data: PartyItem[];
        total: number;
        record_filtered: number;
      };
    }>('/master/fetch_buyer_seller', {
      limit,
      page,
      search,
      record_type: recordType,
    });

    return response.data?.data?.data || [];
  } catch {
    // If backend returns empty/error, return empty array
    return [];
  }
}

import { extractStateCode } from './buyerSeller';

/**
 * Add a new real party / customer to backend
 */
export async function addBuyerPartyApi(payload: AddPartyPayload): Promise<boolean> {
  const stateCode = extractStateCode(payload.placesupply, payload.gst_no);
  const gstNo = (payload.gst_no || '').trim().toUpperCase();
  const validGst = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][A-Z][0-9A-Z]$/.test(gstNo) ? gstNo : '';
  const phone = (payload.phone || '').trim();
  const validPhone = /^[6-9]\d{9}$/.test(phone) ? phone : '';
  const email = (payload.email || '').trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';

  const response = await apiClient.post<{
    status: number;
    message: string;
  }>('/master/add_buyer', {
    name: payload.name.trim(),
    currancy: 'INR',
    phone: validPhone,
    email: validEmail,
    gst_no: validGst,
    placesupply: payload.placesupply || '08 - Rajasthan',
    address: payload.address || 'Local',
    party_outstanding: Number(payload.party_outstanding || 0),
    outstanding_type: payload.outstanding_type || 'To Receive',
    tradename: '',
    pincode: '',
    legalname: '',
    location: '',
    api_error: '',
    state_code: stateCode,
    dln_no: '',
    bankstatement_name: '',
  });

  return response.status === 200 || response.status === 201;
}
