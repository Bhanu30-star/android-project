import { apiClient, parseApiError } from './client';

export interface PurchasePartyItem {
  purchasePartyId: number;
  partyName: string;
  creaditAmount: number;
  advanceAmount: number;
  partyPhone: string;
  placeOfSupply: string;
}

export interface PurchaseBagDetail {
  total_unit: number;
  detail_id: string;
  primary_value: string;
  conversion_unit?: string;
  purchase_price: number | null;
}

export interface PurchaseItemApiRecord {
  product_id: number;
  product_name: string;
  product_type: 'Service' | 'FMCG' | 'Serial No' | 'Commission' | 'RET PAYOUT';
  purchase_price: number;
  purchase_price_exc: number;
  invoice_bill_type: '' | 'Inclusive' | 'Exclusive';
  bagjson_detail?: PurchaseBagDetail[];
  decimal_allow?: 'Yes' | 'No';
  serial_type?: 'IMEI' | 'Serial' | 'Accessories';
  serialno_configuration?: 'Configure';
  stock_qty?: number | string;
  stock?: number | string;
}

export interface CartImeiItem {
  imei_no: string;
  valid_check?: string;
  cart_detail_id?: number;
  cart_imei_id?: number;
}

export interface PurchaseCartDetailItem {
  cart_detail_id: number;
  product_id?: number;
  product_name: string;
  price: string | number;
  bag_type: number;
  bag_qty: number;
  actual_qty: number;
  discount: string | number;
  gst_percent: number | null;
  gst_amount: number | null;
  cess_percent: number | null;
  cess_amount: number | null;
  net_amount: number;
  imeiList?: CartImeiItem[] | string | null;
}

export interface PurchaseCartSummary {
  final_bill_qty: number;
  final_bill_amt: number;
  final_paid_amt: number;
  final_gst_paid: number | null;
  cess_amt_final: number | null;
  disc_amt_final: number;
  net_amount_applicable: number;
}

export interface PurchaseCartResponse {
  items: PurchaseCartDetailItem[];
  summary: PurchaseCartSummary;
  bill_type?: 'Inclusive' | 'Exclusive' | '';
}

export interface DistributorBankItem {
  bankMasterId: number;
  bankName: string;
  accountNo: string;
}

export interface AddPurchaseCartItemPayload {
  product_id: number;
  quantity: number;
  price: number;
  discount_type: 'Amount' | 'Percentage';
  discount: number;
  billtype: 'Inclusive' | 'Exclusive';
  bag_value: number;
  serial_no: string[];
}

export interface SubmitPurchasePayload {
  purchase_party_id: number;
  party_place_of_supply: string;
  distributor_place_of_supply: string;
  bill_type: 'Inclusive' | 'Exclusive';
  bill_number: string;
  bill_date: string; // YYYY-MM-DD
  dist_dsr_require: 'Yes' | 'No';
  payment_mode: 'Cash' | 'Cheque' | 'Credit' | 'Online';
  payment_type: string;
  cheque_number: string;
  cheque_date: string;
  credit_days: string;
  bank_id?: number;
  bank_name?: string;
  net_amount: number;
  tcs_applicable: 'Yes' | 'No';
  tcs_amount: number;
  labour_charges: number;
  freight_charges: number;
  other_expenses: number;
  total_amount: number;
  calculate_discount_amt: number;
  remark: string;
  source: 'app';
  item_taxs: Array<{ gst: number; cess_amt: number }>;
}

// ---------------------------------------------------------------------------
// 1. Fetch Purchase Parties (Suppliers)
// ---------------------------------------------------------------------------
export async function fetchPurchasePartyListApi(): Promise<PurchasePartyItem[]> {
  try {
    const res = await apiClient.get<any>('/purchase/getPurchasePartyList');
    const parties = res.data?.data?.parties;
    if (Array.isArray(parties)) {
      return parties;
    }
    return [];
  } catch (err) {
    console.warn('fetchPurchasePartyListApi error:', parseApiError(err));
    return [];
  }
}

// ---------------------------------------------------------------------------
// 2. Fetch Purchase Cart Details & Summary
// ---------------------------------------------------------------------------
export async function fetchPurchaseCartApi(): Promise<PurchaseCartResponse> {
  const emptyCart: PurchaseCartResponse = {
    items: [],
    summary: {
      final_bill_qty: 0,
      final_bill_amt: 0,
      final_paid_amt: 0,
      final_gst_paid: 0,
      cess_amt_final: 0,
      disc_amt_final: 0,
      net_amount_applicable: 0,
    },
    bill_type: 'Inclusive',
  };

  try {
    const res = await apiClient.get<any>('/purchase/getPurchaseCardDetailList');
    const data = res.data?.data;
    if (data) {
      return {
        items: Array.isArray(data.items) ? data.items : [],
        summary: data.summary || emptyCart.summary,
        bill_type: data.bill_type || 'Inclusive',
      };
    }
    return emptyCart;
  } catch {
    return emptyCart;
  }
}

// ---------------------------------------------------------------------------
// 3. Search / Fetch Purchase Products
// ---------------------------------------------------------------------------
export async function fetchPurchaseItemListApi(params: {
  search?: string;
  lastProductId?: number;
  returnRows?: number;
}): Promise<PurchaseItemApiRecord[]> {
  try {
    const res = await apiClient.post<any>('/purchase/getPurchaseItemList', {
      purchase_type: 'purchase',
      search: params.search || '',
      user_id: 0,
      last_product_id: params.lastProductId || 0,
      return_rows: params.returnRows || 50,
    });
    const records = res.data?.data?.records;
    if (Array.isArray(records)) {
      return records;
    }
    return [];
  } catch (err) {
    console.warn('fetchPurchaseItemListApi error:', parseApiError(err));
    return [];
  }
}

// ---------------------------------------------------------------------------
// 4. Add Items to Purchase Cart
// ---------------------------------------------------------------------------
export async function addPurchaseItemsToCartApi(
  items: AddPurchaseCartItemPayload[]
): Promise<{ status: boolean; message: string }> {
  try {
    const res = await apiClient.post<any>('/purchase/purchaseAddToCart', { items });
    return {
      status: res.data?.status ?? true,
      message: res.data?.message || `${items.length} item(s) added to cart`,
    };
  } catch (err) {
    const errMsg = parseApiError(err);
    return {
      status: false,
      message: errMsg,
    };
  }
}

// ---------------------------------------------------------------------------
// 5. Clear / Delete Items from Purchase Cart
// ---------------------------------------------------------------------------
export async function clearPurchaseCartApi(params?: {
  cartId?: string | number;
  productId?: string | number;
}): Promise<{ status: boolean; message: string }> {
  try {
    const query = new URLSearchParams();
    if (params?.cartId !== undefined) query.append('cart_id', String(params.cartId));
    if (params?.productId !== undefined) query.append('product_id', String(params.productId));

    const qs = query.toString();
    const endpoint = `/purchase/clearPurchaseCartDetail${qs ? `?${qs}` : ''}`;
    const res = await apiClient.get<any>(endpoint);
    return {
      status: res.data?.status ?? true,
      message: res.data?.message || 'Cart cleared successfully',
    };
  } catch (err) {
    const errMsg = parseApiError(err);
    return {
      status: false,
      message: errMsg,
    };
  }
}

// ---------------------------------------------------------------------------
// 6. Fetch Terms & Conditions
// ---------------------------------------------------------------------------
export async function fetchStockTermsConditionsApi(): Promise<string[]> {
  try {
    const res = await apiClient.get<any>('/purchase/getStockAddTermsAndConditions');
    const data = res.data?.data;
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [
      'Goods once sold will not be taken back.',
      'Interest @ 18% p.a. will be charged if payment is not made within the stipulated time.',
      'INR 300 will be charged in case of cheque return.',
    ];
  } catch {
    return [
      'Goods once sold will not be taken back.',
      'Interest @ 18% p.a. will be charged if payment is not made within the stipulated time.',
      'INR 300 will be charged in case of cheque return.',
    ];
  }
}

// ---------------------------------------------------------------------------
// 7. Fetch Distributor Banks for Online Payment
// ---------------------------------------------------------------------------
export async function fetchDistributorBanksApi(): Promise<DistributorBankItem[]> {
  try {
    const res = await apiClient.get<any>('/purchase/getDistributorBankDetails');
    const data = res.data?.data;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 8. Submit Final Purchase
// ---------------------------------------------------------------------------
export async function submitPurchaseApi(
  payload: SubmitPurchasePayload
): Promise<{ status: boolean; message: string }> {
  try {
    const res = await apiClient.post<any>('/purchase/addPurchase', payload);
    return {
      status: res.data?.status ?? true,
      message: res.data?.message || 'Purchase added successfully',
    };
  } catch (err) {
    const errMsg = parseApiError(err);
    return {
      status: false,
      message: errMsg,
    };
  }
}
