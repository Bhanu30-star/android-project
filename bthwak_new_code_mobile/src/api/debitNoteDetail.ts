import { apiClient, parseApiError } from './client';

export interface DebitNoteDetailItem {
  bill_no: string;
  bill_date: string;
  txn_date?: string;
  transactionDate?: string;
  party_name: string;
  final_bill_amt: number | string;
  final_adjust_amt: number | string;
  pending_amount: number | string;
  type: 'Direct' | 'Stock Return' | 'Purchase Return' | string;
  status: 'Pending' | 'Complete' | string;
  gstin_no?: string;
  party_id?: number;
  unique_bill: string | number;
  debitnote_id?: string | number;
  org_billno?: string;
  org_billdate?: string;
  can_adjust?: boolean;
  can_delete?: boolean;
  adjustButton?: 'enabled' | 'disabled';
  remark?: string;
  [key: string]: any;
}

export interface DebitNoteBillOption {
  label: string;
  value: string;
}

export interface DebitNoteHistoryItem {
  bill_no?: string;
  debit_note_bill_no?: string;
  party_name?: string;
  date?: string;
  txn_date?: string;
  total_amt?: number | string;
  adjust_amount?: number | string;
  pending_amt?: number | string;
  type?: string;
  receipt_id?: string | number;
  unique_bill?: string | number;
  [key: string]: any;
}

/**
 * Fetch Debit Note Detail List
 * Tries the dedicated `/master/get_debit_note_detail_list` first,
 * and seamlessly falls back to `/master/debit_note_detail` if not yet registered.
 */
export async function fetchDebitNoteDetailListApi(payload: {
  start_date: string;
  end_date: string;
  party_name?: string;
  party_mobile_no?: string;
  party_id?: number;
}): Promise<{ items: DebitNoteDetailItem[]; total_net_amt?: number }> {
  // Attempt 1: Modern endpoint matching credit note detail list
  try {
    const res = await apiClient.post('/master/get_debit_note_detail_list', {
      start_date: payload.start_date,
      end_date: payload.end_date,
      party_name: payload.party_name || '',
      party_mobile_no: payload.party_mobile_no || '',
      party_id: payload.party_id || 0,
    });

    const data = res.data?.data;
    const rawList = data?.data?.data ?? data?.data ?? data?.debit_note_result ?? data ?? [];
    if (Array.isArray(rawList) && rawList.length > 0) {
      const items: DebitNoteDetailItem[] = rawList.map(normalizeDebitNoteItem);
      const total_net_amt =
        data?.total_net_amt ??
        items.reduce((acc, it) => acc + (parseFloat(String(it.final_bill_amt)) || 0), 0);
      return { items, total_net_amt };
    }
  } catch (err) {
    // Fall back to alternative endpoint below
  }

  // Attempt 2: Standard `/master/debit_note_detail`
  try {
    const res = await apiClient.post('/master/debit_note_detail', {
      page: 1,
      limit: 200,
      search: payload.party_name || '',
      party_id: payload.party_id || 0,
      from_date: payload.start_date,
      to_date: payload.end_date,
    });

    const data = res.data?.data;
    const rawList =
      data?.debit_note_result ??
      data?.data ??
      data?.items ??
      (Array.isArray(data) ? data : []);

    const items: DebitNoteDetailItem[] = (Array.isArray(rawList) ? rawList : []).map(
      normalizeDebitNoteItem
    );

    const total_net_amt = items.reduce(
      (acc, it) => acc + (parseFloat(String(it.final_bill_amt)) || 0),
      0
    );

    return { items, total_net_amt };
  } catch (err: any) {
    // If party_id was 0 and resulted in error, retry once without party_id restriction or return empty
    console.warn('fetchDebitNoteDetailListApi warning:', err?.message || err);
    return { items: [], total_net_amt: 0 };
  }
}

/**
 * Normalizes an API response item to standard DebitNoteDetailItem
 */
function normalizeDebitNoteItem(raw: any, index: number): DebitNoteDetailItem {
  const billNo = raw.bill_no || raw.debit_note_receipt || `DN-${index + 1}`;
  const billDate = raw.bill_date || raw.org_billdate || raw.transaction_date || raw.transactionDate || '';
  const partyName = raw.party_name || 'Party';
  const finalBillAmt =
    raw.final_bill_amt !== undefined
      ? raw.final_bill_amt
      : raw.total_amt !== undefined
      ? raw.total_amt
      : raw.totalAmount || 0;
  const finalAdjustAmt =
    raw.final_adjust_amt !== undefined
      ? raw.final_adjust_amt
      : raw.adjust_amt !== undefined
      ? raw.adjust_amt
      : raw.adjustAmount || 0;
  const pendingAmt =
    raw.pending_amount !== undefined
      ? raw.pending_amount
      : raw.pending_amt !== undefined
      ? raw.pending_amt
      : Math.max(0, parseFloat(String(finalBillAmt)) - parseFloat(String(finalAdjustAmt)));

  const rawType = raw.type || raw.debit_note_type || (raw.debit_note_receipt ? 'Stock Return' : 'Direct');
  const typeStr =
    rawType === 'Direct' ? 'Direct' : rawType === 'Return Stock' || rawType === 'Purchase Return' ? 'Stock Return' : String(rawType || 'Stock Return');

  const status =
    raw.status ||
    (parseFloat(String(pendingAmt)) <= 0 ? 'Complete' : 'Pending');

  return {
    bill_no: String(billNo),
    bill_date: String(billDate),
    txn_date: raw.transaction_date || raw.transactionDate,
    party_name: String(partyName),
    final_bill_amt: finalBillAmt,
    final_adjust_amt: finalAdjustAmt,
    pending_amount: pendingAmt,
    type: typeStr,
    status: status,
    gstin_no: raw.gstin_no,
    party_id: raw.party_id || raw.purchase_party_id || 0,
    unique_bill: raw.unique_bill || raw.debit_note_receipt || billNo,
    debitnote_id: raw.debitnote_id,
    org_billno: raw.org_billno,
    org_billdate: raw.org_billdate,
    can_adjust: raw.can_adjust ?? (parseFloat(String(pendingAmt)) > 0),
    can_delete: raw.can_delete ?? (parseFloat(String(finalAdjustAmt)) === 0),
    adjustButton: raw.adjustButton || (parseFloat(String(finalAdjustAmt)) !== 0 ? 'enabled' : 'disabled'),
    remark: raw.remark,
  };
}

/**
 * Fetch Debit Note History List
 */
export async function fetchDebitNoteDetailHistoryListApi(payload: {
  start_date: string;
  end_date: string;
  party_name?: string;
  party_mobile_no?: string;
}): Promise<DebitNoteHistoryItem[]> {
  // Attempt 1: get_debit_note_detail_history_list
  try {
    const res = await apiClient.post('/master/get_debit_note_detail_history_list', {
      start_date: payload.start_date,
      end_date: payload.end_date,
      party_name: payload.party_name || '',
      party_mobile_no: payload.party_mobile_no || '',
    });

    const data = res.data?.data;
    const rawList = data?.data?.data ?? data?.data ?? data ?? [];
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList;
    }
  } catch {
    // fallback
  }

  // Attempt 2: Retrieve from debit_note_detail filtered for completed/history items
  try {
    const res = await apiClient.post('/master/debit_note_detail', {
      page: 1,
      limit: 200,
      search: payload.party_name || '',
      party_id: 0,
      from_date: payload.start_date,
      to_date: payload.end_date,
    });

    const list = res.data?.data?.debit_note_result ?? [];
    if (Array.isArray(list)) {
      return list.map((it: any) => ({
        bill_no: it.bill_no || it.debit_note_receipt,
        debit_note_bill_no: it.bill_no,
        party_name: it.party_name,
        date: it.bill_date || it.org_billdate || it.transaction_date,
        txn_date: it.transaction_date || it.transactionDate || it.bill_date,
        total_amt: it.final_bill_amt ?? it.total_amt ?? 0,
        adjust_amount: it.final_adjust_amt ?? it.adjust_amt ?? 0,
        pending_amt: it.pending_amount ?? it.pending_amt ?? 0,
        type: it.type || it.debit_note_type || 'Stock Return',
        unique_bill: it.unique_bill,
      }));
    }
  } catch (err: any) {
    console.warn('fetchDebitNoteDetailHistoryListApi error:', err?.message);
  }

  return [];
}

/**
 * Delete Debit Note
 */
export async function deleteDebitNoteDetailApi(params: {
  unique_bill: string | number;
  bill_no: string;
  party_id: string | number;
}): Promise<{ message: string }> {
  try {
    const res = await apiClient.delete('/master/delete_party_debit_note', {
      params: {
        unique_bill: String(params.unique_bill),
        bill_no: String(params.bill_no),
        party_id: Number(params.party_id) || 0,
      },
    });
    return res.data;
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Adjust Debit Note
 */
export async function adjustDebitNoteApi(payload: {
  unique_bill: string;
  bill_no: string;
  party_id: number;
  type: string;
  adjust_type: 'Auto' | 'Manually';
  manual_bill_no?: string;
  receipt_id?: string;
}): Promise<{ message: string }> {
  try {
    const endpoint =
      payload.type === 'Direct'
        ? '/master/direct_debit_note_adjust'
        : '/master/return_debit_note_adjust';
    const res = await apiClient.post(endpoint, payload);
    return res.data;
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Fetch Debit Note Receipt Data (for PDF preview / printing)
 */
export async function fetchDebitNoteReceiptDataApi(params: {
  unique_bill: string;
  bill_no: string;
  type: string;
}) {
  try {
    const res = await apiClient.get('/master/get_debit_note_receipt_data', {
      params,
    });
    return res.data?.data;
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}
