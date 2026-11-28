import { apiClient, parseApiError } from './client';

export interface MultiRechargeProduct {
  product_id: string;
  product_name: string;
  hsn_code: string;
  tax_rate: number;
  available_stock: number;
  maintain_inventory?: string;
}

export interface MultiRechargeProductResponse {
  product_list: MultiRechargeProduct[];
  tax_type: string;
  negative_billing?: string;
}

export interface OperatorItem {
  operator_id: number;
  operator_name: string;
  status: 'Active' | 'Inactive' | string;
}

export interface MultiRechargeParty {
  id: string;
  name: string;
  place_of_supply?: string;
}

export interface MultiRechargeBank {
  bankMasterId: string;
  bankName: string;
  accountNo?: string;
}

export interface MultiRechargeHistoryRow {
  transaction_id?: number;
  unique_bill?: string;
  party_id?: number;
  party_name?: string;
  retailer_name?: string;
  operator?: string;
  bill_number?: string;
  bill_date?: string;
  payment_mode?: string;
  bill_type?: string;
  gst_configure?: string;
  qty?: number;
  taxable?: number;
  cgst?: number;
  sgst?: number;
  amount?: number;
  net_amount?: number;
  status?: string;
  [key: string]: any;
}

export interface MultiRechargeHistoryData {
  table: MultiRechargeHistoryRow[];
  total_txn: number;
  total_qty: number;
  total_taxable: number;
  total_cgst: number;
  total_sgst: number;
  total_amt: number;
}

export interface TargetSummaryData {
  opening_stock: number;
  closing_stock: number;
  total_purchase: number;
  total_sale: number;
  operator_wise_sale: { operator_detail: string; total_sale: number }[];
  operator_wise_purchase: { operator_detail: string; total_purchase: number }[];
}

export async function getMultiRechargeProductsApi(): Promise<MultiRechargeProductResponse> {
  try {
    const res = await apiClient.get('/sale/getMultiRechargeProductDetails');
    const data = res.data?.data ?? {};
    return {
      product_list: Array.isArray(data.product_list) ? data.product_list : [],
      tax_type: data.tax_type ?? 'GST',
      negative_billing: data.negative_billing ?? 'No',
    };
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function getOperatorListApi(): Promise<OperatorItem[]> {
  try {
    const res = await apiClient.get('/sale/getOperaterList');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function addOperatorApi(operator_name: string): Promise<string> {
  try {
    const res = await apiClient.post('/sale/addOperator', { operator_name });
    return res.data?.message || 'Operator added';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function updateOperatorApi(operator_id: number, operator_name: string): Promise<string> {
  try {
    const res = await apiClient.patch(`/sale/updateOperator?operator_id=${operator_id}`, { operator_name });
    return res.data?.message || 'Operator updated';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function updateOperatorStatusApi(operator_id: number, status: string): Promise<string> {
  try {
    const res = await apiClient.patch(`/sale/updateOperatorStatus?operator_id=${operator_id}`, { status });
    return res.data?.message || 'Operator status updated';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function getMultiRechargeRetailersApi(): Promise<MultiRechargeParty[]> {
  try {
    const res = await apiClient.get('/sale/fetchRetailerparty');
    const raw = res.data?.data?.parties ?? [];
    return raw.map((r: any) => ({
      id: String(r.retailer_id ?? r.party_id ?? r.id ?? ''),
      name: r.retailer_name ?? r.party_name ?? r.name ?? 'Retailer',
      place_of_supply: r.place_of_supply ?? r.state ?? '',
    }));
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function getMultiRechargePurchasePartiesApi(): Promise<MultiRechargeParty[]> {
  try {
    const res = await apiClient.get('/purchase/getPartyNameList');
    const raw = res.data?.data?.data ?? res.data?.data ?? [];
    return raw.map((p: any) => ({
      id: String(p.purchasePartyId ?? p.purchase_party_id ?? p.id ?? ''),
      name: p.partyName ?? p.party_name ?? p.name ?? 'Party',
      place_of_supply: p.placeOfSupply ?? p.place_of_supply ?? '',
    }));
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function getMultiRechargeBanksApi(): Promise<MultiRechargeBank[]> {
  try {
    const res = await apiClient.get('/purchase/getDistributorBankDetails');
    const raw = res.data?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function addMultiRechargePurchaseApi(payload: any): Promise<string> {
  try {
    const res = await apiClient.post('/sale/addMultiRechargePurchaseGenerate', payload);
    return res.data?.message || 'Purchase Invoice Created Successfully';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function addMultiRechargeSaleApi(payload: any): Promise<string> {
  try {
    const res = await apiClient.post('/sale/addMultiRechargeSaleGenerate', payload);
    return res.data?.message || 'Sale Invoice Created Successfully';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function getMultiRechargePurchaseHistoryApi(params: {
  party_name?: string;
  operator?: string;
  start_date: string;
  end_date: string;
}): Promise<MultiRechargeHistoryData> {
  try {
    const res = await apiClient.get('/sale/getMultiRechargePurchaseBillDetailList', {
      params: {
        party_name: params.party_name || undefined,
        operator: params.operator || undefined,
        start_date: params.start_date,
        end_date: params.end_date,
      },
    });
    const d = res.data?.data ?? {};
    return {
      table: Array.isArray(d.table) ? d.table : [],
      total_txn: Number(d.total_txn ?? 0),
      total_qty: Number(d.total_qty ?? 0),
      total_taxable: Number(d.total_taxable ?? 0),
      total_cgst: Number(d.total_cgst ?? 0),
      total_sgst: Number(d.total_sgst ?? 0),
      total_amt: Number(d.total_amt ?? 0),
    };
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function getMultiRechargeSaleHistoryApi(params: {
  party_name?: string;
  operator?: string;
  start_date: string;
  end_date: string;
}): Promise<MultiRechargeHistoryData> {
  try {
    const res = await apiClient.get('/sale/getMultiRechargeSaleBillDetailList', {
      params: {
        party_name: params.party_name || undefined,
        operator: params.operator || undefined,
        start_date: params.start_date,
        end_date: params.end_date,
      },
    });
    const d = res.data?.data ?? {};
    return {
      table: (Array.isArray(d.table) ? d.table : []).map((row: any) => ({
        ...row,
        party_name: row.retailer_name || row.party_name || '',
        bill_type:
          row.bill_type && row.bill_type !== row.amount
            ? row.bill_type
            : row.gst_configure || 'Inclusive',
      })),
      total_txn: Number(d.total_txn ?? 0),
      total_qty: Number(d.total_qty ?? 0),
      total_taxable: Number(d.total_taxable ?? 0),
      total_cgst: Number(d.total_cgst ?? 0),
      total_sgst: Number(d.total_sgst ?? 0),
      total_amt: Number(d.total_amt ?? 0),
    };
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function cancelMultiRechargeSaleBillApi(transaction_id: number): Promise<string> {
  try {
    const res = await apiClient.patch(`/sale/cancelSaleMultiRechargeBill?transaction_id=${transaction_id}`);
    return res.data?.message || 'Sale Bill Cancelled';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function cancelMultiRechargePurchaseBillApi(unique_bill: string, party_id: number): Promise<string> {
  try {
    const res = await apiClient.patch(
      `/sale/cancelPurchaseMultiRechargeBill?unique_bill=${encodeURIComponent(unique_bill)}&party_id=${party_id}`
    );
    return res.data?.message || 'Purchase Bill Cancelled';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function getMultiRechargeTargetSummaryApi(date: string): Promise<TargetSummaryData> {
  try {
    const res = await apiClient.get('/sale/getMultiRechargeTargetSummary', { params: { date } });
    const d = res.data?.data ?? {};
    return {
      opening_stock: Number(d.opening_stock ?? 0),
      closing_stock: Number(d.closing_stock ?? 0),
      total_purchase: Number(d.total_purchase ?? 0),
      total_sale: Number(d.total_sale ?? 0),
      operator_wise_sale: Array.isArray(d.operator_wise_sale) ? d.operator_wise_sale : [],
      operator_wise_purchase: Array.isArray(d.operator_wise_purchase) ? d.operator_wise_purchase : [],
    };
  } catch (err) {
    throw parseApiError(err);
  }
}
