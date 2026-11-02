import { apiClient, parseApiError } from './client';

export interface CreditNoteDetailItem {
  bill_no: string;
  bill_date: string;
  txn_date: string;
  party_name: string;
  final_bill_amt: number | string;
  final_adjust_amt: number | string;
  pending_amount: number | string;
  type: 'Direct' | 'Stock Return' | string;
  status: 'Pending' | 'Complete' | string;
  gstin_no?: string;
  party_id: number;
  unique_bill: string | number;
  creditnote_id?: string | number;
  is_e_invoice?: string;
  is_view_detail?: string;
  is_adjust_button?: string;
  is_delete_button?: string;
}

export interface CreditNoteBillOption {
  label: string;
  value: string;
}

export interface CreditNoteHistoryItem {
  bill_no?: string;
  credit_note_bill_no?: string;
  party_name?: string;
  date?: string;
  txn_date?: string;
  total_amt?: number | string;
  adjust_amount?: number | string;
  receipt_id?: string | number;
  [key: string]: any;
}

/**
 * Fetch Credit Note Detail List
 */
export async function fetchCreditNoteDetailListApi(payload: {
  start_date: string;
  end_date: string;
  party_name?: string;
  party_mobile_no?: string;
}): Promise<{ items: CreditNoteDetailItem[]; total_net_amt?: number }> {
  try {
    const res = await apiClient.post('/master/get_credit_note_detail_list', {
      start_date: payload.start_date,
      end_date: payload.end_date,
      party_name: payload.party_name || '',
      party_mobile_no: payload.party_mobile_no || '',
    });

    const data = res.data?.data;
    const rawList = data?.data?.data ?? data?.data ?? data ?? [];
    const items = Array.isArray(rawList) ? rawList : [];
    const total_net_amt = data?.total_net_amt || 0;

    return { items, total_net_amt };
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Fetch Bill Numbers for Manual Adjustment
 */
export async function fetchCreditNoteBillnoListApi(params: {
  uid: string | number;
  bid: string;
  pid: string | number;
}): Promise<CreditNoteBillOption[]> {
  try {
    const res = await apiClient.get('/master/get_credit_note_billno_list', {
      params: {
        uid: params.uid,
        bid: params.bid,
        pid: params.pid,
      },
    });

    const list = res.data?.data?.data ?? res.data?.data ?? [];
    return Array.isArray(list) ? list : [];
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Adjust Credit Note (Auto or Manually)
 */
export async function creditNoteAdjustApi(payload: {
  unique_bill: string | number;
  bill_no: string;
  party_id: string | number;
  adjust_type: 'Auto' | 'Manually';
  manual_bill_no?: string;
}): Promise<{ message: string; status?: boolean }> {
  try {
    const res = await apiClient.post('/master/credit_note_adjust', payload);
    return res.data;
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Delete Credit Note
 */
export async function deleteCreditNoteDetailApi(params: {
  unique_bill: string | number;
  bill_no: string;
  party_id: string | number;
  credit_note_id?: string | number;
}): Promise<{ message: string }> {
  try {
    const res = await apiClient.delete('/master/delete_credit_note_detail', {
      params,
    });
    return res.data;
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}

/**
 * Fetch Credit Note Detail History List
 */
export async function fetchCreditNoteDetailHistoryListApi(payload: {
  start_date: string;
  end_date: string;
  party_name?: string;
  party_mobile_no?: string;
}): Promise<CreditNoteHistoryItem[]> {
  try {
    const res = await apiClient.post('/master/get_credit_note_detail_history_list', {
      start_date: payload.start_date,
      end_date: payload.end_date,
      party_name: payload.party_name || '',
      party_mobile_no: payload.party_mobile_no || '',
    });

    const data = res.data?.data;
    const rawList = data?.data?.data ?? data?.data ?? data ?? [];
    return Array.isArray(rawList) ? rawList : [];
  } catch (error: any) {
    throw new Error(parseApiError(error));
  }
}
