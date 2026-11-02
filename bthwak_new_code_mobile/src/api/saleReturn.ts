import { apiClient, parseApiError } from './client';

export interface SaleReturnCartItem {
  cart_detail_id: number;
  product_name: string;
  price: string | number;
  quantity?: number;
  bag_qty?: number;
  actual_qty?: number;
  gst_percent?: number | null;
  gst_amount?: number | null;
  cess_percent?: number | null;
  cess_amount?: number | null;
  net_amount?: number;
  total_amount?: number;
  discount?: string | number;
  imeiList?: any;
}

export interface SaleReturnCartTotals {
  item_amount?: number;
  net_amount?: number;
  gst_amount?: number;
  cess_amount?: number;
}

export interface SaleReturnCartData {
  credit_note_no?: string;
  bill_type?: 'Inclusive' | 'Exclusive' | string;
  bill_type_notification?: string;
  reverse_charge?: 'Yes' | 'No' | string;
  gst_type?: string;
  items: SaleReturnCartItem[];
  totals?: SaleReturnCartTotals;
  final_amount?: number;
}

export interface SaleReturnCatalogProduct {
  product_id: number;
  product_name: string;
  product_type: 'Service' | 'Commission' | 'FMCG' | 'Serial No';
  new_quantity: number;
  product_price_inc: number;
  product_price_exc: number;
  serial_type?: string;
  serialno_configuration?: string;
  primary_bag_val?: number;
  maintain_inventory?: 'Yes' | 'No';
  dist_negative_allow?: 'Yes' | 'No';
  invoice_bill_type?: 'Inclusive' | 'Exclusive' | '';
  mrp_price?: number;
  bag_list?: Array<{
    detailId?: number;
    detail_id?: number;
    totalUnit?: number;
    total_unit?: number;
    primaryValue?: 'Yes' | 'No';
    salePrice?: number;
    sale_price?: number;
    conversionUnit?: string;
    conversion_unit?: string;
  }>;
  imei_list?: Array<{
    IMEI_NO: string;
  }>;
}

export interface SaleReturnCartItemPayload {
  product_id: number;
  product_type: string;
  party_id: number;
  price: string;
  quantity: number;
  bag_val: number;
  bill_type: string;
  discount_type: 'Amount' | 'Percentage';
  discount_val: number;
  free_scheme?: string;
  free_scheme_product?: number;
  imei?: string[];
}

export interface SubmitReturnStockCreditNotePayload {
  partyId: number;
  billNo: string;
  hiddenbillNo: string;
  billDate: string; // YYYY-MM-DD
  orgBillNo: string;
  orgBillDate: string; // YYYY-MM-DD
  billType: string;
  netAmount: number;
  tcsAmount: number;
  remark?: string;
}

export interface SubmitDirectCreditNotePayload {
  partyId: number;
  billNo: string;
  hiddenbillNo: string;
  billDate: string; // YYYY-MM-DD
  orgBillNo: string;
  orgBillDate: string; // YYYY-MM-DD
  billType: string;
  totalAmount: number;
  netAmount: number;
  tcsAmount: number;
  remark?: string;
}

/**
 * Fetch Current Sale Return Cart
 */
export async function fetchSaleReturnCartApi(params: {
  reverse_charge: 'Yes' | 'No';
  party_id?: number;
}): Promise<SaleReturnCartData> {
  try {
    const res = await apiClient.get('/sale/getSaleReturnCartDetails', {
      params: {
        reverse_charge: params.reverse_charge,
        party_id: params.party_id,
      },
    });
    return res.data?.data || { items: [] };
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Fetch Products for Sale Return (Catalog)
 */
export async function fetchSaleReturnItemsApi(payload: {
  party_id: number;
  financial_year: string;
  search?: string;
  last_product_id: number;
  return_rows?: number;
}): Promise<{ items: SaleReturnCatalogProduct[]; hasMore?: boolean; last_product_id?: number }> {
  try {
    const res = await apiClient.post('/sale/getSaleReturnItems', {
      party_id: payload.party_id,
      financial_year: payload.financial_year,
      search: payload.search || '',
      last_product_id: payload.last_product_id || 0,
      return_rows: payload.return_rows || 20,
    });
    return res.data?.data || { items: [] };
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Add Items to Sale Return Cart
 */
export async function addSaleReturnCartApi(payload: {
  items: SaleReturnCartItemPayload[];
}): Promise<{ message: string; data?: any }> {
  try {
    const res = await apiClient.post('/sale/addSaleReturnCart', payload);
    return res.data;
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Delete Item from Sale Return Cart or Clear all
 */
export async function clearSaleReturnCartApi(cartId?: number | null): Promise<{ message: string }> {
  try {
    const url = cartId ? `/sale/clearSaleReturnCart?cart_id=${cartId}` : '/sale/clearSaleReturnCart?cart_id=';
    const res = await apiClient.delete(url);
    return res.data;
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Submit Return Stock Credit Note
 */
export async function submitReturnStockCreditNoteApi(
  payload: SubmitReturnStockCreditNotePayload
): Promise<{ message: string; data?: any }> {
  try {
    const res = await apiClient.post('/sale/ReturnStockCreditNoteSubmit', payload);
    return res.data;
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Submit Direct Credit Note
 */
export async function submitDirectCreditNoteApi(
  payload: SubmitDirectCreditNotePayload
): Promise<{ message: string; data?: any }> {
  try {
    const res = await apiClient.post('/sale/createDirectCreditNote', payload);
    return res.data;
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}
