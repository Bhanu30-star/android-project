import { apiClient } from './client';

export interface InvoiceRecord {
  transaction_id: number;
  transaction_bill_number: string;
  party_name: string;
  party_phone?: string;
  user_name?: string;
  bill_type?: string;
  payment_mode?: string;
  bill_date?: string;
  bill_date_time?: string;
  final_amt: number;
  total_amount?: number;
  disc_amt?: number;
  r_cash_amt?: number;
  r_cheque_amt?: number;
  r_adjust_amt?: number;
  allow_bill_move_back?: number;
  restrict_admin?: number;
  user_role?: string;
  flag?: number;
  edit_flag?: number;
  delete_flag?: number;
  check_product_type?: string;
  latitude?: string | number;
  longitude?: string | number;
  payment_status?: string;
  error_msg?: string;
}

export interface InvoiceListResponse {
  data_set: InvoiceRecord[];
  pagination?: {
    total_records: number;
    total_pages: number;
    current_page: number;
  };
}

export interface InvoiceFilters {
  type: 'get_bill_book_data' | 'get_challan_book_data';
  party?: string;
  fos_user_id?: string;
  bill_no?: string;
  start_date: string;
  end_date: string;
  page?: number;
  limit?: number;
}

export interface FseUser {
  userId: number;
  userName: string;
  userPhone: string;
}

export interface MoveBackDateDetail {
  bill_no: string;
  fos_name: string;
  retailer_name: string;
  bill_date_time: string;
  net_amount: number;
  payment_mode: string;
  source: string;
  product_detail: Array<{
    product_name: string;
    product_type?: string;
    quantity: number;
    price: number;
    tax_rate?: string | number;
    tax_amt?: number;
    net_amt?: number;
  }>;
}

/**
 * Fetch list of Invoices or Challans
 */
export async function fetchInvoiceListApi(filters: InvoiceFilters): Promise<{
  rows: InvoiceRecord[];
  total: number;
}> {
  try {
    const res = await apiClient.post<{
      status: number;
      message: string;
      data: {
        data_set: InvoiceRecord[];
        pagination?: {
          total_records: number;
          total_pages: number;
        };
      };
    }>('/sale/getSaleInvoiceAndChallanDataList', {
      type: filters.type,
      party: filters.party || '',
      fos_user_id: filters.fos_user_id || '',
      bill_no: filters.bill_no || '',
      start_date: filters.start_date,
      end_date: filters.end_date,
      page: filters.page || 1,
      limit: filters.limit || 20,
    });

    const dataSet = res.data?.data?.data_set || [];
    const total = res.data?.data?.pagination?.total_records ?? dataSet.length;
    return { rows: dataSet, total };
  } catch (err: any) {
    console.warn('fetchInvoiceListApi error:', err?.message || err);
    return { rows: [], total: 0 };
  }
}

/**
 * Fetch FSE / Sales Executive Name List
 */
export async function fetchFseListApi(): Promise<FseUser[]> {
  try {
    const res = await apiClient.get<{
      status: number;
      message: string;
      data: {
        sale_excutive_list: FseUser[];
      };
    }>('/sale/getSaleExcutiveNameList');

    return res.data?.data?.sale_excutive_list || [];
  } catch {
    return [];
  }
}

/**
 * Fetch bill detail for Move To Back Date
 */
export async function fetchMoveBackDateDetailApi(
  transactionId: number | string
): Promise<MoveBackDateDetail | null> {
  const res = await apiClient.get<{
    status: number;
    message: string;
    data: MoveBackDateDetail[];
  }>('/sale/getDataBillMoveToBackDate', {
    params: { transaction_id: transactionId },
  });

  if (res.data?.data && res.data.data.length > 0) {
    return res.data.data[0];
  }
  return null;
}

/**
 * Submit Move Bill to Back Date
 */
export async function updateBillMoveBackDateApi(payload: {
  transaction_id: number | string;
  bill_no: string;
  bill_date: string;
}): Promise<{ status: number; message: string }> {
  const res = await apiClient.put<{ status: number; message: string }>(
    '/sale/updateBillMoveToBackDate',
    {},
    {
      params: {
        transaction_id: payload.transaction_id,
        bill_no: payload.bill_no,
        bill_date: payload.bill_date,
      },
    }
  );
  return res.data;
}

/**
 * Cancel / Delete Bill
 */
export async function cancelBillApi(payload: {
  transaction_id: number | string;
  cancel_type: string;
}): Promise<{ status: number; message: string }> {
  const res = await apiClient.delete<{ status: number; message: string }>(
    '/sale/cancelBillDetail',
    {
      params: {
        transaction_id: payload.transaction_id,
        cancel_type: payload.cancel_type,
      },
    }
  );
  return res.data;
}

/**
 * Fetch full invoice data for Receipt / Print (Eng or Hnd)
 */
export async function fetchInvoiceDataApi(
  transactionId: number | string,
  lang: 'Eng' | 'Hnd' = 'Eng'
): Promise<any> {
  const res = await apiClient.get('/sale/getSaleInvoiceData', {
    params: {
      transaction_id: transactionId,
      lang,
    },
  });
  return res.data?.data || res.data;
}

/**
 * Convert Challan to Tax Invoice
 */
export async function convertChallanToInvoiceApi(
  transactionId: number | string
): Promise<{ status: number; message: string }> {
  const res = await apiClient.get<{ status: number; message: string }>(
    '/sale/challanConvertTaxInvoice',
    {
      params: { transaction_id: transactionId },
    }
  );
  return res.data;
}
