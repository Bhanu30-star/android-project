import { apiClient } from './client';

export interface InvoiceItem {
  transaction_id: number | string;
  transaction_bill_number?: string;
  party_name: string;
  bill_type?: string;
  payment_mode?: string;
  final_amt: number;
  total_amount?: number;
  transaction_date?: string;
  user_name?: string;
}

/**
 * Fetch real invoices list from the backend
 */
export async function fetchInvoicesApi(
  startDate: string,
  endDate: string,
  page = 1,
  limit = 20,
  search = ''
): Promise<InvoiceItem[]> {
  try {
    const response = await apiClient.post<{
      status: number;
      message: string;
      data: {
        data_set: InvoiceItem[];
        pagination?: {
          total_records: number;
          total_pages: number;
        };
      };
    }>('/sale/getSaleInvoiceAndChallanDataList', {
      type: 'get_bill_book_data',
      party: search,
      fos_user_id: '',
      bill_no: '',
      start_date: startDate,
      end_date: endDate,
      page,
      limit,
    });

    return response.data?.data?.data_set || [];
  } catch {
    return [];
  }
}
