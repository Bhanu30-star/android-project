import { apiClient, parseApiError } from './client';

export interface FseConversionUnit {
  detail_id: string;
  conversion_detail: string;
  total_unit: string;
  conversion_unit: string;
  primary_value: string;
}

export interface FseProductItem {
  product_id: string | number;
  product_name: string;
  product_price: number | string;
  product_price_exc?: number | string;
  purchase_price?: number | string;
  dealer_price?: number | string;
  purchase_price_exc?: number | string;
  tcs_tds_applicable?: string;
  category_id?: string | number;
  category_name?: string;
  subcategory_id?: string | number;
  subcategory_name?: string;
  mrp_price?: number | string;
  hsn_code?: string;
  unit?: string;
  secondary_unit?: string;
  product_type?: string;
  discount?: string;
  decimal_category?: string;
  disc_percentage?: number | string;
  disc_percentage_amt?: number | string;
  sale_gst_applicable?: string;
  cess_app?: string;
  cess_on_sale?: string;
  cess_on_purchase?: string;
  item_type?: string;
  cess_percentage?: number | string;
  cess_amt?: number | string;
  CGST?: number | string;
  SGST?: number | string;
  IGST?: number | string;
  product_category?: string;
  serial_type?: string;
  data_type?: string;
  conversion_detail?: FseConversionUnit[];
  quantity?: number; // Current stock count
  current_stock?: number;
}

export interface GetUserProductResponse {
  status: string | boolean;
  message?: string;
  product?: FseProductItem[];
  user_message_count?: string;
  turnover?: string;
  upi_id?: string;
  upi_detail?: string;
  operator_detail?: any[];
  user_status?: string;
  user_imei?: string;
  invoice_type?: string;
  fos_type?: string;
  stock_request?: string;
  sale_allowed?: string;
  dsr_requirement?: string;
  dsr_submit?: string;
  last_dsr_date?: string;
  legal_name?: string;
  Location?: string;
  gstin_no?: string;
  currency_value?: string;
  [key: string]: any;
}

export interface GetUserStockParams {
  date?: string;
  category_name?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetUserStockResponse {
  status: boolean;
  message: string;
  total_products: number;
  products: FseProductItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Fetch products and live stock for FSE user via /fse/get-userproduct
 */
export async function getUserProductApi(params?: {
  user_id?: string;
  distributor_id?: string;
  cdate?: string;
  version?: string;
}): Promise<GetUserProductResponse> {
  const currentDate = params?.cdate || new Date().toISOString().split('T')[0];
  const queryParams = {
    ...params,
    cdate: currentDate,
    version: params?.version || '1.0',
  };

  try {
    // Attempt GET first
    const response = await apiClient.get<GetUserProductResponse>('/fse/get-userproduct', {
      params: queryParams,
    });
    return response.data;
  } catch {
    // Fallback to POST with body
    const postResponse = await apiClient.post<GetUserProductResponse>('/fse/get-userproduct', queryParams);
    return postResponse.data;
  }
}

/**
 * Fetch paginated stock with category and search filters via /fse/get-user-stock
 */
export async function getUserStockApi(params?: GetUserStockParams): Promise<GetUserStockResponse> {
  const response = await apiClient.get<GetUserStockResponse>('/fse/get-user-stock', {
    params,
  });
  return response.data;
}

/**
 * FSE Cart Types & APIs
 */
export interface FseCartItem {
  product_id: number | string;
  product_name: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface FseCartResponse {
  status: boolean;
  message?: string;
  items: FseCartItem[];
  summary?: {
    cart_count: number;
    total_amount: number;
  };
}

/**
 * Fetch current cart items for FSE user via /fse/fetch-cart
 */
export async function fetchFseCartApi(): Promise<FseCartResponse> {
  const response = await apiClient.get<FseCartResponse>('/fse/fetch-cart');
  return response.data;
}

/**
 * Add items to FSE cart via /fse/add-cart
 */
export async function addToFseCartApi(
  items: Array<{ productId: number; quantity: number; price: number }>
): Promise<any> {
  const response = await apiClient.post('/fse/add-cart', { items });
  return response.data;
}

/**
 * Remove single item or clear entire cart via /fse/remove-from-cart
 * If productId is omitted, clears ALL items in cart
 */
export async function removeFromFseCartApi(productId?: number): Promise<any> {
  const payload = productId !== undefined ? { productIds: productId } : {};
  const params = productId !== undefined ? { productIds: productId } : {};
  const response = await apiClient.delete('/fse/remove-from-cart', {
    params,
    data: payload,
  });
  return response.data;
}

/**
 * Submit stock request for cart items via /fse/submit-stock-request
 */
export async function submitFseStockRequestCartApi(product_ids: number[]): Promise<any> {
  const response = await apiClient.post('/fse/submit-stock-request', { product_ids });
  return response.data;
}

/**
 * Fetch stock request list for FSE
 */
export async function getFseStockRequestListApi(): Promise<any> {
  const response = await apiClient.get('/fse/stock_request/list');
  return response.data;
}

/**
 * Submit new stock request
 */
export async function submitFseStockRequestApi(payload: {
  product_details: Array<{
    product_id: string | number;
    quantity: number;
    purchase_price?: number;
    product_price?: number;
  }>;
  remarks?: string;
}): Promise<any> {
  const response = await apiClient.post('/fse/submit-stock-request', payload);
  return response.data;
}

/**
 * Fetch DSR Sale Report
 */
export async function getFseSaleReportApi(date?: string): Promise<any> {
  const response = await apiClient.get('/fse/sale_report', {
    params: { date },
  });
  return response.data;
}

/**
 * Fetch Denomination list for DSR submission
 */
export async function getFseDenominationListApi(): Promise<any> {
  const response = await apiClient.get('/fse/denomination_list');
  return response.data;
}

/**
 * Submit DSR
 */
export async function submitFseDsrApi(payload: any): Promise<any> {
  const response = await apiClient.post('/fse/DSR/submit', payload);
  return response.data;
}

/**
 * Fetch receipts for FSE
 */
export async function getFseMoneyReceiptApi(params?: any): Promise<any> {
  const response = await apiClient.get('/fse/money_receipt', { params });
  return response.data;
}

/**
 * FSE Party representation
 */
export interface FsePartyItem {
  party_id: number;
  party_name: string;
  mobile_number?: string;
  gstin_no?: string;
  address?: string;
  place_of_supply?: string;
}

/**
 * Fetch parties assigned to FSE with multi-endpoint fallback
 */
export async function getFsePartiesApi(): Promise<FsePartyItem[]> {
  // Strategy 1: /fse/fetch_parties
  try {
    const res = await apiClient.get<any>('/fse/fetch_parties');
    const raw = res.data?.data ?? res.data;
    const list: any[] = Array.isArray(raw?.parties)
      ? raw.parties
      : Array.isArray(raw)
      ? raw
      : [];
    if (list.length > 0) {
      return list.map((p) => ({
        party_id: Number(p.party_id ?? p.party_party_id ?? p.partyId ?? 0),
        party_name: String(p.party_name ?? p.party_party_name ?? p.partyName ?? 'Customer'),
        mobile_number: p.mobile_number ?? p.phone_no ?? p.partyPhone ?? '',
        gstin_no: p.gstin_no ?? p.party_gstin_no ?? p.gst_no ?? '',
        address: p.address ?? p.partyAddress ?? '',
        place_of_supply: p.place_of_supply ?? p.placeOfSupply ?? '',
      })).filter(p => p.party_id > 0);
    }
  } catch {
    // continue to fallback
  }

  // Strategy 2: /fse/get_party
  try {
    const res = await apiClient.get<any>('/fse/get_party');
    const raw = res.data?.data ?? res.data;
    const list: any[] = Array.isArray(raw?.parties)
      ? raw.parties
      : Array.isArray(raw)
      ? raw
      : [];
    if (list.length > 0) {
      return list.map((p) => ({
        party_id: Number(p.partyId ?? p.party_id ?? 0),
        party_name: String(p.partyName ?? p.party_name ?? 'Customer'),
        mobile_number: p.mobileNumber ?? p.mobile_number ?? p.phone_no ?? '',
        gstin_no: p.gstinNo ?? p.gstin_no ?? '',
        address: p.address ?? '',
        place_of_supply: p.placeOfSupply ?? p.place_of_supply ?? '',
      })).filter(p => p.party_id > 0);
    }
  } catch {
    // continue to fallback
  }

  // Strategy 3: /sale/fetchRetailerparty
  try {
    const res = await apiClient.get<any>('/sale/fetchRetailerparty');
    const raw = res.data?.data ?? res.data;
    const list: any[] = Array.isArray(raw?.parties)
      ? raw.parties
      : Array.isArray(raw)
      ? raw
      : [];
    return list.map((p) => ({
      party_id: Number(p.partyId ?? p.party_id ?? 0),
      party_name: String(p.partyName ?? p.party_name ?? 'Customer'),
      mobile_number: p.partyPhone ?? p.mobile_number ?? '',
      gstin_no: p.partyGst ?? p.gstin_no ?? '',
      address: p.partyAddress ?? p.address ?? '',
      place_of_supply: p.placeOfSupply ?? '',
    })).filter(p => p.party_id > 0);
  } catch {
    return [];
  }
}

/**
 * Generate Sale Invoice Payload conforming to sale.service.ts generateSaleInvoices
 */
export interface GenerateSaleInvoicePayload {
  source?: 'app' | 'web';
  party_id: number;
  searchSource_admin?: string;
  credit_amt?: number;
  advance_amt?: number;
  invoice_type: 'Tax Invoice' | 'Delivery Challan';
  invoice_txn_date: string;
  billtype: 'Inclusive' | 'Exclusive';
  reverse_charge?: 'Yes' | 'No';
  service_type?: 'Manual' | 'Courier';
  total_crate?: number;
  total_bottle?: number;
  purchase_orderno?: string;
  shipping_address?: string;
  broker_no?: string;
  docket_no?: string;
  courier_agency?: string;
  courier_date?: string;
  remark?: string;
  tot_amt_val: number;
  labour_charges?: number | string;
  freight_charges?: number | string;
  other_expence_charges?: number | string;
  tcs_applicable?: 'Yes' | 'No';
  tcs_amount?: number | string;
  net_amount: number;
  total_discount?: number;
  dist_dsr_require?: 'Yes' | 'No';
  distributor_place_supply?: string;
  signature?: string;
  payment_mode: 'Cash' | 'Cheque' | 'Credit' | 'Both' | 'Online';
  payment_type?: string;
  bank_name?: string;
  cheque_txn_no?: string;
  cheque_txn_date?: string;
  deposit_bank?: number;
  cheque_amt?: number;
  credit_days?: number;
  calculate_final_amt: number;
  calculate_disc_amt?: number;
  calculate_cess_amt?: number;
}

/**
 * Execute generateSaleInvoices via /fse/sale/generateSaleInvoice with fallback to /sale/generateSaleInvoice
 */
export async function generateSaleInvoiceApi(payload: GenerateSaleInvoicePayload): Promise<any> {
  const completePayload: GenerateSaleInvoicePayload = {
    source: 'app',
    searchSource_admin: 'admin',
    credit_amt: payload.credit_amt || 0,
    advance_amt: payload.advance_amt || 0,
    service_type: payload.service_type || 'Manual',
    reverse_charge: payload.reverse_charge || 'No',
    tcs_applicable: payload.tcs_applicable || 'No',
    tcs_amount: payload.tcs_amount || '0',
    total_crate: payload.total_crate || 0,
    total_bottle: payload.total_bottle || 0,
    cheque_amt: payload.cheque_amt || 0,
    credit_days: payload.credit_days || 0,
    calculate_disc_amt: payload.calculate_disc_amt || 0,
    calculate_cess_amt: payload.calculate_cess_amt || 0,
    total_discount: payload.total_discount || 0,
    remark: payload.remark || '',
    ...payload,
  };

  try {
    const response = await apiClient.post('/fse/sale/generateSaleInvoice', completePayload);
    return response.data;
  } catch (firstErr) {
    // Retry with /sale/generateSaleInvoice
    const response = await apiClient.post('/sale/generateSaleInvoice', completePayload);
    return response.data;
  }
}

/**
 * Add product to FSE sale cart via /fse/sale-cart/add-product
 */
export async function addFseSaleCartProductApi(payload: {
  product_list: Array<{
    product_id: number;
    quantity: number;
    price: number;
    disc_type?: string;
    discount?: number;
    bill_type?: string;
    bag_val?: number;
    free_qty?: number;
    free_scheme?: string;
    free_scheme_product?: number;
    crate_val?: number;
    bottle_val?: number;
    price_mrpval?: number;
    imei_list?: string[];
  }>;
  searchSource?: string;
}): Promise<any> {
  try {
    const res = await apiClient.post('/fse/sale-cart/add-product', payload);
    return res.data;
  } catch {
    const res = await apiClient.post('/sale/addProductInSaleCart', payload);
    return res.data;
  }
}

/**
 * Fetch current sale cart detail via /fse/sale-cart/invoice-detail
 */
export async function fetchFseSaleCartDetailApi(reverseCharge: 'Yes' | 'No' = 'No'): Promise<any> {
  try {
    const res = await apiClient.get('/fse/sale-cart/invoice-detail', {
      params: { reverse_charge: reverseCharge },
    });
    return res.data;
  } catch {
    const res = await apiClient.get('/sale/getGenerateInvoiceCartDetail', {
      params: { reverse_charge: reverseCharge },
    });
    return res.data;
  }
}

/**
 * Clear or remove item from FSE sale cart
 */
export async function clearFseSaleCartApi(cartId?: string | number): Promise<any> {
  const cid = cartId ? String(cartId) : '';
  try {
    const res = await apiClient.delete('/fse/sale-cart/clear', {
      params: cid ? { cart_id: cid } : {},
    });
    return res.data;
  } catch {
    const res = await apiClient.delete('/sale/clearSaleGenerateInvoiceCart', {
      params: cid ? { cart_id: cid } : {},
    });
    return res.data;
  }
}
