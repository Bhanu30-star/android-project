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

/**
 * Add a new real party / customer to backend
 */
export async function addBuyerPartyApi(payload: AddPartyPayload): Promise<boolean> {
  const response = await apiClient.post<{
    status: number;
    message: string;
  }>('/master/add_buyer', {
    name: payload.name,
    phone: payload.phone || '',
    email: payload.email || '',
    gst_no: payload.gst_no || '',
    address: payload.address || 'Local',
    party_outstanding: payload.party_outstanding || 0,
    outstanding_type: payload.outstanding_type || 'To Collect',
    placesupply: payload.placesupply || '',
  });

  return response.status === 200 || response.status === 201;
}
