import { apiClient } from './client';

export interface GraphDataPoint {
  date: string; // YYYY-MM-DD or MMM-YY
  sale: number;
  purchase: number;
}

export interface DashboardData {
  isEcomm: string;
  currency_value: string;
  totalSale: number;
  totalPurchase: number;
  toCollect?: number;
  toPay?: number;
  totalInvoice: number;
  totalCreditInvoice: number;
  outstandingCollected: number;
  outstandingPay: number;
  totalFSE: number;
  totalDSR: number;
  stockApproved: number;
  pendingStockReq: number;
  cashCollected: number;
  bankCollected: number;
  cashBalance: number;
  bankBalance: number;
  expenseAmt: number;
  graphData: GraphDataPoint[];
}

export interface FaqItem {
  id: number;
  question: string;
  answer_detail: string;
}

/**
 * Fetch main dashboard analytics and metrics
 */
export async function getDashboardDetailsApi(
  startDate: string,
  endDate: string
): Promise<DashboardData> {
  const response = await apiClient.post<{
    status: number;
    message: string;
    data: {
      data: DashboardData;
    };
  }>('/dashboard/getNewDashboardDetails', {
    start_date: startDate,
    end_date: endDate,
  });

  return (
    response.data?.data?.data ?? {
      isEcomm: 'No',
      currency_value: 'INR',
      totalSale: 0,
      totalPurchase: 0,
      totalInvoice: 0,
      totalCreditInvoice: 0,
      outstandingCollected: 0,
      outstandingPay: 0,
      totalFSE: 0,
      totalDSR: 0,
      stockApproved: 0,
      pendingStockReq: 0,
      cashCollected: 0,
      bankCollected: 0,
      cashBalance: 0,
      bankBalance: 0,
      expenseAmt: 0,
      graphData: [],
    }
  );
}

/**
 * Fetch FAQs for dashboard support section
 */
export async function getFaqDetailsApi(): Promise<FaqItem[]> {
  try {
    const response = await apiClient.get<{
      status: number;
      data: {
        data: FaqItem[];
      };
    }>('/dashboard/getFaqDetails');

    return response.data?.data?.data ?? [];
  } catch {
    return [];
  }
}
