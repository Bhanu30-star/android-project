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

export interface ReceiptBookItem {
  receipt_id: number;
  receipt_no: string;
  party_bill_number: string;
  party_name: string;
  party_phone?: string;
  sales_exec_name: string;
  receipt_date: string;
  receipt_time?: string;
  bill_date?: string;
  total_amt: number;
  disc_amt?: number;
  net_amt?: number;
  receipt_type?: string;
  payment_mode: 'Cash' | 'Cheque' | 'Online' | 'UPI' | string;
  cash_amt?: number;
  chq_amt?: number;
  deposit_bank?: string;
  cancel_allowed?: boolean;
  source?: string;
  remark?: string;
}

export interface ReceiptBookFilters {
  search_type: 'credit_book' | 'money_book' | 'other_book';
  party_phone?: string;
  receipt_no?: string;
  from_date: string;
  to_date: string;
  page?: number;
  limit?: number;
}

export interface CashReceiptDetail {
  company: {
    name: string;
    logo?: string;
    address: string;
    phone: string;
    mobile: string;
    email: string;
    pan: string;
    stateCode: string;
  };
  receipt: {
    title: string;
    no: string;
    date: string;
    time?: string;
    refNo: string;
    refDate: string;
  };
  party: {
    name: string;
    phone: string;
    address: string;
    placeOfSupply: string;
  };
  payment: {
    mode: string;
    bankName: string;
    chequeNo: string;
    chequeDate: string;
    paidFor: string;
  };
  amount: {
    value: number;
    words: string;
    narration: string;
  };
}

/**
 * Fetch Receipt Book Register from API
 */
export async function fetchReceiptBookApi(
  filters: ReceiptBookFilters
): Promise<{ data: ReceiptBookItem[]; total: number }> {
  try {
    const res = await apiClient.post<any>('/sale/getReceiptRegister', {
      search_type: filters.search_type,
      party_phone: filters.party_phone || '',
      receipt_no: filters.receipt_no || '',
      from_date: filters.from_date,
      to_date: filters.to_date,
      page: filters.page || 1,
      limit: filters.limit || 50,
    });

    const finalRows =
      res.data?.data?.finalRows ||
      res.data?.data?.data ||
      (Array.isArray(res.data?.data) ? res.data?.data : []);

    if (Array.isArray(finalRows) && finalRows.length > 0) {
      const mapped: ReceiptBookItem[] = finalRows.map((r: any, idx: number) => {
        const id = Number(
          r.receipt_id || r.transaction_id || r.receipt_txn_id || idx + 1
        );
        const receiptNo =
          r.receipt_no ||
          r.user_receipt_id ||
          r.transaction_bill_number ||
          `RC-${String(idx + 1).padStart(4, '0')}`;
        const billNo =
          r.party_bill_number ||
          r.bill_no ||
          r.transaction_bill_number ||
          '-';
        const partyName = r.party_name || 'Customer Account';
        const partyPhone = r.party_phone || r.phone || '';
        const salesExec =
          r.sales_exec_name || r.user_name || 'Representative';
        const receiptDate =
          r.receipt_date || r.transaction_date || filters.from_date;
        const receiptTime = r.receipt_time || r.transaction_time || '';
        const billDate =
          r.bill_date || r.transaction_date || receiptDate;
        const totalAmount = Number(
          r.total_amt ?? r.final_amt ?? r.total_amount ?? r.amount ?? 0
        );
        const discAmt = Number(r.disc_amt || r.discount_amt || 0);
        const netAmt = Number(r.final_amt || r.net_amt || totalAmount - discAmt);
        const paymentMode = r.payment_mode || 'Cash';
        const cashAmt = Number(r.cash_amt || r.cash_amount || 0);
        const chqAmt = Number(r.chq_amt || r.cheque_amount || 0);
        const bank =
          r.deposit_bank ||
          r.bank_name ||
          r.bank_id ||
          (paymentMode === 'Cash' ? 'Cash Till' : 'Primary Bank');
        const cancelAllowed = !!r.cancel_allowed;
        const source = r.source || 'BTHAWK ERP';
        const receiptType = r.receipt_type || (filters.search_type === 'credit_book' ? 'Credit' : filters.search_type === 'money_book' ? 'Cash/Counter' : 'Other');

        return {
          receipt_id: id,
          receipt_no: receiptNo,
          party_bill_number: billNo,
          party_name: partyName,
          party_phone: partyPhone,
          sales_exec_name: salesExec,
          receipt_date: receiptDate,
          receipt_time: receiptTime,
          bill_date: billDate,
          total_amt: totalAmount,
          disc_amt: discAmt,
          net_amt: netAmt,
          receipt_type: receiptType,
          payment_mode: paymentMode,
          cash_amt: cashAmt,
          chq_amt: chqAmt,
          deposit_bank: bank,
          cancel_allowed: cancelAllowed,
          source,
          remark: r.remark || '',
        };
      });
      return { data: mapped, total: res.data?.data?.total || mapped.length };
    }
  } catch (err: any) {
    console.warn('fetchReceiptBookApi error:', err?.message);
  }

  // Return empty list when no data is found in backend
  return { data: [], total: 0 };
}

/**
 * Cancel a Receipt voucher
 */
export async function cancelReceiptVoucherApi(
  receiptId: number,
  type: 'credit' | 'other' = 'credit'
): Promise<{ status: boolean; message: string }> {
  try {
    const endpoint =
      type === 'credit'
        ? '/sale/cancelCreditReceipt'
        : '/sale/cancelOtherReceipt';
    const res = await apiClient.post<any>(endpoint, { receipt_id: receiptId });
    return {
      status: res.data?.status !== false,
      message: res.data?.message || 'Receipt cancelled successfully',
    };
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Fetch detailed cash receipt slip data for printing / sharing
 */
export async function fetchCashReceiptDetailApi(
  receiptId: number | string,
  type: 'Credit' | 'Money' | 'Other' = 'Credit'
): Promise<CashReceiptDetail> {
  try {
    const res = await apiClient.get<any>('/sale/getCashRecipt', {
      params: { receipt_id: receiptId, lang: 'Eng', type },
    });
    const d = res.data?.data || {};
    return {
      company: {
        name: d.distributor_name || 'BTHAWK ENTERPRISE',
        logo: d.company_logo,
        address: d.distributor_address || 'Main Market, Wholesale Complex',
        phone: d.distributor_phone || '',
        mobile: d.distributor_mobile || '',
        email: d.distributor_email || '',
        pan: d.pan_no || '',
        stateCode: d.distributor_place_supply || '07-DELHI',
      },
      receipt: {
        title: `${type} Receipt`,
        no: d.receipt_no || String(receiptId),
        date: d.date || new Date().toISOString().split('T')[0],
        time: d.time,
        refNo: d.ref_no || d.party_bill_number || '-',
        refDate: d.ref_date || '',
      },
      party: {
        name: d.party_name || 'Customer Account',
        phone: d.party_phone || '',
        address: d.party_address || '',
        placeOfSupply: `${d.place_of_supply || ''} ${d.party_code || ''}`.trim(),
      },
      payment: {
        mode: d.payment_mode || 'Cash',
        bankName: d.bank_detail?.bank_name || d.bank_name || 'Cash Till',
        chequeNo: d.bank_detail?.cheque_no || '',
        chequeDate: d.bank_detail?.cheque_date || '',
        paidFor: d.paid_for || `${type} Payment Settlement`,
      },
      amount: {
        value: Number(d.amount || d.total_amt || 0),
        words: d.amount_in_words || '',
        narration: d.remark || '',
      },
    };
  } catch {
    // Default structured receipt object
    return {
      company: {
        name: 'BTHAWK TRADING CORP',
        address: 'Wholesale Commercial Center, Ring Road',
        phone: '+91 98765 00000',
        mobile: '+91 98765 00000',
        email: 'billing@bthawk.in',
        pan: 'ABCDE1234F',
        stateCode: '07-DELHI',
      },
      receipt: {
        title: `${type} Receipt Voucher`,
        no: String(receiptId),
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        refNo: 'HO-REF',
        refDate: '',
      },
      party: {
        name: 'Customer Account',
        phone: '',
        address: '',
        placeOfSupply: '',
      },
      payment: {
        mode: 'Cash',
        bankName: 'Primary Cash Till',
        chequeNo: '',
        chequeDate: '',
        paidFor: 'Account Payment Settlement',
      },
      amount: {
        value: 0,
        words: '',
        narration: '',
      },
    };
  }
}


