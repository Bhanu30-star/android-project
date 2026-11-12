import { Feather } from '@expo/vector-icons';

export interface SubMenuItemConfig {
  id: string;
  label: string;
  route: string;
  roles?: string[];
}

export interface MenuItemConfig {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route?: string;
  children?: SubMenuItemConfig[];
  roles?: string[];
}

export interface MenuSectionConfig {
  id: string;
  sectionLabel?: string;
  items: MenuItemConfig[];
}

export const DRAWER_MENU_ITEMS: MenuItemConfig[] = [
  {
    id: 'fse',
    label: 'FSE Live & Stock',
    icon: 'activity',
    route: '/fse',
  },
  {
    id: 'business-detail',
    label: 'Business details',
    icon: 'briefcase',
    route: '/businessdetail',
  },
  {
    id: 'master',
    label: 'Master',
    icon: 'triangle',
    children: [
      { id: 'master-executive', label: 'Sale Executive', route: '/master/customer' },
      { id: 'master-buyer-seller', label: 'Buyer and seller', route: '/master/buyer_seller' },
      { id: 'master-beat', label: 'Beat list', route: '/master/beat' },
      { id: 'master-bulk-retailer', label: 'Bulk Retailer Movement', route: '/master/bulkretailer' },
      { id: 'master-credit-note', label: 'Credit Note Detail', route: '/credit-note-detail' },
      { id: 'master-debit-note', label: 'Debit Note Detail', route: '/debit-note-detail' },
    ],
  },
  {
    id: 'purchase',
    label: 'Purchase',
    icon: 'shopping-cart',
    children: [
      { id: 'purchase-credit-list', label: 'Credit List', route: '/purchase/credit_list' },
      { id: 'purchase-add-stock', label: 'Add Stock', route: '/purchase/add_stock' },
      { id: 'purchase-debit-note', label: 'Generate Debit Note', route: '/purchase/generate_debit_note' },
      { id: 'purchase-debit-note-detail', label: 'Debit Note Detail', route: '/debit-note-detail' },
    ],
  },
  {
    id: 'product',
    label: 'Product',
    icon: 'shopping-cart',
    children: [
      { id: 'product-add', label: 'Product Master', route: '/product/add' },
      { id: 'product-payout', label: 'Add Payout', route: '/add_payout' },
      { id: 'product-waste', label: 'Waste/Damage Stock', route: '/product/waste_damage' },
    ],
  },
  {
    id: 'stock-request-master',
    label: 'Stock request master',
    icon: 'truck',
    children: [
      { id: 'req-pending', label: 'Pending Request', route: '/pending_request' },
      { id: 'req-transferred', label: 'Stock Transferred', route: '/stock_transfer' },
      { id: 'req-cancelled', label: 'Cancelled Request', route: '/cancelled_request' },
      { id: 'req-executive-transferred', label: 'Executive Stock Transferred', route: '/Executive_stocktransfer' },
    ],
  },
  {
    id: 'sale',
    label: 'Sale',
    icon: 'inbox',
    children: [
      { id: 'sale-generate-invoice', label: 'Generate invoice', route: '/generate-invoice' },
      { id: 'sale-generate-receipt', label: 'Generate receipt', route: '/generate-receipt' },
      { id: 'sale-receipt-register', label: 'Receipt Register', route: '/receipt-book' },
      { id: 'sale-register', label: 'Sale Register', route: '/sales-register' },
    ],
  },
  {
    id: 'invoice',
    label: 'Invoice',
    icon: 'file-text',
    children: [
      { id: 'inv-all', label: 'All Invoices', route: '/invoice' },
      { id: 'inv-multi', label: 'Multi Recharge', route: '/multi_recharge' },
      { id: 'inv-eway', label: 'Generate E-Way', route: '/ewaybill' },
      { id: 'inv-payout', label: 'Payout Invoice', route: '/payout_invoice' },
      { id: 'inv-return', label: 'Sales Return', route: '/sale-return' },
    ],
  },
  {
    id: 'receipt-book',
    label: 'Receipt Register',
    icon: 'book-open',
    route: '/receipt-book',
  },
  {
    id: 'dsr',
    label: 'DSR',
    icon: 'bar-chart-2',
    children: [
      { id: 'collection-dsr', label: 'Collection DSR', route: '/collection_dsr' },
      { id: 'stock-dsr', label: 'Stock DSR', route: '/stockdsr' },
      { id: 'reports', label: 'Reports', route: '/reports' },
    ],
  },
];

export const DRAWER_MENU_SECTIONS: MenuSectionConfig[] = [
  {
    id: 'all-items',
    items: DRAWER_MENU_ITEMS,
  },
];
