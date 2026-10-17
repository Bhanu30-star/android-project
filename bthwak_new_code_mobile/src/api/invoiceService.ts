import { apiClient } from './client';
import { BillType, DiscountType } from '@/features/invoice/calc';

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
  total_unit: number;
  sale_price: number;
  primary_value?: string;
  bag_name?: string;
}

export interface ApiProductItem {
  product_id: number;
  product_name: string;
  product_code?: string;
  product_type: string; // 'Standard' | 'FMCG' | 'Serial No' | 'Service'
  mrp_price: number;
  product_price_inc: number;
  product_price_exc: number;
  product_dealer_price: number;
  invoice_bill_type?: string; // 'Inclusive' | 'Exclusive'
  new_quantity: number; // Stock in warehouse
  maintain_inventory?: 'Yes' | 'No';
  product_gst: number;
  product_cess?: number;
  bagjson_detail?: BagDetail[];
  serial_type?: string;
}

export interface CartLineItem {
  cart_id: number;
  product_id: number;
  product_name: string;
  product_code?: string;
  quantity: number;
  price: number;
  mrp_price: number;
  bill_type: BillType;
  disc_type: DiscountType;
  discount: number;
  product_gst: number;
  product_cess: number;
  total_amount: number; // line total without discount/tax
  tax_amount: number;
  cess_amount: number;
  net_amount: number;
  crate_val?: number;
  bottle_val?: number;
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
  reverse_charge: 'Yes' | 'No';
  service_type: 'Manual' | 'Courier';
  total_crate?: number;
  total_bottle?: number;
  purchase_orderno?: string;
  shipping_address?: string;
  broker_no?: string;
  docket_no?: string;
  courier_agency?: string;
  courier_date?: string;
  remark?: string;
  tot_amt_val: number;
  labour_charges?: number | string;
  freight_charges?: number | string;
  other_expence_charges?: number | string;
  tcs_applicable?: 'Yes' | 'No';
  tcs_amount?: number | string;
  total_discount: number;
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
  cheque_amt?: number;
  credit_days?: number;
}

export const invoiceService = {
  /**
   * Fetch retailers list
   */
  async fetchRetailerParties(search = ''): Promise<RetailerParty[]> {
    const res = await apiClient.get<{
      status: number;
      data: Array<{
        party_id?: number;
        partyId?: number;
        party_name?: string;
        partyName?: string;
        phone_no?: string;
        partyPhone?: string;
        gst_no?: string;
        address?: string;
      }>;
    }>('/sale/fetchRetailerparty', {
      params: { search },
    });

    const list = res.data?.data || [];
    return list.map((item) => ({
      partyId: item.partyId || item.party_id || 0,
      partyName: item.partyName || item.party_name || 'Unknown Party',
      partyPhone: item.partyPhone || item.phone_no || '',
      partyGst: item.gst_no || '',
      partyAddress: item.address || '',
    }));
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
        data: Array<{
          id?: string | number;
          fsc_id?: string | number;
          name?: string;
          fsc_name?: string;
          phone?: string;
        }>;
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
   * Search / paginate products catalog
   */
  async fetchProductCatalog(
    query = '',
    lastId = 0,
    searchSource = 'admin'
  ): Promise<{ products: ApiProductItem[]; lastId: number; hasMore: boolean }> {
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

    const products = res.data?.data?.cart_list || [];
    const newLastId = res.data?.data?.last_id || 0;
    return {
      products,
      lastId: newLastId,
      hasMore: products.length >= 20,
    };
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
   * Fetch server cart detail and totals
   */
  async getCartDetail(reverseCharge: 'Yes' | 'No' = 'No'): Promise<CartDetailResponse> {
    const res = await apiClient.get<{
      status: number;
      data: CartDetailResponse;
    }>('/sale/getGenerateInvoiceCartDetail', {
      params: { reverse_charge: reverseCharge },
    });

    const data = res.data?.data;
    return {
      cart_list: data?.cart_list || [],
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
    const url = cartId !== undefined
      ? `/sale/clearSaleGenerateInvoiceCart?cart_id=${cartId}`
      : '/sale/clearSaleGenerateInvoiceCart';
    const res = await apiClient.delete(url);
    return res.data;
  },

  /**
   * Final submit invoice
   */
  async generateSaleInvoice(payload: GenerateInvoicePayload): Promise<any> {
    const res = await apiClient.post('/sale/generateSaleInvoice', payload);
    return res.data;
  },
};
