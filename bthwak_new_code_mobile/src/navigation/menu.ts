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

export const DRAWER_MENU_SECTIONS: MenuSectionConfig[] = [
  // 1. TOP GROUP (No section label)
  {
    id: 'top-group',
    items: [
      {
        id: 'business-detail',
        label: 'Business detail',
        icon: 'file-text',
        route: '/businessdetail',
      },
      {
        id: 'master',
        label: 'Master',
        icon: 'database',
        children: [
          { id: 'master-customer', label: 'Sale Executive', route: '/master/customer' },
          { id: 'master-buyer-seller', label: 'Buyer/Seller', route: '/master/buyer_seller' },
          { id: 'master-beat', label: 'Beat List', route: '/master/beat' },
          { id: 'master-bulk-retailer', label: 'Bulk Retailer Movement', route: '/master/bulkretailer' },
          { id: 'master-credit-note', label: 'Credit Note Detail', route: '/master/Creditnote' },
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
        ],
      },
      {
        id: 'product',
        label: 'Product',
        icon: 'box',
        children: [
          { id: 'product-add', label: 'Product Master', route: '/product/add' },
          { id: 'product-payout', label: 'Add Payout', route: '/add_payout' },
          { id: 'product-waste', label: 'Waste/Damage Stock', route: '/product/waste_damage' },
        ],
      },
    ],
  },

  // 2. STOCK REQUEST SECTION
  {
    id: 'stock-request-section',
    sectionLabel: 'STOCK REQUEST',
    items: [
      {
        id: 'request-master',
        label: 'Request master',
        icon: 'clipboard',
        children: [
          { id: 'req-pending', label: 'Pending Request', route: '/pending_request' },
          { id: 'req-transferred', label: 'Stock Transferred', route: '/stock_transfer' },
          { id: 'req-cancelled', label: 'Cancelled Request', route: '/cancelled_request' },
          { id: 'req-executive-transferred', label: 'Executive Stock Transferred', route: '/Executive_stocktransfer' },
        ],
      },
    ],
  },

  // 3. SALE SECTION
  {
    id: 'sale-section',
    sectionLabel: 'SALE',
    items: [
      {
        id: 'generate-invoice',
        label: 'Generate invoice',
        icon: 'file-text',
        route: '/generate-invoice',
      },
      {
        id: 'generate-receipt',
        label: 'Generate receipt',
        icon: 'bookmark',
        route: '/generate-receipt',
      },
      {
        id: 'invoice-group',
        label: 'Invoice',
        icon: 'file',
        children: [
          { id: 'inv-all', label: 'All Invoices', route: '/invoice' },
          { id: 'inv-multi', label: 'Multi Recharge', route: '/multi_recharge' },
          { id: 'inv-eway', label: 'Generate E-Way', route: '/ewaybill' },
          { id: 'inv-payout', label: 'Payout Invoice', route: '/payout_invoice' },
          { id: 'inv-return', label: 'Sales Return', route: '/sale_return' },
        ],
      },
      {
        id: 'receipt-book',
        label: 'Receipt book',
        icon: 'book-open',
        route: '/receipt-book',
      },
    ],
  },

  // 4. DSR SECTION
  {
    id: 'dsr-section',
    sectionLabel: 'DSR',
    items: [
      {
        id: 'collection-dsr',
        label: 'Collection DSR',
        icon: 'dollar-sign',
        route: '/collection_dsr',
      },
      {
        id: 'stock-dsr',
        label: 'Stock DSR',
        icon: 'layers',
        route: '/stockdsr',
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: 'bar-chart-2',
        route: '/reports',
      },
    ],
  },
];
