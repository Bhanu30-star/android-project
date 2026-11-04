import { apiClient, parseApiError } from './client';

/* ==========================================================================
 * 1. SALES REGISTER REPORT API & DATA TYPES
 * ========================================================================== */

export interface SaleRegisterItem {
  id: string | number;
  bill_no: string;
  bill_date: string;
  item_name: string;
  hsn: string;
  party_name: string;
  party_phone?: string;
  party_gstin?: string;
  quentity: number;
  price: number;
  discount: number;
  net_amount: number;
  tax_amount: number;
  mode_type: 'Cash' | 'Credit' | 'Online' | 'UPI' | string;
  bill_type: string;
  // Comprehensive ERP fields matching Web Frontend
  code?: string;
  vch_series?: string;
  sale_type?: string;
  mc_name?: string;
  beat?: string;
  godown_name?: string;
  category?: string;
  unit?: string;
  address_1?: string;
  state?: string;
  pincode?: string;
  regn_type?: string;
  taxable_value?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  cess_amount?: number;
  tcs_amount?: number;
  tds_amount?: number;
  other_charges?: number;
  freight_charges?: number;
  labour_charges?: number;
  place_of_supply?: string;
  reverse_charge?: string;
  invoice_type?: string;
  deposit_bank?: string;
  cheque_bank?: string;
  cheque_no?: string;
  cheque_date?: string;
  cash_amount?: number;
  cheque_amount?: number;
  online_amount?: number;
  fse_detail?: string;
  message_txn_id?: string;
  source?: string;
  remark?: string;
}

export interface SaleRegisterSummary {
  total_bills: number;
  total_quentity: number;
  total_amount: number;
  total_discount: number;
  total_net_amount: number;
  summaryByTab?: Record<string, number>;
}

export type PatternKey = 'marg' | 'busy' | 'tally' | 'tfd' | 'saral' | 'stdInv' | 'stdItem';

export interface PatternTabDef {
  key: PatternKey;
  label: string;
  fullName: string;
  fetchType: string;
}

export const PATTERN_TABS: PatternTabDef[] = [
  { key: 'marg', label: 'MARG', fullName: 'Marg ERP', fetchType: 'Marg' },
  { key: 'busy', label: 'BUSY', fullName: 'Busy Accounting', fetchType: 'Busy' },
  { key: 'tally', label: 'TALLY', fullName: 'Tally Prime', fetchType: 'Tally' },
  { key: 'tfd', label: 'TFD', fullName: 'TFD Tax', fetchType: 'TFD' },
  { key: 'saral', label: 'SARAL', fullName: 'Saral Accounts', fetchType: 'SARAL' },
  { key: 'stdInv', label: 'STD.INV', fullName: 'Standard Invoice', fetchType: 'Std Inv' },
  { key: 'stdItem', label: 'STD.ITEM', fullName: 'Standard Item', fetchType: 'Std Item' },
];

export interface SaleRegisterFilters {
  start_date: string;
  end_date: string;
  search?: string;
  mode_type?: string;
  pattern?: PatternKey;
  invoice_type?: string;
  product_type?: string;
  tax_type?: string;
  bill_type?: string;
  page?: number;
  limit?: number;
}

export async function fetchSaleRegisterApi(
  filters: SaleRegisterFilters
): Promise<{ data: SaleRegisterItem[]; summary: SaleRegisterSummary }> {
  try {
    const activePattern = filters.pattern || 'marg';
    const fetchType = PATTERN_TABS.find((p) => p.key === activePattern)?.fetchType || 'Marg';

    // 1. Try Primary Web API: /sales/getSaleRegisterReportData (Exact Web Frontend Endpoint)
    try {
      const webPayload = {
        fetch_type: fetchType,
        s_retailer_type: 'Both',
        start_date: filters.start_date,
        end_date: filters.end_date,
        product_type: filters.product_type || 'Business',
        tax_type: filters.tax_type || 'Tax',
        bill_type: filters.bill_type || 'Tax Invoice',
        party_id: '',
        invoice_type: filters.invoice_type || '',
        searchparty: filters.search?.trim() || '',
        page: filters.page || 1,
        limit: filters.limit || 50,
      };

      const webRes = await apiClient.post<any>('/sales/getSaleRegisterReportData', webPayload);
      const tableRows = webRes.data?.data?.table || [];
      const totalRec = webRes.data?.data || {};

      if (Array.isArray(tableRows) && tableRows.length > 0) {
        const mapped: SaleRegisterItem[] = tableRows.map((r: any, idx: number) => ({
          id: r.id || r.invoice_id || idx + 1,
          bill_no: r.bill_no || r.invoice_no || `INV-${String(idx + 1).padStart(4, '0')}`,
          bill_date: r.bill_date || filters.start_date,
          item_name: r.item_name || r.product_name || 'Standard SKU Item',
          hsn: r.hsn || r.item_hsn || '190531',
          party_name: r.retailer_name || r.party_name || r.customer_name || 'Retailer Party',
          party_phone: r.party_phone || r.phone || '',
          party_gstin: r.party_gstin || r.gstin_no || r.gst_no || r.gstin_of_recipient || '',
          quentity: Number(r.quentity || r.quantity || r.qty || r.billed_quantity || 1),
          price: Number(r.price || r.rate || 0),
          discount: Number(r.discount || 0),
          net_amount: Number(r.net_amount || r.net_amt || r.amount || r.total_amt || 0),
          tax_amount: Number(r.cgst || r.cgst_total || 0) + Number(r.sgst || r.sgst_total || 0) + Number(r.igst || r.igst_total || 0) || Number(r.tax_amount || 0),
          mode_type: r.mode_type || r.payment_mode || r.mode || 'Cash',
          bill_type: r.bill_type || r.gst_configure || filters.bill_type || 'Tax Invoice',
          code: r.code || '',
          vch_series: r.vch_series || 'GST',
          sale_type: r.sale_type || '',
          mc_name: r.mc_name || '',
          beat: r.beat || '',
          godown_name: r.godown_name || '',
          category: r.category || '',
          unit: r.unit || 'Pcs',
          address_1: r.address_1 || '',
          state: r.state || '',
          pincode: r.pincode || '',
          regn_type: r.regn_type || '',
          taxable_value: Number(r.taxable_value || r.taxable_amount || 0),
          cgst: Number(r.cgst || r.cgst_total || 0),
          sgst: Number(r.sgst || r.sgst_total || 0),
          igst: Number(r.igst || r.igst_total || 0),
          cess_amount: Number(r.cess || r.cess_amount || 0),
          tcs_amount: Number(r.tcs_amount || 0),
          tds_amount: Number(r.tds_amount || 0),
          other_charges: Number(r.other_charges || r.other_expenses || 0),
          freight_charges: Number(r.freight_charges || 0),
          labour_charges: Number(r.labour_charges || 0),
          place_of_supply: r.place_of_supply || '',
          reverse_charge: r.reverse_charge || 'N',
          invoice_type: r.invoice_type || '',
          deposit_bank: r.deposit_bank || '',
          cheque_bank: r.cheque_bank || '',
          cheque_no: r.cheque_no || '',
          cheque_date: r.cheque_date || '',
          cash_amount: Number(r.cash_amount || r.cash || 0),
          cheque_amount: Number(r.cheque_amount || 0),
          online_amount: Number(r.online_amount || 0),
          fse_detail: r.fse_detail || r.fse || '',
          message_txn_id: r.message_txn_id || r.txn_id || '',
          source: r.source || 'Web POS',
          remark: r.remark || '',
        }));

        const totalNet = Number(totalRec?.total_net_amt ?? totalRec?.total_net_amount ?? totalRec?.total_netamount ?? 0);
        const totalTxn = Number(totalRec?.total_txn ?? mapped.length);
        const totalQty = Number(totalRec?.total_quentity ?? totalRec?.total_quantity ?? mapped.reduce((acc, m) => acc + m.quentity, 0));
        const totalAmt = Number(totalRec?.total_amount ?? totalRec?.total_amt ?? mapped.reduce((acc, m) => acc + m.net_amount, 0));
        const totalDisc = Number(totalRec?.total_discount ?? mapped.reduce((acc, m) => acc + m.discount, 0));

        // Format dynamic pattern summary object matching web frontend
        const summaryByTab: Record<string, number> = {};
        if (activePattern === 'marg' || activePattern === 'tally') {
          summaryByTab['total_txn'] = totalTxn;
          summaryByTab['total_quentity'] = totalQty;
          summaryByTab['total_amount'] = totalAmt;
          summaryByTab['total_discount'] = totalDisc;
          summaryByTab['total_net_amt'] = totalNet || totalAmt;
        } else if (activePattern === 'busy') {
          summaryByTab['total_txn'] = totalTxn;
          summaryByTab['total_quentity'] = totalQty;
          summaryByTab['total_amount'] = totalAmt;
        } else if (activePattern === 'tfd') {
          summaryByTab['total_txn'] = totalTxn;
          summaryByTab['total_amount'] = totalAmt;
          summaryByTab['total_taxable'] = Number(totalRec?.total_taxable ?? 0);
          summaryByTab['total_cgst'] = Number(totalRec?.total_cgst ?? 0);
          summaryByTab['total_sgst'] = Number(totalRec?.total_sgst ?? 0);
          summaryByTab['total_igst'] = Number(totalRec?.total_igst ?? 0);
          summaryByTab['total_cess'] = Number(totalRec?.total_cess ?? 0);
        } else if (activePattern === 'saral' || activePattern === 'stdItem') {
          summaryByTab['total_txn'] = totalTxn;
          summaryByTab['total_quantity'] = totalQty;
          summaryByTab['total_amt'] = totalAmt;
        } else if (activePattern === 'stdInv') {
          summaryByTab['total_txn'] = totalTxn;
          summaryByTab['total_amount'] = totalAmt;
          summaryByTab['total_net_amount'] = totalNet || totalAmt;
          summaryByTab['total_discount'] = totalDisc;
          summaryByTab['total_cgst'] = Number(totalRec?.total_cgst ?? 0);
          summaryByTab['total_sgst'] = Number(totalRec?.total_sgst ?? 0);
        }

        return {
          data: mapped,
          summary: {
            total_bills: totalTxn,
            total_quentity: totalQty,
            total_amount: totalAmt,
            total_discount: totalDisc,
            total_net_amount: totalNet || totalAmt,
            summaryByTab,
          },
        };
      }
    } catch {
      // Gracefully continue to fallback endpoints
    }

    // 2. Secondary fallback: /sale/getSaleRegister
    const payload: any = {
      start_date: filters.start_date,
      end_date: filters.end_date,
      page: filters.page || 1,
      limit: filters.limit || 50,
    };
    if (filters.search && filters.search.trim()) {
      payload.search_product = filters.search.trim();
    }
    if (filters.mode_type && filters.mode_type !== 'All') {
      payload.mode_type = filters.mode_type;
    }

    const res = await apiClient.post<any>('/sale/getSaleRegister', payload);

    const rows =
      res.data?.data?.data ||
      res.data?.data?.rows ||
      (Array.isArray(res.data?.data) ? res.data?.data : []);

    if (Array.isArray(rows) && rows.length > 0) {
      const mapped: SaleRegisterItem[] = rows.map((r: any, idx: number) => {
        const id = r.invoice_id || r.id || idx + 1;
        const billNo = r.bill_no || r.invoice_no || `INV-${String(idx + 1).padStart(4, '0')}`;
        const billDate = r.bill_date || filters.start_date;
        const itemName = r.product_name || r.item_name || 'Standard FMCG SKU';
        const hsn = r.hsn || '190531';
        const partyName = r.party_name || 'Counter Retailer';
        const partyPhone = r.party_phone || r.phone || '';
        const qty = Number(r.quantity || r.qty || 1);
        const price = Number(r.price || r.rate || 0);
        const discount = Number(r.discount || 0);
        const netAmt = Number(r.net_amount || r.final_amt || (qty * price - discount));
        const taxAmt = Number(r.tax_amount || 0);
        const mode = r.payment_mode || r.mode_type || 'Cash';
        const billType = r.bill_type || 'Tax Invoice';

        return {
          id,
          bill_no: billNo,
          bill_date: billDate,
          item_name: itemName,
          hsn,
          party_name: partyName,
          party_phone: partyPhone,
          party_gstin: r.party_gstin || r.gstin_no || r.gst_no || '',
          quentity: qty,
          price,
          discount,
          net_amount: netAmt,
          tax_amount: taxAmt,
          mode_type: mode,
          bill_type: billType,
          code: r.code || '',
          vch_series: r.vch_series || 'GST',
          sale_type: r.sale_type || '',
          mc_name: r.mc_name || '',
          beat: r.beat || '',
          godown_name: r.godown_name || '',
          category: r.category || '',
          unit: r.unit || 'Pcs',
          address_1: r.address_1 || '',
          state: r.state || '',
          pincode: r.pincode || '',
          regn_type: r.regn_type || '',
          taxable_value: Number(r.taxable_value || r.taxable_amount || 0),
          cgst: Number(r.cgst || r.cgst_total || 0),
          sgst: Number(r.sgst || r.sgst_total || 0),
          igst: Number(r.igst || r.igst_total || 0),
          cess_amount: Number(r.cess || r.cess_amount || 0),
          tcs_amount: Number(r.tcs_amount || 0),
          tds_amount: Number(r.tds_amount || 0),
          other_charges: Number(r.other_charges || r.other_expenses || 0),
          freight_charges: Number(r.freight_charges || 0),
          labour_charges: Number(r.labour_charges || 0),
          place_of_supply: r.place_of_supply || '',
          reverse_charge: r.reverse_charge || 'N',
          invoice_type: r.invoice_type || '',
          deposit_bank: r.deposit_bank || '',
          cheque_bank: r.cheque_bank || '',
          cheque_no: r.cheque_no || '',
          cheque_date: r.cheque_date || '',
          cash_amount: Number(r.cash_amount || r.cash || 0),
          cheque_amount: Number(r.cheque_amount || 0),
          online_amount: Number(r.online_amount || 0),
          fse_detail: r.fse_detail || r.fse || '',
          message_txn_id: r.message_txn_id || r.txn_id || '',
          source: r.source || 'POS',
          remark: r.remark || '',
        };
      });

      const totals = res.data?.data?.totals || {};
      const summary: SaleRegisterSummary = {
        total_bills: Number(totals.total_bills) || mapped.length,
        total_quentity: Number(totals.total_qty) || mapped.reduce((acc, m) => acc + m.quentity, 0),
        total_amount: Number(totals.total_amount) || mapped.reduce((acc, m) => acc + (m.price * m.quentity), 0),
        total_discount: Number(totals.total_discount) || mapped.reduce((acc, m) => acc + m.discount, 0),
        total_net_amount: Number(totals.total_net_amount) || mapped.reduce((acc, m) => acc + m.net_amount, 0),
      };

      return { data: mapped, summary };
    }

    // Fallback: check /invoice/getInvoiceList if /sale/getSaleRegister returned empty
    const altRes = await apiClient.post<any>('/invoice/getInvoiceList', {
      from_date: filters.start_date,
      to_date: filters.end_date,
      page: filters.page || 1,
      limit: filters.limit || 50,
    });
    const altRows = altRes.data?.data?.invoices || altRes.data?.data?.data || [];
    if (Array.isArray(altRows) && altRows.length > 0) {
      const mapped: SaleRegisterItem[] = altRows.map((inv: any, idx: number) => ({
        id: inv.invoice_id || idx + 1,
        bill_no: inv.bill_number || inv.invoice_no || `INV-${idx + 1}`,
        bill_date: inv.invoice_date || inv.bill_date || filters.start_date,
        item_name: inv.product_name || 'Standard Line Items',
        hsn: inv.hsn || '190531',
        party_name: inv.party_name || 'Cash Customer',
        party_phone: inv.party_phone || '',
        quentity: Number(inv.total_qty || 1.0),
        price: Number(inv.final_amt ? (inv.final_amt / 1.18).toFixed(2) : 100),
        discount: 0,
        net_amount: Number(inv.final_amt || 118.0),
        tax_amount: Number(inv.final_amt ? (inv.final_amt - (inv.final_amt / 1.18)).toFixed(2) : 18),
        mode_type: inv.payment_mode || 'Cash',
        bill_type: inv.bill_type || 'Tax Invoice',
      }));

      const summary: SaleRegisterSummary = {
        total_bills: mapped.length,
        total_quentity: mapped.reduce((acc, m) => acc + m.quentity, 0),
        total_amount: mapped.reduce((acc, m) => acc + (m.price * m.quentity), 0),
        total_discount: 0,
        total_net_amount: mapped.reduce((acc, m) => acc + m.net_amount, 0),
      };

      return { data: mapped, summary };
    }
  } catch (err: any) {
    console.warn('fetchSaleRegisterApi error:', err?.message);
  }

  return {
    data: [],
    summary: {
      total_bills: 0,
      total_quentity: 0,
      total_amount: 0,
      total_discount: 0,
      total_net_amount: 0,
    },
  };
}

/* ==========================================================================
 * 2. PURCHASE REGISTER REPORT API (Matches Web Backend /purchase/getPurchaseDetail)
 * ========================================================================== */

export interface PurchaseRegisterItem {
  id: string | number;
  bill_no: string;
  bill_date: string;
  supplier_name: string;
  supplier_phone?: string;
  item_name: string;
  hsn: string;
  quantity: number;
  purchase_rate: number;
  tax_amount: number;
  net_amount: number;
  mode_type: 'Cash' | 'Credit' | 'Bank' | string;
  invoice_type: string;
  tcs_amount?: number;
  disc_amount?: number;
}

export interface PurchaseRegisterSummary {
  total_bills: number;
  total_quantity: number;
  total_tax: number;
  total_net_amount: number;
}

export async function fetchPurchaseRegisterApi(params: {
  from_date: string;
  to_date: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: PurchaseRegisterItem[]; summary: PurchaseRegisterSummary }> {
  try {
    const payload: any = {
      from_date: params.from_date,
      to_date: params.to_date,
      page: params.page || 1,
      limit: params.limit || 50,
    };
    if (params.search && params.search.trim()) {
      payload.invoice_no = params.search.trim();
    }

    const res = await apiClient.post<any>('/purchase/getPurchaseDetail', payload);

    const rows = res.data?.data?.data || res.data?.data || [];
    if (Array.isArray(rows) && rows.length > 0) {
      const mapped: PurchaseRegisterItem[] = rows.map((r: any, idx: number) => {
        // Backend returns camelCase: billNo, billDate, partyName, paymentMode, purchaseType, net_amount, totalAmount
        const billNo = r.billNo || r.bill_no || r.invoice_no || `PUR-${String(idx + 1).padStart(4, '0')}`;
        const billDate = r.billDate || r.bill_date || r.purchase_date || params.from_date;
        const partyName = r.partyName || r.party_name || r.supplier_name || 'Registered Supplier';
        const partyPhone = r.party_phone || r.phone || '';
        const netAmt = Number(r.net_amount ?? r.final_net_amt ?? r.totalAmount ?? r.amount ?? 0);
        const rate = Number(r.totalAmount || r.rate || r.price || netAmt);
        const taxAmt = Number(r.cgstAmt || 0) + Number(r.sgstAmt || 0) + Number(r.igstAmt || 0) || Number(r.tax_amount || 0);

        return {
          id: r.transaction_id || r.purchase_id || r.id || idx + 1,
          bill_no: billNo,
          bill_date: billDate,
          supplier_name: partyName,
          supplier_phone: partyPhone,
          item_name: r.product_name || r.item_name || 'Inventory Purchase',
          hsn: r.hsn || r.gstinNo || '-',
          quantity: Number(r.quantity || r.qty || 1),
          purchase_rate: rate,
          tax_amount: taxAmt,
          net_amount: netAmt,
          mode_type: r.paymentMode || r.payment_mode || 'Credit',
          invoice_type: r.purchaseType || r.purchase_type || r.billType || 'Tax Invoice',
          tcs_amount: Number(r.tcsAmount || 0),
          disc_amount: Number(r.discAmount || r.discAmt || 0),
        };
      });

      const totals = res.data?.data?.totals || {};
      const summary: PurchaseRegisterSummary = {
        total_bills: Number(totals.totalTxn) || mapped.length,
        total_quantity: Number(totals.totalQty) || mapped.reduce((acc, m) => acc + m.quantity, 0),
        total_tax: Number(totals.totalTaxable || totals.totalCgst) || mapped.reduce((acc, m) => acc + m.tax_amount, 0),
        total_net_amount: Number(totals.totalNetAmount) || mapped.reduce((acc, m) => acc + m.net_amount, 0),
      };

      return { data: mapped, summary };
    }
  } catch (err: any) {
    console.warn('fetchPurchaseRegisterApi error:', err?.message);
  }

  return {
    data: [],
    summary: {
      total_bills: 0,
      total_quantity: 0,
      total_tax: 0,
      total_net_amount: 0,
    },
  };
}

/* ==========================================================================
 * 3. SALE RETURN REGISTER REPORT API (/sales/getSaleReturnRegister)
 * ========================================================================== */

export interface SaleReturnItem {
  id: string | number;
  bill_no: string;
  bill_date: string;
  bill_time?: string;
  party_name: string;
  final_net_amt: number;
  adjust_amount: number;
  pending_amount: number;
  credit_note_type?: string;
}

export async function fetchSaleReturnRegisterApi(params: {
  from_date: string;
  to_date: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: SaleReturnItem[]; total: number; totalAmount: number }> {
  try {
    const payload: any = {
      from_date: params.from_date,
      to_date: params.to_date,
      page: params.page || 1,
      limit: params.limit || 50,
    };
    if (params.search && params.search.trim()) {
      payload.searchuser = params.search.trim();
    }

    const res = await apiClient.post<any>('/sales/getSaleReturnRegister', payload);
    const rows =
      res.data?.data?.finalData ||
      res.data?.data?.data ||
      (Array.isArray(res.data?.data) ? res.data?.data : []);

    if (Array.isArray(rows) && rows.length > 0) {
      const mapped: SaleReturnItem[] = rows.map((r: any, idx: number) => {
        const netAmt = Number(r.cn_final_net_amt || r.final_net_amt || r.amount || 0);
        const adjustAmt = Number(r.cn_adjust_amount || r.adjust_amount || 0);
        return {
          id: r.cn_creditnote_id || r.creditnote_id || idx + 1,
          bill_no: r.cn_bill_no || r.bill_no || `CN-${idx + 1}`,
          bill_date: r.cn_bill_date || r.bill_date || params.from_date,
          bill_time: r.cn_bill_time || r.bill_time || '',
          party_name: r.party_name || 'Retailer Customer',
          final_net_amt: netAmt,
          adjust_amount: adjustAmt,
          pending_amount: Number(r.pending_amount ?? (netAmt - adjustAmt)),
          credit_note_type: r.cn_credit_note_type || r.credit_note_type || 'Sales Return',
        };
      });
      const totalAmount = mapped.reduce((acc, m) => acc + m.final_net_amt, 0);
      return { data: mapped, total: res.data?.total || mapped.length, totalAmount };
    }
  } catch (err: any) {
    console.warn('fetchSaleReturnRegisterApi error:', err?.message);
  }
  return { data: [], total: 0, totalAmount: 0 };
}

/* ==========================================================================
 * 4. DISTRIBUTOR STOCK REGISTER API (/stocks/getDistStockRegister)
 * ========================================================================== */

export interface DistStockItem {
  id: string | number;
  product_name: string;
  category: string;
  gst: string | number;
  opening_stock: number;
  add_stock: number;
  transfer_stock: number;
  fse_return: number;
  purchase_return: number;
  total_stock: number;
  closing_stock: number;
}

export async function fetchDistStockRegisterApi(params: {
  date: string;
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: DistStockItem[]; total: number; totalUnits: number }> {
  try {
    const payload: any = {
      searchdate: params.date,
      page: params.page || 1,
      limit: params.limit || 50,
      prodname: params.search || '',
      searchcat: params.category || '',
    };
    const res = await apiClient.post<any>('/stocks/getDistStockRegister', payload);
    const rows = res.data?.data?.rows || res.data?.data || [];
    if (Array.isArray(rows) && rows.length > 0) {
      const mapped: DistStockItem[] = rows.map((r: any, idx: number) => ({
        id: r.product_id || idx + 1,
        product_name: r.product_name || `Product ${idx + 1}`,
        category: r.category || 'General',
        gst: r.gst || 0,
        opening_stock: Number(r.opening_stock || 0),
        add_stock: Number(r.add_stock || 0),
        transfer_stock: Number(r.transfer_stock || 0),
        fse_return: Number(r.fse_return || 0),
        purchase_return: Number(r.purchase_return || 0),
        total_stock: Number(r.total_stock || 0),
        closing_stock: Number(r.closing_stock || 0),
      }));
      const totalUnits = mapped.reduce((acc, m) => acc + m.closing_stock, 0);
      return { data: mapped, total: res.data?.data?.total || mapped.length, totalUnits };
    }
  } catch (err: any) {
    console.warn('fetchDistStockRegisterApi error:', err?.message);
  }
  return { data: [], total: 0, totalUnits: 0 };
}

/* ==========================================================================
 * 5. DAMAGE STOCK REGISTER API (/miscellaneous/getDamageStockRegister)
 * ========================================================================== */

export interface DamageStockItem {
  id: string | number;
  transaction_date: string;
  transaction_time: string;
  reference_no: string;
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
  remark: string;
}

export async function fetchDamageStockRegisterApi(params: {
  from_date: string;
  to_date: string;
  page?: number;
  limit?: number;
}): Promise<{ data: DamageStockItem[]; total: number; totalAmount: number; totalQty: number }> {
  try {
    const res = await apiClient.post<any>('/miscellaneous/getDamageStockRegister', {
      from_date: params.from_date,
      to_date: params.to_date,
      page: params.page || 1,
      limit: params.limit || 50,
    });
    const rows = res.data?.data?.rows || res.data?.data || [];
    if (Array.isArray(rows) && rows.length > 0) {
      const mapped: DamageStockItem[] = rows.map((r: any, idx: number) => ({
        id: r.id || idx + 1,
        transaction_date: r.transaction_date || params.from_date,
        transaction_time: r.transaction_time || '',
        reference_no: r.reference_no || `DMG-${idx + 1}`,
        product_name: r.product_name || 'Damaged Product',
        quantity: Number(r.quantity || 0),
        rate: Number(r.rate || 0),
        amount: Number(r.amount || 0),
        remark: r.remark || '',
      }));
      const totalAmount = mapped.reduce((acc, m) => acc + m.amount, 0);
      const totalQty = mapped.reduce((acc, m) => acc + m.quantity, 0);
      return { data: mapped, total: res.data?.data?.total || mapped.length, totalAmount, totalQty };
    }
  } catch (err: any) {
    console.warn('fetchDamageStockRegisterApi error:', err?.message);
  }
  return { data: [], total: 0, totalAmount: 0, totalQty: 0 };
}

/* ==========================================================================
 * 6. SALES EXECUTIVE SALE SUMMARY API (/sales/getSalesExecSaleSummary)
 * ========================================================================== */

export interface SalesExecSummaryRow {
  day: string | number;
  values: number[];
  total: number;
}

export async function fetchSalesExecSaleSummaryApi(params: {
  year_month: string;
  page?: number;
  limit?: number;
}): Promise<{ headers: { user_id: number; user_name: string }[]; rows: SalesExecSummaryRow[]; total: number }> {
  try {
    const res = await apiClient.post<any>('/sales/getSalesExecSaleSummary', {
      getyear: params.year_month,
      page: params.page || 1,
      limit: params.limit || 50,
    });
    const headers = res.data?.headers || [];
    const rows = (res.data?.rows || []).map((r: any) => ({
      day: r.day,
      values: r.values || [],
      total: Number(r.total || 0),
    }));
    return { headers, rows, total: res.data?.total || rows.length };
  } catch (err: any) {
    console.warn('fetchSalesExecSaleSummaryApi error:', err?.message);
  }
  return { headers: [], rows: [], total: 0 };
}

/* ==========================================================================
 * 7. STOCK SUMMARY API (/stocks/getStockSummary)
 * ========================================================================== */

export interface StockRegisterItem {
  id: string | number;
  product_name: string;
  category_name: string;
  sku: string;
  opening_stock: number;
  inward_qty: number;
  outward_qty: number;
  closing_stock: number;
  valuation_amount: number;
  status: 'In Stock' | 'Low Stock' | 'Critical';
}

export async function fetchStockSummaryReportApi(params: {
  search?: string;
  category?: string;
  page?: number;
}): Promise<{ data: StockRegisterItem[]; totalValuation: number; totalUnits: number }> {
  try {
    const res = await apiClient.post<any>('/stocks/getStockSummary', {
      search_date: new Date().toISOString().split('T')[0],
      search_product: params.search || '',
      search_category: params.category || '',
      page: params.page || 1,
      limit: 50,
    });

    const rows = res.data?.data?.data || res.data?.data || [];
    if (Array.isArray(rows) && rows.length > 0) {
      const mapped: StockRegisterItem[] = rows.map((r: any, idx: number) => {
        const closing = Number(r.closing_stock || r.current_stock || r.qty || 0);
        const rate = Number(r.purchase_rate || r.rate || 100);
        return {
          id: r.product_id || idx + 1,
          product_name: r.product_name || `Product SKU-${idx + 1}`,
          category_name: r.category_name || r.subcategory_name || 'General Inventory',
          sku: r.product_code || r.hsn || `SKU-${idx + 100}`,
          opening_stock: Number(r.opening_stock || 0),
          inward_qty: Number(r.purchase_qty || r.inward || 0),
          outward_qty: Number(r.sale_qty || r.outward || 0),
          closing_stock: closing,
          valuation_amount: closing * rate,
          status: closing <= 10 ? 'Critical' : closing <= 30 ? 'Low Stock' : 'In Stock',
        };
      });

      return {
        data: mapped,
        totalValuation: mapped.reduce((acc, m) => acc + m.valuation_amount, 0),
        totalUnits: mapped.reduce((acc, m) => acc + m.closing_stock, 0),
      };
    }
  } catch (err: any) {
    console.warn('fetchStockSummaryReportApi error:', err?.message);
  }

  return { data: [], totalValuation: 0, totalUnits: 0 };
}

/* ==========================================================================
 * 8. CASH / BANK & EXPENSE MASTER API (/cash/getExpenseMasterDetails)
 * ========================================================================== */

export interface ExpenseRecordItem {
  id: string | number;
  voucher_no: string;
  voucher_date: string;
  head_name: string;
  paid_to: string;
  payment_mode: 'Cash' | 'Bank' | 'UPI' | string;
  bank_name?: string;
  amount: number;
  remark?: string;
}

export async function fetchExpenseMasterApi(params: {
  from_date: string;
  to_date: string;
  search?: string;
}): Promise<{ data: ExpenseRecordItem[]; totalExpense: number }> {
  try {
    const res = await apiClient.post<any>('/cash/getExpenseMasterDetails', {
      dateRange: `${params.from_date} - ${params.to_date}`,
      searchhead: params.search || '',
      page: 1,
      limit: 50,
    });

    const rows = res.data?.data?.data || res.data?.data || [];
    if (Array.isArray(rows) && rows.length > 0) {
      const mapped: ExpenseRecordItem[] = rows.map((r: any, idx: number) => ({
        id: r.expense_id || idx + 1,
        voucher_no: r.voucher_no || `EXP-${String(idx + 1).padStart(3, '0')}`,
        voucher_date: r.date || r.expense_date || params.from_date,
        head_name: r.head_name || r.expense_head || 'Operational Expense',
        paid_to: r.paid_to || r.receiver_name || 'Vendor Payee',
        payment_mode: r.payment_mode || 'Cash',
        bank_name: r.bank_name || (r.payment_mode === 'Cash' ? 'Cash Till' : 'HDFC Bank'),
        amount: Number(r.amount || r.total_amount || 0),
        remark: r.remark || '',
      }));

      return {
        data: mapped,
        totalExpense: mapped.reduce((acc, m) => acc + m.amount, 0),
      };
    }
  } catch (err: any) {
    console.warn('fetchExpenseMasterApi error:', err?.message);
  }

  return { data: [], totalExpense: 0 };
}
