import { apiClient, parseApiError } from './client';

export interface CreditReceiptItem {
  partyId: number;
  partyName: string;
  type?: string;
  totalAmount: number;
  pendingAmount: number;
  paymentStatus?: string;
  billDate?: string;
  transactionDate?: string;
  invoiceId?: string | number;
  phone?: string;
  recordsCount?: number;
}

export interface ReturnReceiptItem {
  partyId: number;
  partyName: string;
  totalPendingCrate: number;
  totalPendingBottle: number;
  transactions?: Array<{
    txnId: string;
    billNo: string;
    transactionDateTime: string;
    totalCrate: number;
    totalBottle: number;
    pendingCrate: number;
    pendingBottle: number;
  }>;
}

export interface CreditPendingBillItem {
  invoiceId: string;
  billNo: string;
  transactionDate: string;
  transactionTime?: string;
  paymentMode?: string;
  finalAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  paymentStatus: string;
  source?: string;
  userId?: number | null;
  userName?: string;
}

export interface RetailerOption {
  partyId: number;
  partyName: string;
  partyPhone?: string;
}

/**
 * Fetch credit receipt list
 */
export async function fetchCreditReceiptListApi(params?: {
  party_id?: number;
  beat?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  rows: CreditReceiptItem[];
  totalOutstanding: number;
  totalPending: number;
  total: number;
}> {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const res = await apiClient.post<any>('/sale/creditReciptlist', {
      ...(params?.party_id ? { party_id: params.party_id } : {}),
      ...(params?.beat ? { beat: params.beat } : {}),
      ...(params?.search ? { search: params.search } : {}),
      page,
      limit,
    });

    const data = res.data?.data;
    const rows = data?.data || data?.rows || (Array.isArray(data) ? data : []);

    return {
      rows: Array.isArray(rows) ? rows : [],
      totalOutstanding: data?.totalOutstanding || 0,
      totalPending: data?.totalPending || 0,
      total: data?.filteredRecords || data?.total || rows.length,
    };
  } catch (err: any) {
    console.warn('fetchCreditReceiptListApi error:', parseApiError(err));
    return { rows: [], totalOutstanding: 0, totalPending: 0, total: 0 };
  }
}

/**
 * Submit credit payment for opening balance / single bill
 */
export async function submitCreditReceiptApi(payload: {
  partyId: number;
  invoiceId?: number | string;
  receiptDate: string;
  totalAmount: number;
  discountAmount?: number;
  paymentMode: 'Cash' | 'Cheque' | 'Online' | 'Both' | string;
  cashAmount?: number;
  chequeAmount?: number;
  chequeNumber?: string;
  chequeDate?: string;
  bankId?: number;
  issueBankName?: string;
  remark?: string;
}): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/sale/business-outstanding-submit', {
      ...payload,
      source: 'Mobile',
    });
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Submit advance receipt
 */
export async function submitAdvanceReceiptApi(payload: {
  partyId: number;
  receiptDate: string;
  totalAmount: number;
  paymentMode: 'Cash' | 'Cheque' | 'Online' | 'Both' | string;
  cashAmount?: number;
  chequeAmount?: number;
  chequeNumber?: string;
  chequeDate?: string;
  bankId?: number;
  remark?: string;
}): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/sale/advance-receipt-submit', {
      ...payload,
      source: 'Mobile',
    });
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Fetch return receipt items
 */
export async function fetchReturnReceiptDetailApi(partyId: number = 0): Promise<{
  parties: ReturnReceiptItem[];
  grandTotalPendingCrate: number;
  grandTotalPendingBottle: number;
}> {
  try {
    const res = await apiClient.post<any>('/sale/return-receipt-detail', {
      party_id: partyId,
    });
    const data = res.data?.data;
    return {
      parties: data?.parties || [],
      grandTotalPendingCrate: data?.grandTotalPendingCrate || 0,
      grandTotalPendingBottle: data?.grandTotalPendingBottle || 0,
    };
  } catch (err: any) {
    console.warn('fetchReturnReceiptDetailApi error:', parseApiError(err));
    return { parties: [], grandTotalPendingCrate: 0, grandTotalPendingBottle: 0 };
  }
}

/**
 * Submit return receipt (Crates / Bottles return)
 */
export async function submitReturnReceiptApi(payload: {
  partyId: number;
  returnDate: string;
  remark?: string;
  totalReturnCrate?: number;
  totalReturnBottle?: number;
  transactions: Array<{
    txnId: string;
    returnCrate: number;
    returnBottle: number;
  }>;
}): Promise<{ message: string }> {
  try {
    const totalCrates =
      payload.totalReturnCrate ??
      payload.transactions.reduce((acc, t) => acc + (t.returnCrate || 0), 0);
    const totalBottles =
      payload.totalReturnBottle ??
      payload.transactions.reduce((acc, t) => acc + (t.returnBottle || 0), 0);

    const backendPayload = {
      party_id: payload.partyId,
      partyId: payload.partyId,
      pay_date: payload.returnDate,
      returnDate: payload.returnDate,
      remark: payload.remark || '',
      total_return_crate: totalCrates,
      total_return_bottle: totalBottles,
      transactions: payload.transactions.map((t) => ({
        txn_id: t.txnId,
        txnId: t.txnId,
        adjust_crate: t.returnCrate,
        adjust_bottle: t.returnBottle,
        returnCrate: t.returnCrate,
        returnBottle: t.returnBottle,
      })),
    };
    const res = await apiClient.post('/sale/return-receipt/submit', backendPayload);
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Fetch Retailer parties list for dropdowns
 */
export async function fetchRetailerPartiesApi(): Promise<RetailerOption[]> {
  try {
    const res = await apiClient.get<any>('/sale/fetchRetailerparty');
    const parties = res.data?.data?.parties || [];
    return Array.isArray(parties) ? parties : [];
  } catch {
    return [];
  }
}

/**
 * Fetch party pending bills for multi-bill adjustment
 */
export async function fetchPartyCreditSummaryApi(partyId: number): Promise<{
  transactions: CreditPendingBillItem[];
  totalPendingAmount: number;
}> {
  try {
    const res = await apiClient.post<any>('/sale/party_credit_summary', { partyId });
    const data = res.data?.data;
    const transactions = data?.transactions || (Array.isArray(data) ? data : []);
    return {
      transactions: Array.isArray(transactions) ? transactions : [],
      totalPendingAmount: data?.totalPendingAmount || 0,
    };
  } catch (err: any) {
    console.warn('fetchPartyCreditSummaryApi error:', parseApiError(err));
    return { transactions: [], totalPendingAmount: 0 };
  }
}

/**
 * Submit multi-bill credit receipt adjustment
 */
export async function submitCreditReceiptAdjustApi(payload: {
  partyId: number;
  receiptDate: string;
  paymentMode: 'Cash' | 'Cheque' | 'Online' | string;
  totalReceivedAmount: number;
  bankId?: number;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  remark?: string;
  adjustments: Array<{
    transactionId: string;
    adjustAmount: number;
  }>;
}): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('/sale/credit-receipt-adjust', payload);
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

