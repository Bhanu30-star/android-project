import { apiClient, parseApiError } from './client';
import { PurchasePartyItem } from './purchase';

export interface DebitNoteCartItem {
  cart_id: number;
  product_id?: number;
  product_name: string;
  price: string | number;
  quantity: number;
  total_amount: string | number;
  discount: string | number;
  gst_percent: number | null;
  gst_amount: number | null;
  cess_amount: number | null;
  net_amount: number;
  imei_list?: (string | { imei_no: string; valid_check?: string })[];
}

export interface DebitNoteCartResponse {
  items: DebitNoteCartItem[];
  bill_no?: string;
  bill_date?: string;
  bill_type_notification?: string;
  total_notification?: string | number;
  finalamt_notification?: string | number;
  tax_type?: string;
  serialno_configuration?: string;
}

export interface DebitNoteProductItem {
  product_id: number;
  product_name: string;
  product_type: 'Service' | 'Serial No' | 'FMCG' | 'Commission';
  purchase_price: number;
  purchase_price_exc: number;
  invoice_bill_type?: 'Inclusive' | 'Exclusive';
  new_quantity: number;
  maintain_inventory?: 'Yes' | 'No';
  serial_type?: string;
  serialno_configuration?: string;
  primary_bag_val?: number;
  bag_list?: {
    totalUnit: number;
    primaryValue: 'Yes' | 'No';
  }[];
  serial_no_list?: { IMEI: string }[];
}

export interface DebitNoteProductResponse {
  items: DebitNoteProductItem[];
  hasMore: boolean;
  last_product_id: number;
}

export interface AddDebitNoteItemPayload {
  product_id: number;
  quantity: number;
  price: number;
  party_id: number;
  party_place_of_supply: string;
  discount_type: 'Amount' | 'Percentage';
  discount_val: number;
  bill_type: 'Inclusive' | 'Exclusive';
  product_type: string;
  bag_value: number;
  dis_ser_config: string;
  imei: string[];
}

export interface SubmitDebitNotePayload {
  api: 'direct' | 'return';
  data: Record<string, any>;
}

/**
 * Fetch Debit Note Cart Items & Metadata
 */
export async function fetchDebitNoteCartApi(): Promise<DebitNoteCartResponse> {
  try {
    const res = await apiClient.get('/purchase/getStockReturnCartDetailList');
    return res.data?.data?.data_set ?? { items: [] };
  } catch (err) {
    return { items: [] };
  }
}

/**
 * Clear Debit Note Cart (single item or all items)
 */
export async function clearDebitNoteCartApi(cartId?: number | null): Promise<{ message: string }> {
  try {
    const url = cartId ? `/purchase/clearStockReturnCart?cart_id=${cartId}` : '/purchase/clearStockReturnCart?cart_id=';
    const res = await apiClient.delete(url);
    return res.data;
  } catch (err) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Fetch Products for Debit Note Picker
 */
export async function fetchDebitNoteProductsApi(params: {
  party_id: number;
  financial_year: string;
  search?: string;
  last_product_id?: number;
  return_rows?: number;
}): Promise<DebitNoteProductResponse> {
  try {
    const res = await apiClient.post('/purchase/getPurchaseStockReturnCartItemList', {
      party_id: params.party_id,
      financial_year: params.financial_year,
      search: params.search || '',
      last_product_id: params.last_product_id || 0,
      return_rows: params.return_rows || 20,
    });
    return res.data?.data ?? { items: [], hasMore: false, last_product_id: 0 };
  } catch (err) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Add items to Debit Note cart
 */
export async function addDebitNoteItemsToCartApi(items: AddDebitNoteItemPayload[]): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/purchase/addPurchaseStockReturnInCart', { items });
    return res.data;
  } catch (err) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Submit Debit Note (Direct or Return Stock)
 */
export async function submitDebitNoteApi(payload: SubmitDebitNotePayload): Promise<{ message: string }> {
  try {
    const url =
      payload.api === 'direct'
        ? '/purchase/generateDirectDebitNote'
        : '/purchase/generateStockReturnDebitNote';
    const res = await apiClient.post(url, payload.data);
    return res.data;
  } catch (err) {
    throw new Error(parseApiError(err));
  }
}
