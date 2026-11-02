import { apiClient, parseApiError } from './client';

export interface DsrSettingsData {
  dsrPendingDays: number;
  pending_autorefill_txn: number;
  dsr_allowed: 'Yes' | 'No';
  stockRequestAllowed: 'Yes' | 'No';
  creditSaleAllowed: 'Yes' | 'No';
  dsr_auto_approve: 'Yes' | 'No';
  Mode_watermark: 'Yes' | 'No';
  performaApplicable: 'Yes' | 'No';
  negativeBilling: 'Yes' | 'No';
  users_data: Array<{
    userId: string | number;
    userName: string;
    phoneNo?: string;
    userPhone?: string;
    billcancelSetting: 'Yes' | 'No';
  }>;
}

export const FALLBACK_DSR_SETTINGS: DsrSettingsData = {
  dsrPendingDays: 1,
  pending_autorefill_txn: 7,
  dsr_allowed: 'Yes',
  stockRequestAllowed: 'Yes',
  creditSaleAllowed: 'No',
  dsr_auto_approve: 'Yes',
  Mode_watermark: 'Yes',
  performaApplicable: 'No',
  negativeBilling: 'No',
  users_data: [
    {
      userId: '1',
      userName: 'FOS1',
      phoneNo: '6789000098',
      billcancelSetting: 'Yes',
    },
    {
      userId: '2',
      userName: 'FOS2',
      phoneNo: '6789000099',
      billcancelSetting: 'No',
    },
  ],
};

export interface BankAccountItem {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  branchName?: string;
  isPrimary?: boolean;
}

// Default to empty array - NO hardcoded demo data
export const FALLBACK_BANK_ACCOUNTS: BankAccountItem[] = [];

export interface UpiItem {
  id: string;
  upiId: string;
  receiverName: string;
  isPrimary?: boolean;
}

// Default to empty array - NO hardcoded demo data
export const FALLBACK_UPI_ITEMS: UpiItem[] = [];

export interface CharteredAccountantItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  chartered_type: string;
}

export const FALLBACK_CA_LIST: CharteredAccountantItem[] = [];

export interface SubscriptionPlanItem {
  id: string;
  name: string;
  coverage: string;
  price: number;
  originalPrice?: number;
  validity: string;
  multiplier: string;
  isPopular?: boolean;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanItem[] = [
  {
    id: 'starter',
    name: 'Starter',
    coverage: '3 months coverage',
    price: 3000,
    originalPrice: 3500,
    validity: '3 months validity',
    multiplier: 'Multiplier x3',
    features: ['All core features included', 'GST & E-Way Billing', 'Inventory tracking'],
  },
  {
    id: 'growth',
    name: 'Growth',
    coverage: '6 months coverage',
    price: 6000,
    originalPrice: 6500,
    validity: '6 months validity',
    multiplier: 'Multiplier x6',
    isPopular: true,
    features: [
      'All features included',
      'Priority Cloud Backup',
      'DSR Automated Reports',
      'Dedicated Tax Advisor',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    coverage: '9 months coverage',
    price: 9000,
    originalPrice: 9500,
    validity: '9 months validity',
    multiplier: 'Multiplier x9',
    features: [
      'All features included',
      'Multi-device synchronization',
      'Advanced financial analytics',
      'VIP SLA support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    coverage: 'Annual coverage',
    price: 12000,
    originalPrice: 12500,
    validity: '12 months validity',
    multiplier: 'Multiplier x12',
    features: [
      'Uncapped multi-user seats',
      'Full API & ERP Integration',
      'Custom invoice branding',
      '24/7 dedicated support',
    ],
  },
];

export interface RenewalDetailsResponse {
  distributor_name?: string;
  distributor_email?: string;
  phone_no?: string;
  current_plan?: string;
  subscription_charge?: number;
  admin_charge?: number;
  balance_sheet?: number;
  total_users?: number;
  renew_date?: string;
  renewal_plans?: Array<{
    id: number | string;
    name: string;
    days: number;
    months: number;
    multiplier: number;
    popular: boolean;
    price: number;
    originalPrice: number;
  }>;
}

export interface SubscriptionTransactionItem {
  txn_id: number | string;
  bt_txn_id: string;
  transaction_date: string;
  transaction_id: string;
  transaction_amount: number;
  txn_status: string;
  txn_type: string;
}

// DSR API calls
export async function fetchDsrSettingsApi(): Promise<DsrSettingsData> {
  try {
    const res = await apiClient.get<any>('/profile/get_dsr_setting');
    const raw = res.data?.data || res.data;
    if (raw && (raw.dsrPendingDays !== undefined || raw.dsr_allowed !== undefined || raw.users_data)) {
      return {
        dsrPendingDays: Number(raw.dsrPendingDays) || 1,
        pending_autorefill_txn: Number(raw.pending_autorefill_txn) || 0,
        dsr_allowed: raw.dsr_allowed === 'Yes' || raw.dsrRequirement === 'Yes' ? 'Yes' : 'No',
        stockRequestAllowed: raw.stockRequestAllowed === 'Yes' ? 'Yes' : 'No',
        creditSaleAllowed: raw.creditSaleAllowed === 'Yes' ? 'Yes' : 'No',
        dsr_auto_approve: raw.dsr_auto_approve === 'No' ? 'No' : 'Yes',
        Mode_watermark: raw.Mode_watermark === 'Yes' ? 'Yes' : 'No',
        performaApplicable: raw.performaApplicable === 'Yes' ? 'Yes' : 'No',
        negativeBilling: raw.negativeBilling === 'Yes' ? 'Yes' : 'No',
        users_data: Array.isArray(raw.users_data)
          ? raw.users_data.map((u: any) => ({
              userId: String(u.userId ?? u.id ?? ''),
              userName: String(u.userName ?? 'User'),
              phoneNo: String(u.userPhone ?? u.phoneNo ?? ''),
              billcancelSetting: u.billcancelSetting === 'Yes' ? 'Yes' : 'No',
            }))
          : FALLBACK_DSR_SETTINGS.users_data,
      };
    }
    return FALLBACK_DSR_SETTINGS;
  } catch (err) {
    console.warn('DSR settings fetch error, using fallback:', parseApiError(err));
    return FALLBACK_DSR_SETTINGS;
  }
}

export async function updateDsrSettingsApi(payload: {
  dsr_days: number;
  pending_autorefill_txn: number;
  dsr_allowed: 'Yes' | 'No';
  stock_request: 'Yes' | 'No';
  credit_sale: 'Yes' | 'No';
  negative_billing: 'Yes' | 'No';
  quotation_invoice: 'Yes' | 'No';
  auto_approve: 'Yes' | 'No';
  watermark: 'Yes' | 'No';
  bill_cancel_users: string[];
}): Promise<{ status: boolean; message: string }> {
  try {
    const res = await apiClient.post<{ status: boolean; message?: string }>(
      '/profile/update_dsr_setting',
      payload
    );
    return {
      status: res.data?.status ?? true,
      message: res.data?.message || 'Settings successfully updated !',
    };
  } catch (err) {
    const errMsg = parseApiError(err);
    console.warn('DSR settings update failed:', errMsg);
    return {
      status: false,
      message: errMsg,
    };
  }
}

// Renewal & Subscription API calls
export async function fetchRenewalDetailsApi(): Promise<RenewalDetailsResponse | null> {
  try {
    const res = await apiClient.get<any>('/profile/get_renew_details');
    if (res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    console.warn('Failed to fetch renewal details:', parseApiError(err));
    return null;
  }
}

export async function fetchSubscriptionHistoryApi(): Promise<SubscriptionTransactionItem[]> {
  try {
    const res = await apiClient.get<any>('/profile/get_subscription_details');
    const list = res.data?.data || res.data;
    if (Array.isArray(list)) {
      return list;
    }
    return [];
  } catch (err) {
    console.warn('Failed to fetch subscription history:', parseApiError(err));
    return [];
  }
}

export interface CreateRenewPaymentPayload {
  amount: number;
  month: string;
  plan: string;
  itr_charge: number;
  dis_user_id: string;
  user_session: string;
  serialno_sale: string;
  renewdate: string;
  source: 'App';
}

function decodeBase64Safe(input: string): string {
  try {
    if (typeof (globalThis as any).atob === 'function') {
      return (globalThis as any).atob(input);
    }
  } catch {
    // fallback
  }
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const str = input.replace(/=+$/, '');
    let output = '';
    for (
      let bc = 0, bs = 0, buffer: any, idx = 0;
      (buffer = str.charAt(idx++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }
    return output || input;
  } catch {
    return input;
  }
}

export async function createRenewPaymentApi(
  payload: CreateRenewPaymentPayload
): Promise<{ status: boolean; message: string; orderId?: string }> {
  try {
    const res = await apiClient.post<any>('/profile/create_renew_payment', payload);
    let orderId = '';
    if (res.data?.data) {
      orderId = decodeBase64Safe(String(res.data.data));
    }
    return {
      status: res.data?.status ?? true,
      message: res.data?.message || 'Payment initiated successfully!',
      orderId,
    };
  } catch (err) {
    const errMsg = parseApiError(err);
    return {
      status: false,
      message: errMsg,
    };
  }
}

export async function processRazorpayCallbackApi(payload: {
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  error?: any;
}): Promise<{ status: boolean; message: string }> {
  try {
    const res = await apiClient.post<any>('/profile/razorpay_callback', payload);
    return {
      status: res.data?.status ?? true,
      message: res.data?.message || 'Payment processed successfully!',
    };
  } catch (err) {
    const errMsg = parseApiError(err);
    return {
      status: false,
      message: errMsg,
    };
  }
}
