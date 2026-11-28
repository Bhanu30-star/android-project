import { apiClient } from './client';

export interface EwayBillRow {
  transaction_id: string | number;
  bill_no?: string;
  invoice_no?: string;
  bill_date?: string;
  party_name?: string;
  party_phone?: string;
  gstin_no?: string;
  final_amt?: number;
  net_amount?: number;
  total_amount?: number;
  eway_bill_no?: string;
  ewb_no?: string;
  status?: string;
  doc_type?: string;
}

export interface EwayHistoryRow {
  id?: string | number;
  transaction_id: string | number;
  document_no?: string;
  doc_no?: string;
  bill_no?: string;
  document_date?: string;
  buyer_name?: string;
  party_name?: string;
  buyer_gstin?: string;
  total_amount?: number;
  ewb_no?: string;
  eway_bill_no?: string;
  ewb_date?: string;
  valid_upto?: string;
  status?: string;
  error_msg?: string;
  error_message?: string;
  vehicle_no?: string;
  trans_mode?: string;
}

export async function getEwayBillsApi(params: {
  party_phone?: string;
  invoice_no?: string;
  date_range?: string;
  page?: number;
  limit?: number;
}) {
  const res = await apiClient.post('/sale/getEwayBill', {
    party_phone: params.party_phone || '',
    invoice_no: params.invoice_no || '',
    date_range: params.date_range || '',
    page: params.page || 1,
    limit: params.limit || 50,
  });
  return res.data?.data ?? res.data ?? { finalRows: [], total: 0 };
}

export async function getEwayBillGenerateDetailApi(
  transactionId: string | number,
  type = 'Sale',
) {
  const res = await apiClient.get('/sale/getEwayBillGenerateDetail', {
    params: { transaction_id: transactionId, type },
  });
  return res.data?.data ?? res.data;
}

export async function getEwayDocumentTypeApi(supplyType = '1') {
  const res = await apiClient.get('/sale/getEwayDocumentType', {
    params: { supply_type: supplyType },
  });
  return res.data?.data ?? res.data ?? [];
}

export async function generateEwayBillApi(payload: Record<string, any>) {
  const res = await apiClient.put('/sale/ewayBillGenerate', payload);
  return res.data;
}

export async function getEwayHistoryApi(params: {
  date_range?: string;
  search_party?: string;
  bill_no?: string;
  doc_type?: string;
  type: 'pending' | 'complete' | 'error' | 'cancelled';
  page?: number;
  limit?: number;
}) {
  const res = await apiClient.post('/sale/getEwayBillHistory', {
    date_range: params.date_range || '',
    search_party: params.search_party || '',
    bill_no: params.bill_no || '',
    doc_type: params.doc_type || '',
    type: params.type,
    page: params.page || 1,
    limit: params.limit || 100,
  });
  return res.data?.data ?? { finalRows: [], summary: { total_txn: 0, total_amount: 0 }, total: 0 };
}

export async function uploadPendingEwayApi(transactionId: string | number) {
  const res = await apiClient.patch(
    `/sale/uploadPandingEwayHistory?transaction_id=${transactionId}`,
  );
  return res.data;
}

export async function deletePendingEwayApi(transactionId: string | number) {
  const res = await apiClient.patch(
    `/sale/deletePandingEwayHistory?transaction_id=${transactionId}`,
  );
  return res.data;
}

export async function deleteErrorEwayApi(transactionId: string | number) {
  const res = await apiClient.patch(
    `/sale/deleteEwayHistoryError?transaction_id=${transactionId}`,
  );
  return res.data;
}

export async function cancelCompleteEwayApi(params: {
  transaction_id: string | number;
  dist_id?: number;
  cnl_rsn?: string;
  cnl_rem?: string;
}) {
  const res = await apiClient.post('/sale/deleteCompleteEwayHistory', {
    transaction_id: params.transaction_id,
    dist_id: params.dist_id,
    cnl_rsn: params.cnl_rsn || '2',
    cnl_rem: params.cnl_rem || 'Wrong entry',
  });
  return res.data;
}

export async function getEwayErrorsApi() {
  const res = await apiClient.get('/sale/getEwayErrorList');
  return res.data?.data ?? res.data ?? [];
}

export async function getEwayProfileApi() {
  const res = await apiClient.get('/getEwayClientProfileDetail');
  return res.data?.data ?? res.data;
}

export async function updateEwayProfileGstApi(gstNo: string) {
  const res = await apiClient.patch('/updateEwayClientGstNo', { gst_no: gstNo });
  return res.data;
}
