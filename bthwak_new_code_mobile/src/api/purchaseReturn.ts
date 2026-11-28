import { apiClient, parseApiError } from './client';

export interface PurchaseReturnItem {
  productId: number;
  productName: string;
  qty: number;
  price?: number;
  product_type?: string;
  distributor_category?: string;
  bag?: number;
  temp_txn_id?: number;
  transactionId?: number;
  [key: string]: any;
}

export interface PurchaseReturnCartRow {
  c_cart_id: number;
  c_product_id: number;
  c_product_name?: string;
  product_name?: string;
  c_quantity?: number;
  c_amount?: number;
  c_imei_no?: string;
  [key: string]: any;
}

export async function getPurchaseReturnDataApi(pid: string, uid: string): Promise<any> {
  try {
    const res = await apiClient.get(`/purchase/getPurchaseReturnData?pid=${encodeURIComponent(pid)}&uid=${encodeURIComponent(uid)}`);
    if (res.data?.status === false) {
      throw new Error(res.data?.message || 'Failed to fetch bill data');
    }
    return res.data?.data ?? {};
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function getPurchaseReturnCartSummaryApi(partyId: string, uniqueBill: string): Promise<{
  table_data: PurchaseReturnCartRow[];
  final_paid_amt: number;
}> {
  try {
    const res = await apiClient.get(
      `/purchase/getPurchaseReturnCartSummary?party_id=${encodeURIComponent(partyId)}&unique_bill=${encodeURIComponent(uniqueBill)}`
    );
    const d = res.data?.data ?? {};
    return {
      table_data: Array.isArray(d.table_data) ? d.table_data : [],
      final_paid_amt: Number(d.final_paid_amt ?? 0),
    };
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function getPurchaseReturnImeiApi(partyId: string, uniqueBill: string, productId: number): Promise<string[]> {
  try {
    const res = await apiClient.get(
      `/purchase/getImeiNumber?party_id=${encodeURIComponent(partyId)}&unique_bill=${encodeURIComponent(uniqueBill)}&product_id=${productId}`
    );
    const data = res.data?.data;
    if (Array.isArray(data)) {
      return data.map((i: any) => (typeof i === 'string' ? i : i.IMEI)).filter(Boolean);
    }
    if (data && Array.isArray(data.imei_no_list)) {
      return data.imei_no_list.map((i: any) => (typeof i === 'string' ? i : i.IMEI)).filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

export async function addPurchaseReturnCartApi(payload: {
  party_id: string | number;
  unique_bill: string;
  items: any[];
}): Promise<string> {
  try {
    const res = await apiClient.post('/purchase/purchaseReturnAddCart', payload);
    if (res.data?.status === false) throw new Error(res.data?.message || 'Failed to add to cart');
    return res.data?.message || 'Items added to return cart';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function deletePurchaseReturnCartApi(cartId: number): Promise<string> {
  try {
    const res = await apiClient.delete('/purchase/deletePurchaseReturnCart', {
      params: { cart_id: cartId },
    });
    return res.data?.message || 'Item removed from cart';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function submitPurchaseReturnFinalApi(payload: {
  temp_party_id: string | number;
  bNo: string;
  net_amount: number;
  tcs_amount: number;
  tcs_applicable: 'Yes' | 'No';
  remark: string;
  discount_on_total: number;
}): Promise<string> {
  try {
    const res = await apiClient.post('/purchase/purchaseReturnFinalSubmit', payload);
    if (res.data?.status === false) throw new Error(res.data?.message || 'Failed to submit return');
    return res.data?.message || 'Purchase Return Submitted Successfully';
  } catch (err) {
    throw parseApiError(err);
  }
}
