import { apiClient, parseApiError } from './client';

export interface PayoutParty {
  purchasePartyId: number;
  partyName: string;
  placeOfSupply: string;
}

export interface PayoutProduct {
  productId: number;
  productName: string;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
}

export interface TurboInvoiceRow {
  invoice_id: number | string;
  txn_ref_no: string;
  retailer_name: string;
  productName?: string;
  invoice_date: string;
  period?: string;
  grand_total: number;
  taxable_amount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  accept_allowed?: boolean;
  accept_reason?: string;
  reason?: string;
  status?: string;
  [key: string]: any;
}

export interface AddPayoutParty {
  purchase_party_id: number;
  party_name: string;
  place_of_supply: string;
  status?: string;
}

export interface AddPayoutProduct {
  product_id: number;
  product_name: string;
  product_category: string;
  stock_quantity: number;
  status?: string;
  purchase_price: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export async function getPayoutRetailerListApi(): Promise<PayoutParty[]> {
  try {
    const res = await apiClient.get('/sale/getPayoutRetailerNameList');
    const list = res.data?.data?.data ?? res.data?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function getTurboInvoiceListApi(payload: {
  type: 'pending' | 'accepted';
  month: string;
  year: string;
  party: string;
}): Promise<TurboInvoiceRow[]> {
  try {
    const res = await apiClient.post('/sale/getTurboInvoiceList', payload);
    const list = res.data?.data?.data ?? res.data?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    const msg = (err as any)?.response?.data?.message || '';
    if (msg.toLowerCase().includes('no data')) return [];
    throw parseApiError(err);
  }
}

export async function getPayoutProductsApi(): Promise<PayoutProduct[]> {
  try {
    const res = await apiClient.get('/sale/getPayoutProducts');
    const list = res.data?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function addPayoutApi(payload: any): Promise<string> {
  try {
    const res = await apiClient.post('/sale/addPayout', payload);
    return res.data?.message || 'Payout saved successfully';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function updateTurboInvoiceApi(payload: any): Promise<string> {
  try {
    const res = await apiClient.post('/sale/updateTurboInvoice', payload);
    return res.data?.message || 'Payout updated successfully';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function deleteTurboInvoiceApi(invoice_id: number | string): Promise<string> {
  try {
    const res = await apiClient.patch(`/sale/deleteTurboInvoice?invoice_id=${invoice_id}`);
    return res.data?.message || 'Invoice deleted';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function acceptTurboInvoiceApi(txn_ref_no: string): Promise<string> {
  try {
    const res = await apiClient.post('/sale/acceptTurboInvoice', { txn_ref_no });
    const acceptReason =
      res.data?.accept_reason ??
      res.data?.reason ??
      res.data?.data?.accept_reason ??
      res.data?.data?.reason;
    return [res.data?.message, acceptReason].filter(Boolean).join(': ') || 'Invoice accepted successfully';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function deleteAcceptedInvoiceApi(invoice_id: number | string): Promise<string> {
  try {
    const res = await apiClient.delete('/sale/deleteAcceptedInvoice', {
      params: { invoice_id },
    });
    return res.data?.message || 'Accepted invoice deleted';
  } catch (err) {
    throw parseApiError(err);
  }
}

// Product -> Add Payout (Commission Product Payout Invoice)
export async function getAddPayoutDetailApi(): Promise<{
  party_details: AddPayoutParty[];
  product_details: AddPayoutProduct[];
  product_categories: string[];
}> {
  try {
    const res = await apiClient.get('/common_api/get_payout_detail', {
      params: { page: 1, limit: 50, search: '' },
    });
    const d = res.data?.data ?? {};
    return {
      party_details: Array.isArray(d.party_details) ? d.party_details : [],
      product_details: Array.isArray(d.product_details) ? d.product_details : [],
      product_categories: Array.isArray(d.product_categories) ? d.product_categories : [],
    };
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function saveAddPayoutDetailsApi(payload: {
  party_id: number;
  invoice_date: string;
  gst_flag: 'Yes' | 'No';
  remark: string;
  bill_no: string;
  payout_type: string;
  product_details: { product_id: number; quantity: number; total_amount: number }[];
}): Promise<string> {
  try {
    const res = await apiClient.post('/product/save_payout_details', payload);
    return res.data?.message || 'Payout invoice submitted successfully';
  } catch (err) {
    throw parseApiError(err);
  }
}
