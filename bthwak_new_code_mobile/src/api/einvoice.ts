import { apiClient } from './client';

export interface EinvoiceBillRow {
  transaction_id: string;
  bill_no?: string;
  bill_date?: string;
  party_name?: string;
  party_gstin?: string;
  gstin_no?: string;
  final_amt?: number;
  total_amount?: number;
  bill_type?: string;
  status?: string;
  irn?: string;
  ack_no?: string;
}

export interface EinvoiceHistoryRow {
  id?: string | number;
  transaction_id: string;
  document_no?: string;
  document_date?: string;
  buyer_name?: string;
  buyer_gstin?: string;
  total_amount?: number;
  doc_item_amount?: number;
  irn?: string;
  ack_no?: string;
  ack_date?: string;
  status?: string;
  error_message?: string;
  doc_type?: string;
}

export async function getEinvoiceBillsApi(params: {
  date: string;
  status: 'pending' | 'in_process' | 'hold';
  type?: string;
  retailer?: string;
  bill_no?: string;
  page?: number;
  limit?: number;
}) {
  const res = await apiClient.post('/sale/getEinvoiceBills', {
    date: params.date,
    status: params.status,
    type: params.type || 'all',
    retailer: params.retailer || '',
    bill_no: params.bill_no || '',
    page: params.page || 1,
    limit: params.limit || 50,
  });
  return (
    res.data?.data ?? {
      data_set: [],
      counts: { pending: 0, in_process: 0, hold: 0 },
    }
  );
}

export async function generateEinvoiceApi(transactionIds: string[]) {
  const res = await apiClient.post('/sale/generateEinvoice', {
    transaction_ids: transactionIds,
  });
  return res.data;
}

export async function toggleEinvoiceHoldApi(params: {
  transaction_id: string;
  action: 'hold' | 'unhold';
  source_tab: string;
}) {
  const res = await apiClient.post('/sale/toggleEinvoiceHold', params);
  return res.data;
}

export async function updateBillMoveToBackDateApi(params: {
  transaction_id: string;
  bill_no: string;
  bill_date: string;
}) {
  const res = await apiClient.put('/sale/updateBillMoveToBackDate', params);
  return res.data;
}

export async function getEinvoiceHistoryApi(params: {
  tab: 'pending' | 'complete' | 'error' | 'cancelled' | 'hold';
  buyer_detail?: string;
  document_no?: string;
  doc_type?: string;
  month?: string;
  page?: number;
  limit?: number;
}) {
  const res = await apiClient.post('/sale/getEinvoiceHistory', {
    tab: params.tab,
    status: params.tab,
    buyer_detail: params.buyer_detail || undefined,
    document_no: params.document_no || undefined,
    doc_type: params.doc_type && params.doc_type !== 'all' ? params.doc_type : undefined,
    month: params.month || undefined,
    page: params.page || 1,
    limit: params.limit || 100,
  });
  return res.data?.data ?? res.data ?? { data_set: [] };
}

export async function uploadEinvoiceToPortalApi(transactionId: string | number) {
  const res = await apiClient.post('/sale/uploadEinvoiceJsonToPortal', {
    transaction_id: transactionId,
  });
  return res.data;
}

export async function deleteEinvoiceApi(transactionId: string | number) {
  const res = await apiClient.post('/sale/deleteEinvoice', {
    transaction_id: transactionId,
  });
  return res.data;
}

export async function generateEinvoiceCreditNoteApi(transactionId: string | number) {
  const res = await apiClient.post('/sale/generateEinvoiceCreditNote', {
    transaction_id: transactionId,
  });
  return res.data;
}

export async function getEinvoiceErrorsApi() {
  const res = await apiClient.get('/sale/getEinvoiceErrorList');
  return res.data?.data ?? res.data ?? [];
}

export async function getEinvoiceProfileApi() {
  const res = await apiClient.get('/getEinvoiceClientProfileDetail');
  return res.data?.data ?? res.data;
}

export async function updateEinvoiceProfileGstApi(gstNo: string) {
  const res = await apiClient.patch('/updateEinvoiceClientGstNo', {}, {
    params: { gst_no: gstNo },
  });
  return res.data;
}
