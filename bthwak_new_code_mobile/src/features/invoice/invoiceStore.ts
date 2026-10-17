import AsyncStorage from '@react-native-async-storage/async-storage';
import { BillType, AdditionalCharges } from './calc';
import { RetailerParty } from '@/api/invoiceService';

const DRAFT_STORAGE_KEY = '@bthawk_invoice_draft_v1';

export interface InvoiceDraftState {
  party: RetailerParty | null;
  soldBy: string; // 'admin' or fsc_id
  soldByName: string; // 'Admin' or FSE Name
  creditAmount: number;
  advanceAmount: number;
  invoiceType: 'Tax Invoice' | 'Delivery Challan';
  invoiceDate: string; // ISO date string
  taxPreference: BillType;
  reverseCharge: 'Yes' | 'No';
  deliveryMode: 'Manual' | 'Courier';
  shippingAddress: string;
  purchaseOrderNo: string;
  brokerNo: string;
  docketNo: string;
  courierAgency: string;
  courierDate: string;
  remark: string;
  charges: AdditionalCharges;
  paymentMode: 'Cash' | 'Cheque' | 'Credit' | 'Both' | 'Online';
  paymentType: string;
  bankName: string;
  chequeTxnNo: string;
  chequeDate: string;
  depositBank: string;
  chequeAmt: number;
  creditDays: number;
  signatureBase64: string;
  lastUpdated: number;
}

export const initialDraftState: InvoiceDraftState = {
  party: null,
  soldBy: 'admin',
  soldByName: 'Admin',
  creditAmount: 0,
  advanceAmount: 0,
  invoiceType: 'Tax Invoice',
  invoiceDate: new Date().toISOString(),
  taxPreference: 'Inclusive',
  reverseCharge: 'No',
  deliveryMode: 'Manual',
  shippingAddress: '',
  purchaseOrderNo: '',
  brokerNo: '',
  docketNo: '',
  courierAgency: '',
  courierDate: '',
  remark: '',
  charges: {
    labour: 0,
    freight: 0,
    other: 0,
    tcsApplicable: false,
    tcsAmount: 0,
    overallDiscount: 0,
  },
  paymentMode: 'Cash',
  paymentType: '',
  bankName: '',
  chequeTxnNo: '',
  chequeDate: '',
  depositBank: '',
  chequeAmt: 0,
  creditDays: 0,
  signatureBase64: '',
  lastUpdated: Date.now(),
};

export const invoiceStorage = {
  async saveDraft(state: Partial<InvoiceDraftState>): Promise<void> {
    try {
      const existing = await invoiceStorage.loadDraft();
      const updated: InvoiceDraftState = {
        ...(existing || initialDraftState),
        ...state,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage failure
    }
  },

  async loadDraft(): Promise<InvoiceDraftState | null> {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as InvoiceDraftState;
    } catch {
      return null;
    }
  },

  async clearDraft(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};
