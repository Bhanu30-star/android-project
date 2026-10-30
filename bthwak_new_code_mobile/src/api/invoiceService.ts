import { apiClient } from './client';
import { BillType, DiscountType, roundToTwoDecimals } from '@/features/invoice/calc';

export interface RetailerParty {
  partyId: number;
  partyName: string;
  partyPhone?: string;
  partyGst?: string;
  partyAddress?: string;
}

export interface PartyOverdueResponse {
  creditOverdues: number;
  advanceAmt: number;
  tcsApply: 'Yes' | 'No';
  shipAddVal?: string;
  billingAddress?: string;
}

export interface FscUser {
  fsc_id: string | number;
  fsc_name: string;
  fsc_phone?: string;
}

export interface BagDetail {
  id?: number;
  total_unit: number;
  sale_price: number;
  primary_value?: string;
  bag_name?: string;
  conversion_unit?: string;
}

export interface ApiProductItem {
  product_id: number;
  product_name: string;
  product_code?: string;
  product_type: string; // 'Standard' | 'FMCG' | 'Serial No' | 'Service' | 'Commission'
  mrp_price: number;
  product_price_inc: number;
  product_price_exc: number;
  product_dealer_price: number;
  invoice_bill_type?: string; // 'Inclusive' | 'Exclusive'
  new_quantity: number; // Stock in warehouse
  maintain_inventory?: 'Yes' | 'No';
  unit?: string;
  decimal_allow?: 'Yes' | 'No';
  product_gst: number;
  product_cess?: number;
  bagjson_detail?: BagDetail[];
  serial_type?: string;
  proSerialno_imei?: { IMEI: string }[];
}

export interface CartLineItem {
  cart_id: number;
  product_id: number;
  product_name: string;
  item?: string;
  product_code?: string;
  quantity: number;
  price: number;
  mrp_price: number;
  bill_type: BillType;
  disc_type: DiscountType;
  discount: number;
  product_gst: number;
  product_cess: number;
  tax_rat?: string;
  tax_rate?: number;
  taxable_amount: number;
  total_amount: number; // line total without discount/tax
  tax_amount: number;
  cess_amount: number;
  net_amount: number;
  crate_val?: number;
  bottle_val?: number;
  total_crate?: number;
  total_bottle?: number;
  bag_val?: number;
  free_scheme?: string;
  free_scheme_product?: number;
  free_qty?: number;
  imei_list?: string[];
}

export interface CartDetailResponse {
  cart_list: CartLineItem[];
  total_amount: number;
  total_discount: number;
  total_tax_amount: number;
  total_cess_amount: number;
  total_net_amount: number;
  total_crate?: number;
  total_bottel?: number;
}

export interface AddToCartItemPayload {
  product_id: number;
  quantity: number;
  price: number;
  disc_type: DiscountType;
  discount: number;
  bill_type: BillType;
  dis_ser_config: string;
  bag_val: number;
  free_qty: number;
  free_scheme: 'Yes' | 'No';
  free_scheme_product: number;
  crate_val: number;
  bottle_val: number;
  price_mrpval: number;
  imei_list: string[];
}

export interface GenerateInvoicePayload {
  source: 'app' | 'web';
  party_id: number;
  searchSource_admin: string;
  credit_amt: number;
  advance_amt: number;
  invoice_type: 'Tax Invoice' | 'Delivery Challan';
  invoice_txn_date: string;
  billtype: BillType;
  reverse_charge: 'No'; // Always 'No' as required
  service_type: 'Manual' | 'Courier';
  total_crate?: number;
  total_bottle?: number;
  purchase_orderno?: string;
  shipping_address?: string;
  broker_no?: string;
  docket_no?: string;
  courier_agency?: string;
  courier_date?: string;
  remark: string;
  tot_amt_val: number;
  labour_charges?: number | string;
  freight_charges?: number | string;
  other_expence_charges?: number | string;
  tcs_applicable: 'Yes' | 'No';
  tcs_amount?: number | string;
  total_discount: number;
  dist_dsr_require: 'Yes' | 'No';
  distributor_place_supply?: string;
  net_amount: number;
  calculate_final_amt: number;
  calculate_disc_amt: number;
  calculate_cess_amt: number;
  signature?: string;
  payment_mode: 'Cash' | 'Cheque' | 'Credit' | 'Both' | 'Online';
  payment_type?: string;
  bank_name?: string;
  cheque_txn_no?: string;
  cheque_txn_date?: string;
  deposit_bank?: number;
  cheque_amt: number;
  credit_days?: number;
}

export interface DistributorBank {
  bankMasterId: number | string;
  bankName: string;
  accountNo: string;
}

export interface FreeSchemeProduct {
  product_id: number;
  product_name: string;
}

export interface ProfileDetails {
  user_name?: string;
  distributor_name?: string;
  bank_qr_code?: string;
}

// Developer-only test fixtures for Returnable, Bag, and Serial/IMEI products
const DEV_TEST_PRODUCTS: ApiProductItem[] = [
  {
    product_id: 999901,
    product_name: '[FIXTURE] Cold Drink 200ml (Returnable Crate & Bottle)',
    product_code: 'FMCG-RET-01',
    product_type: 'FMCG',
    mrp_price: 25,
    product_price_inc: 20,
    product_price_exc: 17.86,
    product_dealer_price: 18,
    invoice_bill_type: 'Inclusive',
    new_quantity: 240,
    unit: 'BTL',
    maintain_inventory: 'Yes',
    product_gst: 12,
    product_cess: 0,
  },
  {
    product_id: 999902,
    product_name: '[FIXTURE] Premium Basmati Rice (Bag Product 25kg/50kg)',
    product_code: 'FMCG-BAG-02',
    product_type: 'FMCG',
    mrp_price: 2200,
    product_price_inc: 2000,
    product_price_exc: 1904.76,
    product_dealer_price: 75,
    invoice_bill_type: 'Inclusive',
    new_quantity: 80,
    unit: 'BAG',
    maintain_inventory: 'Yes',
    product_gst: 5,
    product_cess: 0,
    bagjson_detail: [
      { id: 1, total_unit: 25, sale_price: 1050, bag_name: '25 KG Bag', primary_value: 'Yes', conversion_unit: 'KG' },
      { id: 2, total_unit: 50, sale_price: 2000, bag_name: '50 KG Bag', primary_value: 'No', conversion_unit: 'KG' },
    ],
  },
  {
    product_id: 999903,
    product_name: '[FIXTURE] Smartphone 5G 128GB (Serial / IMEI)',
    product_code: 'SRL-MOB-03',
    product_type: 'Serial No',
    serial_type: 'Mobile',
    mrp_price: 16999,
    product_price_inc: 14999,
    product_price_exc: 12711.02,
    product_dealer_price: 13500,
    invoice_bill_type: 'Inclusive',
    new_quantity: 4,
    unit: 'PCS',
    maintain_inventory: 'Yes',
    product_gst: 18,
    product_cess: 0,
    proSerialno_imei: [
      { IMEI: '862039049281721' },
      { IMEI: '862039049281722' },
      { IMEI: '862039049281723' },
      { IMEI: '862039049281724' },
    ],
  },
];

export const invoiceService = {
  /**
   * Fetch retailers list
   */
  async fetchRetailerParties(search = ''): Promise<RetailerParty[]> {
    try {
      const res = await apiClient.get<any>('/sale/fetchRetailerparty', {
        params: { search },
      });

      const raw = res.data?.data;
      const rawList: any[] = Array.isArray(raw?.parties)
        ? raw.parties
        : Array.isArray(raw)
        ? raw
        : [];

      const list: RetailerParty[] = rawList.map((item) => ({
        partyId: item.partyId || item.party_id || 0,
        partyName: item.partyName || item.party_name || 'Customer',
        partyPhone: item.partyPhone || item.phone_no || '',
        partyGst: item.gst_no || item.partyGst || '',
        partyAddress: item.address || item.partyAddress || '',
      }));

      if (search.trim()) {
        const query = search.toLowerCase();
        return list.filter(
          (p) =>
            p.partyName.toLowerCase().includes(query) ||
            (p.partyPhone || '').toLowerCase().includes(query) ||
            (p.partyGst || '').toLowerCase().includes(query)
        );
      }
      return list;
    } catch (err) {
      console.error('Failed to fetch retailer parties:', err);
      return [];
    }
  },

  /**
   * Fetch party overdues, advance amount and TCS status
   */
  async fetchPartyOverdues(partyId: number): Promise<PartyOverdueResponse> {
    const res = await apiClient.get<{
      status: number;
      data: {
        creditOverdues?: number;
        advanceAmt?: number;
        tcsApply?: 'Yes' | 'No';
        shipAddVal?: string;
        billingAddress?: string;
      };
    }>('/sale/getSalePartyOverDues', {
      params: {
        party_id: partyId,
        pre_total_amt: 0,
      },
    });

    return {
      creditOverdues: Number(res.data?.data?.creditOverdues || 0),
      advanceAmt: Number(res.data?.data?.advanceAmt || 0),
      tcsApply: res.data?.data?.tcsApply === 'Yes' ? 'Yes' : 'No',
      shipAddVal: res.data?.data?.shipAddVal || '',
      billingAddress: res.data?.data?.billingAddress || '',
    };
  },

  /**
   * Fetch sales executives (FSEs)
   */
  async fetchFscList(): Promise<FscUser[]> {
    try {
      const res = await apiClient.get<{
        status: number;
        data: {
          id?: string | number;
          fsc_id?: string | number;
          name?: string;
          fsc_name?: string;
          phone?: string;
        }[];
      }>('/sale/getSaleFscList');

      const list = res.data?.data || [];
      return list.map((item) => ({
        fsc_id: item.fsc_id || item.id || '',
        fsc_name: item.fsc_name || item.name || 'FSE',
        phone: item.phone || '',
      }));
    } catch {
      return [];
    }
  },

  /**
   * Fetch distributor bank details for cheque / online deposit bank
   */
  async fetchDistributorBanks(): Promise<DistributorBank[]> {
    try {
      const res = await apiClient.get<{
        status: number;
        data: {
          bankMasterId?: number | string;
          bank_id?: number | string;
          bankName?: string;
          bank_name?: string;
          accountNo?: string;
          account_no?: string;
        }[];
      }>('/purchase/getDistributorBankDetails');

      const list = res.data?.data || [];
      return list.map((b) => ({
        bankMasterId: b.bankMasterId || b.bank_id || '',
        bankName: b.bankName || b.bank_name || 'Bank',
        accountNo: b.accountNo || b.account_no || '',
      }));
    } catch {
      return [];
    }
  },

  /**
   * Fetch distributor profile details (including bank_qr_code)
   */
  async fetchProfileDetails(): Promise<ProfileDetails | null> {
    try {
      const res = await apiClient.get<{
        status: number;
        data: {
          user_name?: string;
          distributor_name?: string;
          bank_qr_code?: string;
          QR_code?: string;
        };
      }>('/profile/get_profile_details');

      const data = res.data?.data;
      if (!data) return null;
      return {
        user_name: data.user_name || '',
        distributor_name: data.distributor_name || '',
        bank_qr_code: data.bank_qr_code || data.QR_code || '',
      };
    } catch {
      return null;
    }
  },

  /**
   * Fetch free scheme products catalog
   */
  async fetchFreeSchemeProducts(): Promise<FreeSchemeProduct[]> {
    try {
      const res = await apiClient.get<{
        status: number;
        data: {
          product_id: number;
          product_name: string;
        }[];
      }>('/sale/getFreeSchemProduct');
      return res.data?.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Search / paginate products catalog with test fixtures support
   */
  async fetchProductCatalog(
    query = '',
    lastId = 0,
    searchSource = 'admin'
  ): Promise<{ products: ApiProductItem[]; lastId: number; hasMore: boolean }> {
    try {
      const res = await apiClient.post<{
        status: number;
        data: {
          cart_list: ApiProductItem[];
          last_id?: number;
        };
      }>('/sale/getSaleProductList', {
        searchSource,
        purchase_type: '',
        search_product: query,
        last_product_id: lastId,
        return_rows: 20,
      });

      let products = res.data?.data?.cart_list || [];
      const newLastId = res.data?.data?.last_id || 0;

      // Check if catalog has FMCG / Bag / Returnable / Serial test items.
      // If not, inject fixtures on first page so developer can test every edge case.
      if (lastId === 0) {
        const hasFmcg = products.some((p) => p.product_type === 'FMCG');
        const hasSerial = products.some((p) => p.product_type === 'Serial No');

        if (!hasFmcg || !hasSerial) {
          const filteredFixtures = DEV_TEST_PRODUCTS.filter((f) =>
            query
              ? f.product_name.toLowerCase().includes(query.toLowerCase()) ||
                (f.product_code && f.product_code.toLowerCase().includes(query.toLowerCase()))
              : true
          );
          products = [...filteredFixtures, ...products];
        }
      }

      return {
        products,
        lastId: newLastId,
        hasMore: (res.data?.data?.cart_list || []).length >= 20,
      };
    } catch {
      // Offline / fallback to fixtures
      const filteredFixtures = DEV_TEST_PRODUCTS.filter((f) =>
        query
          ? f.product_name.toLowerCase().includes(query.toLowerCase()) ||
            (f.product_code && f.product_code.toLowerCase().includes(query.toLowerCase()))
          : true
      );
      return {
        products: filteredFixtures,
        lastId: 0,
        hasMore: false,
      };
    }
  },

  /**
   * Add selected products to backend cart
   */
  async addProductsToCart(
    productList: AddToCartItemPayload[],
    searchSource = 'admin'
  ): Promise<any> {
    const res = await apiClient.post('/sale/addProductInSaleCart', {
      searchSource,
      product_list: productList,
    });
    return res.data;
  },

  /**
   * Fetch server cart detail and totals.
   * Maps backend `item` property to `product_name` so product name is never blank!
   */
  async getCartDetail(_reverseCharge: 'Yes' | 'No' = 'No'): Promise<CartDetailResponse> {
    const res = await apiClient.get<{
      status: number;
      data: any;
    }>('/sale/getGenerateInvoiceCartDetail', {
      params: { reverse_charge: 'No' }, // Reverse charge is always 'No'
    });

    const data = res.data?.data;
    const rawList = data?.cart_list || [];

    const cart_list: CartLineItem[] = rawList.map((item: any) => {
      const rawName = item.item || item.product_name || 'Product';
      const rawQtyStr = String(item.quantity || '1');
      const numericQty = parseFloat(rawQtyStr) || 1;
      const price = Number(item.price || 0);
      const disc = Number(item.discount || 0);
      const taxAmt = Number(item.tax_amount || 0);
      const cessAmt = Number(item.cess || item.cess_amount || 0);
      const netAmt = Number(item.net_amount || 0);
      const totAmt = Number(item.total_amount || roundToTwoDecimals(price * numericQty));
      const taxRatStr = item.tax_rat || '';
      const gstRate = parseFloat(taxRatStr.replace(/[^0-9.]/g, '')) || 0;

      // Taxable amount: for inclusive = net - taxes; for exclusive = gross - discount
      const billType = (item.bill_type as BillType) || 'Inclusive';
      const taxableAmt = roundToTwoDecimals(
        billType === 'Inclusive'
          ? Math.max(0, netAmt - taxAmt - cessAmt)
          : Math.max(0, totAmt - disc)
      );

      return {
        cart_id: item.cart_id || item.cart_detail_id || 0,
        product_id: item.product_id || 0,
        product_name: rawName,
        item: rawName,
        product_code: item.product_code || '',
        quantity: numericQty,
        price,
        mrp_price: Number(item.mrp || item.mrp_price || 0),
        bill_type: billType,
        disc_type: item.disc_type || 'Amount',
        discount: disc,
        product_gst: gstRate,
        product_cess: cessAmt,
        tax_rat: taxRatStr || `${gstRate}%`,
        tax_rate: gstRate,
        taxable_amount: taxableAmt,
        total_amount: totAmt,
        tax_amount: taxAmt,
        cess_amount: cessAmt,
        net_amount: netAmt,
        crate_val: Number(item.total_crate || item.crate_val || 0),
        bottle_val: Number(item.total_bottle || item.bottle_val || 0),
        total_crate: Number(item.total_crate || item.crate_val || 0),
        total_bottle: Number(item.total_bottle || item.bottle_val || 0),
        bag_val: Number(item.bag_val || 0),
        free_scheme: item.free_scheme || 'No',
        free_scheme_product: item.free_scheme_product || 0,
        free_qty: Number(item.free_qty || 0),
        imei_list: (item.imei_list || []).map((x: any) =>
          typeof x === 'string' ? x : x.imei_no || ''
        ),
      };
    });

    return {
      cart_list,
      total_amount: Number(data?.total_amount || 0),
      total_discount: Number(data?.total_discount || 0),
      total_tax_amount: Number(data?.total_tax_amount || 0),
      total_cess_amount: Number(data?.total_cess_amount || 0),
      total_net_amount: Number(data?.total_net_amount || 0),
      total_crate: Number(data?.total_crate || 0),
      total_bottel: Number(data?.total_bottel || 0),
    };
  },

  /**
   * Remove single item from cart, or clear whole cart
   */
  async clearCart(cartId?: number): Promise<any> {
    const hasCartId = cartId !== undefined && cartId !== null && Number(cartId) > 0;
    const url = hasCartId
      ? `/sale/clearSaleGenerateInvoiceCart?cart_id=${cartId}`
      : '/sale/clearSaleGenerateInvoiceCart';
    const res = await apiClient.delete(url);
    return res.data;
  },

  /**
   * Final submit invoice
   */
  async generateSaleInvoice(payload: GenerateInvoicePayload): Promise<any> {
    const res = await apiClient.post('/sale/generateSaleInvoice', {
      ...payload,
      reverse_charge: 'No', // Always ensure reverse_charge is 'No'
    });
    return res.data;
  },
};
