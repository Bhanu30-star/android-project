import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { getAuthToken } from '../utils/secureStore';
import { API_BASE_URL, apiClient, parseApiError } from './client';

export interface PurchasePartyCreditItem {
  purchase_party_id: number | string;
  party_name: string;
  party_phone?: string;
  txn_detail?: string;
  total_amount: number;
  cash_amount: number;
  pending_amount: number;
}

export interface PurchasePartyCreditListResponse {
  data_set: PurchasePartyCreditItem[];
  final_stock_value: number;
  final_pending_value: number;
  total_transaction_count: number;
}

export interface PurchaseCreditBillRecord {
  purchase_party_id: number | string;
  unique_bill: string;
  bill_no: string;
  bill_date: string;
  transaction_date?: string;
  party_name: string;
  party_phone?: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  can_pay?: boolean;
}

export interface PartyWiseBillingDetailsResponse {
  records: PurchaseCreditBillRecord[];
  restrict_admin: number;
  client_pending_amt: number;
  client_currency: string;
  dis_dsr_requirement: string;
}

export interface UpdateCreditPurchasePartyPaymentBillDto {
  party_id: number | string;
  dist_dsr_require?: string;
  pay_date: string; // YYYY-MM-DD
  total_bill_pending_amt: number;
  total_recieved_amt: number;
  remark?: string;
  payment_mode: 'Cash' | 'Cheque' | 'Online';
  adjust_list: Array<{
    unique_bill: string;
    bill_no: string;
    pending_amt: number;
    adjust_amt: number;
  }>;
}

export interface PurchaseBillDetailItem {
  bill_type: string;
  bill_no: string;
  bill_date: string;
  txn_date?: string;
  party_name: string;
  party_phone?: string;
  total_amt: number;
  cash_amt: number;
  pending_amt: number;
}

export interface PurchasePaymentReceiptItem {
  payment_mode: string;
  payment_date: string;
  total_amount: number;
  receive_disc_amt: number;
  bank_name?: string;
  cheque_no?: string;
  cheque_date?: string;
  unique_bill: string;
  bill_no: string;
  payment_id: number | string;
}

export interface PurchaseBillDetailListResponse {
  purchase_party_ditails: PurchaseBillDetailItem[];
  purchase_payment_details: PurchasePaymentReceiptItem[];
}

// 1. Fetch Purchase Party Credit List (GET /purchase/getPurchasePartyCreditList)
export async function fetchPurchasePartyCreditListApi(): Promise<{
  success: boolean;
  data: PurchasePartyCreditListResponse;
  message?: string;
}> {
  try {
    const res = await apiClient.get<any>('/purchase/getPurchasePartyCreditList');
    const raw = res.data?.data || res.data;
    if (raw && (Array.isArray(raw.data_set) || Array.isArray(raw))) {
      const list: PurchasePartyCreditItem[] = Array.isArray(raw.data_set)
        ? raw.data_set
        : Array.isArray(raw)
        ? raw
        : [];

      return {
        success: true,
        data: {
          data_set: list.map((item: any) => ({
            purchase_party_id: item.purchase_party_id ?? item.id ?? '',
            party_name: String(item.party_name || 'Unnamed Party'),
            party_phone: item.party_phone ? String(item.party_phone) : '',
            txn_detail: item.txn_detail || 'Billing',
            total_amount: Number(item.total_amount) || 0,
            cash_amount: Number(item.cash_amount) || 0,
            pending_amount: Number(item.pending_amount) || 0,
          })),
          final_stock_value: Number(raw.final_stock_value) || 0,
          final_pending_value: Number(raw.final_pending_value) || 0,
          total_transaction_count: Number(raw.total_transaction_count) || list.length,
        },
        message: res.data?.message,
      };
    }

    return {
      success: true,
      data: {
        data_set: [],
        final_stock_value: 0,
        final_pending_value: 0,
        total_transaction_count: 0,
      },
      message: res.data?.message || 'No party credit data found.',
    };
  } catch (err: any) {
    const msg = parseApiError(err);
    console.warn('Failed to fetch purchase party credit list:', msg);
    return {
      success: false,
      data: {
        data_set: [],
        final_stock_value: 0,
        final_pending_value: 0,
        total_transaction_count: 0,
      },
      message: msg,
    };
  }
}

// 2. Fetch Party-Wise Credit Billing Details (GET /purchase/getPartyWiseCreditListBillingDetails)
export async function fetchPartyWiseCreditBillingDetailsApi(
  partyId: number | string
): Promise<{
  success: boolean;
  data: PartyWiseBillingDetailsResponse;
  message?: string;
}> {
  try {
    const res = await apiClient.get<any>('/purchase/getPartyWiseCreditListBillingDetails', {
      params: { party_id: partyId },
    });
    const raw = res.data?.data?.data_set || res.data?.data || res.data;
    const records = Array.isArray(raw?.records) ? raw.records : [];

    return {
      success: true,
      data: {
        records: records.map((r: any) => ({
          purchase_party_id: r.purchase_party_id ?? partyId,
          unique_bill: String(r.unique_bill || ''),
          bill_no: String(r.bill_no || ''),
          bill_date: String(r.bill_date || ''),
          transaction_date: r.transaction_date ? String(r.transaction_date) : undefined,
          party_name: String(r.party_name || ''),
          party_phone: r.party_phone ? String(r.party_phone) : undefined,
          total_amount: Number(r.total_amount) || 0,
          paid_amount: Number(r.paid_amount) || 0,
          pending_amount: Number(r.pending_amount) || 0,
          can_pay: Boolean(r.can_pay),
        })),
        restrict_admin: Number(raw?.restrict_admin) || 0,
        client_pending_amt: Number(raw?.client_pending_amt) || 0,
        client_currency: raw?.client_currency || '₹',
        dis_dsr_requirement: raw?.dis_dsr_requirement || 'No',
      },
      message: res.data?.message,
    };
  } catch (err: any) {
    const msg = parseApiError(err);
    console.warn('Failed to fetch party-wise billing details:', msg);
    return {
      success: false,
      data: {
        records: [],
        restrict_admin: 0,
        client_pending_amt: 0,
        client_currency: '₹',
        dis_dsr_requirement: 'No',
      },
      message: msg,
    };
  }
}

// 3. Update Credit Purchase Party Payment Bill (PUT /purchase/updateCreditPurchasePartyPaymentBill)
export async function updateCreditPurchasePartyPaymentBillApi(
  payload: UpdateCreditPurchasePartyPaymentBillDto
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiClient.put<any>(
      '/purchase/updateCreditPurchasePartyPaymentBill',
      payload
    );
    return {
      success: res.data?.status ?? true,
      message: res.data?.message || 'Payment adjustment updated successfully!',
    };
  } catch (err: any) {
    const msg = parseApiError(err);
    return {
      success: false,
      message: msg,
    };
  }
}

// 4. Fetch Purchase Bill Detail List (GET /purchase/getPurchaseBillDetailList)
export async function fetchPurchaseBillDetailListApi(params: {
  purchase_party_id?: string | number;
  unique_id?: string;
  bill_no?: string;
}): Promise<{
  success: boolean;
  data: PurchaseBillDetailListResponse;
  message?: string;
}> {
  try {
    const res = await apiClient.get<any>('/purchase/getPurchaseBillDetailList', {
      params,
    });
    const raw = res.data?.data || res.data;
    const bills: PurchaseBillDetailItem[] = Array.isArray(raw?.purchase_party_ditails)
      ? raw.purchase_party_ditails
      : [];
    const payments: PurchasePaymentReceiptItem[] = Array.isArray(raw?.purchase_payment_details)
      ? raw.purchase_payment_details
      : [];

    return {
      success: true,
      data: {
        purchase_party_ditails: bills.map((b: any) => ({
          bill_type: b.bill_type || 'Billing',
          bill_no: String(b.bill_no || params.bill_no || ''),
          bill_date: String(b.bill_date || ''),
          txn_date: b.txn_date ? String(b.txn_date) : undefined,
          party_name: String(b.party_name || ''),
          party_phone: b.party_phone ? String(b.party_phone) : undefined,
          total_amt: Number(b.total_amt) || 0,
          cash_amt: Number(b.cash_amt) || 0,
          pending_amt: Number(b.pending_amt) || 0,
        })),
        purchase_payment_details: payments.map((p: any) => ({
          payment_mode: String(p.payment_mode || 'Cash'),
          payment_date: String(p.payment_date || ''),
          total_amount: Number(p.total_amount) || 0,
          receive_disc_amt: Number(p.receive_disc_amt) || 0,
          bank_name: p.bank_name ? String(p.bank_name) : undefined,
          cheque_no: p.cheque_no ? String(p.cheque_no) : undefined,
          cheque_date: p.cheque_date ? String(p.cheque_date) : undefined,
          unique_bill: String(p.unique_bill || ''),
          bill_no: String(p.bill_no || ''),
          payment_id: p.payment_id ?? '',
        })),
      },
      message: res.data?.message,
    };
  } catch (err: any) {
    const msg = parseApiError(err);
    console.warn('Failed to fetch purchase bill detail list:', msg);
    return {
      success: false,
      data: {
        purchase_party_ditails: [],
        purchase_payment_details: [],
      },
      message: msg,
    };
  }
}

// 5. Delete Purchase Payment Receipt (DELETE /purchase/deletePurchasePaymentReceipt)
export async function deletePurchasePaymentReceiptApi(
  paymentId: string | number
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiClient.delete<any>('/purchase/deletePurchasePaymentReceipt', {
      params: { payment_id: paymentId },
    });
    return {
      success: res.data?.status ?? true,
      message: res.data?.message || 'Payment receipt deleted successfully!',
    };
  } catch (err: any) {
    const msg = parseApiError(err);
    return {
      success: false,
      message: msg,
    };
  }
}

// 6. Generate & Open Payment Receipt PDF (GET /purchase/generate-payment-receipt-pdf)
export async function generatePaymentReceiptPdfApi(params: {
  payment_id: string | number;
  purchase_party_id?: string | number;
  unique_id?: string;
  bill_no?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    if (Platform.OS === 'web') {
      const res = await apiClient.get('/purchase/generate-payment-receipt-pdf', {
        params: {
          payment_id: params.payment_id,
          purchase_party_id: params.purchase_party_id,
          unique_id: params.unique_id,
          bill_no: params.bill_no,
        },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const win = typeof window !== 'undefined' ? window.open(url, '_blank') : null;
      if (!win && typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = url;
        link.download = `purchase_receipt_${params.payment_id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return { success: true };
    }

    const token = await getAuthToken();
    const queryParts = [`payment_id=${encodeURIComponent(String(params.payment_id))}`];
    if (params.purchase_party_id) {
      queryParts.push(`purchase_party_id=${encodeURIComponent(String(params.purchase_party_id))}`);
    }
    if (params.unique_id) {
      queryParts.push(`unique_id=${encodeURIComponent(params.unique_id)}`);
    }
    if (params.bill_no) {
      queryParts.push(`bill_no=${encodeURIComponent(params.bill_no)}`);
    }

    const downloadUrl = `${API_BASE_URL}/purchase/generate-payment-receipt-pdf?${queryParts.join('&')}`;
    const targetFile = new File(Paths.cache, `purchase_receipt_${params.payment_id}.pdf`);

    const downloadedFile = await File.downloadFileAsync(downloadUrl, targetFile, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      idempotent: true,
    });

    try {
      const canPreview = await File.canPreview(downloadedFile);
      if (canPreview) {
        await File.preview(downloadedFile, {
          title: `Payment Receipt #${params.payment_id}`,
          mimeType: 'application/pdf',
        });
        return { success: true };
      }
    } catch {
      // Proceed to fallback viewer
    }

    try {
      await WebBrowser.openBrowserAsync(downloadedFile.uri);
    } catch {
      await Linking.openURL(downloadUrl);
    }
    return { success: true };
  } catch (err: any) {
    const msg = parseApiError(err);
    return {
      success: false,
      message: msg || 'Failed to download receipt PDF.',
    };
  }
}
