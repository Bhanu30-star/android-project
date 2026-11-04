import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Theme } from '@/theme';
import { DashboardData } from '@/api/dashboard';
import { formatCurrency } from '@/utils/dateUtils';
import { formatIndianCurrency } from '@/utils/formatters';

export interface ReportItemDef {
  id: string;
  label: string;
  fullName: string;
  description: string;
  iconName: string;
  iconType: 'feather' | 'ionicons' | 'mci';
  iconColor: string;
  iconBg: string;
  category: string;
  route?: string;
  badge?: string;
}

export interface ReportCategoryDef {
  key: string;
  title: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  filterKey: string;
  items: ReportItemDef[];
}

interface ReportsViewProps {
  data: DashboardData | null;
  currency?: string;
  onOpenReport?: (reportName: string) => void;
  onOpenDrawer?: () => void;
  onOpenSettings?: () => void;
}

export const REPORT_CATEGORIES: ReportCategoryDef[] = [
  {
    key: 'sale',
    title: "REPORT'S - SALE",
    accentColor: '#FF6E00',
    badgeBg: '#FFF2E5',
    badgeText: '#FF6E00',
    filterKey: 'Sale',
    items: [
      {
        id: 'sales_register',
        label: 'Sales Register',
        fullName: 'Sales Register',
        description: 'Item-wise sales invoices, tax breakdown & customer ledger summaries.',
        iconName: 'cart-outline',
        iconType: 'ionicons',
        iconColor: '#FF6E00',
        iconBg: '#FFF2E5',
        category: 'SALE',
        route: '/sales-register',
      },
      {
        id: 'sales_cancel_edit',
        label: 'Cancel / Edit',
        fullName: 'Cancel / Edit History Register',
        description: 'Audit log of modified, revised, or cancelled sales invoices.',
        iconName: 'ban',
        iconType: 'ionicons',
        iconColor: '#DC2626',
        iconBg: '#FEF2F2',
        category: 'SALE',
      },
      {
        id: 'sales_receipt_cancel',
        label: 'Receipt Cancel',
        fullName: 'Sale Receipt Cancel Register',
        description: 'Detailed log of voided payment receipts and reversed vouchers.',
        iconName: 'close-circle-outline',
        iconType: 'ionicons',
        iconColor: '#D97706',
        iconBg: '#FFFBEB',
        category: 'SALE',
      },
      {
        id: 'sale_return',
        label: 'Sale Return',
        fullName: 'Sale Return Register',
        description: 'Customer credit notes, returned inventory and refund transactions.',
        iconName: 'arrow-undo-outline',
        iconType: 'ionicons',
        iconColor: '#7C3AED',
        iconBg: '#F5F3FF',
        category: 'SALE',
      },
      {
        id: 'receipt_register',
        label: 'Receipt Register',
        fullName: 'Sales Receipt Register',
        description: 'Customer credit settlements, counter receipts, payment modes and bank deposits.',
        iconName: 'book-outline',
        iconType: 'ionicons',
        iconColor: '#059669',
        iconBg: '#ECFDF5',
        category: 'SALE',
        route: '/receipt-book',
      },
      {
        id: 'money_report',
        label: 'Money Report',
        fullName: 'Money Report',
        description: 'Daily cash collections, bank inflows, and settlement balances.',
        iconName: 'cash-outline',
        iconType: 'ionicons',
        iconColor: '#16A34A',
        iconBg: '#F0FDF4',
        category: 'SALE',
      },
      {
        id: 'sales_executive',
        label: 'Sales Executive',
        fullName: 'Sales Executive Sale Summary',
        description: 'Field representative revenue generation, order metrics and target tracking.',
        iconName: 'bar-chart-outline',
        iconType: 'ionicons',
        iconColor: '#4F46E5',
        iconBg: '#EEF2FF',
        category: 'SALE',
      },
      {
        id: 'advance_payment',
        label: 'Advance Payment',
        fullName: 'Advance Payment Detail',
        description: 'Customer advance deposits, unadjusted receipts and pending allocations.',
        iconName: 'wallet-outline',
        iconType: 'ionicons',
        iconColor: '#0284C7',
        iconBg: '#E0F2FE',
        category: 'SALE',
      },
      {
        id: 'cheque_txn',
        label: 'Cheque Detail',
        fullName: 'Cheque Transaction Detail',
        description: 'Clearing status, bouncing logs, and deposited cheques breakdown.',
        iconName: 'card-outline',
        iconType: 'ionicons',
        iconColor: '#0D9488',
        iconBg: '#F0FDFA',
        category: 'SALE',
      },
    ],
  },
  {
    key: 'stocks',
    title: "REPORT'S - STOCKS",
    accentColor: '#0D9488',
    badgeBg: '#F0FDFA',
    badgeText: '#0D9488',
    filterKey: 'Stock',
    items: [
      {
        id: 'dtr_txn',
        label: 'DTR TXN',
        fullName: 'DTR TXN Register',
        description: 'Daily Transaction Register for raw stock intake and daily consumption.',
        iconName: 'list-outline',
        iconType: 'ionicons',
        iconColor: '#4F46E5',
        iconBg: '#EEF2FF',
        category: 'STOCKS',
      },
      {
        id: 'distributor_stock',
        label: 'Distributor Stock',
        fullName: 'Distributor Stock Register',
        description: 'Current on-hand warehouse stock balances and valuation summary.',
        iconName: 'grid-outline',
        iconType: 'ionicons',
        iconColor: '#0D9488',
        iconBg: '#F0FDFA',
        category: 'STOCKS',
      },
      {
        id: 'stock_transfer',
        label: 'Stock Transfer',
        fullName: 'Stock Transfer Register',
        description: 'Inter-warehouse transfers, godown shifts and transit items.',
        iconName: 'swap-horizontal-outline',
        iconType: 'ionicons',
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
        category: 'STOCKS',
      },
      {
        id: 'stock_summary',
        label: 'Stock Summary',
        fullName: 'Stock Summary Register',
        description: 'Opening inventory, purchases, sales deductions, and closing stock.',
        iconName: 'archive-outline',
        iconType: 'ionicons',
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        category: 'STOCKS',
      },
      {
        id: 'stock_detail_exec',
        label: 'Exec Stock',
        fullName: 'Stock Details Executive Wise',
        description: 'Carried product inventory for field representatives & van sales.',
        iconName: 'person-outline',
        iconType: 'ionicons',
        iconColor: '#7C3AED',
        iconBg: '#F5F3FF',
        category: 'STOCKS',
      },
      {
        id: 'all_sales_stock',
        label: 'All Sales Stock',
        fullName: 'All Sales Executive Stock Report',
        description: 'Consolidated field stock allocation across all sales routes.',
        iconName: 'layers-outline',
        iconType: 'ionicons',
        iconColor: '#0891B2',
        iconBg: '#ECFEFF',
        category: 'STOCKS',
      },
      {
        id: 'autofill_stock',
        label: 'Autofill Stock',
        fullName: 'Autofill Stock Transfer',
        description: 'Automated reorder triggers and replenishment transfers.',
        iconName: 'sync-outline',
        iconType: 'ionicons',
        iconColor: '#10B981',
        iconBg: '#ECFDF5',
        category: 'STOCKS',
      },
      {
        id: 'damage_stock_cat',
        label: 'Damage Stock',
        fullName: 'Damage & Waste Stock Register',
        description: 'Damaged, broken, expired, or non-salable inventory write-offs.',
        iconName: 'warning-outline',
        iconType: 'ionicons',
        iconColor: '#DC2626',
        iconBg: '#FEF2F2',
        category: 'STOCKS',
      },
    ],
  },
  {
    key: 'retailer',
    title: "REPORT'S - RETAILER",
    accentColor: '#16A34A',
    badgeBg: '#F0FDF4',
    badgeText: '#16A34A',
    filterKey: 'Party',
    items: [
      {
        id: 'retailer_tds',
        label: 'Retailer TDS',
        fullName: 'Retailer TDS Report',
        description: 'Tax Deducted at Source statements for registered retailer accounts.',
        iconName: 'percent',
        iconType: 'feather',
        iconColor: '#7C3AED',
        iconBg: '#F5F3FF',
        category: 'RETAILER',
      },
      {
        id: 'retailer_credit',
        label: 'Retailer Credit',
        fullName: 'Retailer Credit Book',
        description: 'Outstanding market credits, aging breakdown and payment dues.',
        iconName: 'book-outline',
        iconType: 'ionicons',
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
        category: 'RETAILER',
      },
      {
        id: 'retailer_ledger',
        label: 'Retailer Ledger',
        fullName: 'Retailer Ledger Book',
        description: 'Complete double-entry accounting ledger for individual retail parties.',
        iconName: 'library-outline',
        iconType: 'ionicons',
        iconColor: '#0D9488',
        iconBg: '#F0FDFA',
        category: 'RETAILER',
      },
      {
        id: 'retailer_monthly',
        label: 'Retailer Monthly',
        fullName: 'Retailer Monthly Sales Register',
        description: 'Monthly buying trends and purchase frequency analysis per retailer.',
        iconName: 'calendar-outline',
        iconType: 'ionicons',
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        category: 'RETAILER',
      },
      {
        id: 'item_sale_party',
        label: 'Item Sales',
        fullName: 'Item Sale-Purchase Report',
        description: 'Item-wise consumption and margin analysis broken down by retailer.',
        iconName: 'cube-outline',
        iconType: 'ionicons',
        iconColor: '#0284C7',
        iconBg: '#E0F2FE',
        category: 'RETAILER',
      },
      {
        id: 'retailer_sales_exec',
        label: 'Retailer / Exec',
        fullName: 'Retailer / Sales Executive Register',
        description: 'Sales representative mapping to customer beats and visit frequency.',
        iconName: 'people-outline',
        iconType: 'ionicons',
        iconColor: '#4F46E5',
        iconBg: '#EEF2FF',
        category: 'RETAILER',
      },
      {
        id: 'retailer_returnable',
        label: 'Returnable Stock',
        fullName: 'Retailer Returnable Product Report',
        description: 'Empty crates, containers, and returnable packaging materials tracking.',
        iconName: 'refresh-outline',
        iconType: 'ionicons',
        iconColor: '#10B981',
        iconBg: '#ECFDF5',
        category: 'RETAILER',
      },
      {
        id: 'free_scheme',
        label: 'Free Scheme',
        fullName: 'Free Scheme Sales Register',
        description: 'Free units, promotional discounts, and trade loyalty scheme claims.',
        iconName: 'gift-outline',
        iconType: 'ionicons',
        iconColor: '#E11D48',
        iconBg: '#FFE4E6',
        category: 'RETAILER',
      },
    ],
  },
  {
    key: 'purchase',
    title: "REPORT'S - PURCHASE",
    accentColor: '#2563EB',
    badgeBg: '#EFF6FF',
    badgeText: '#2563EB',
    filterKey: 'Purchase',
    items: [
      {
        id: 'purchase_register',
        label: 'Purchase Register',
        fullName: 'Purchase Register',
        description: 'Inbound supplier bills, inward tax invoices and purchases summary.',
        iconName: 'clipboard-outline',
        iconType: 'ionicons',
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
        category: 'PURCHASE',
      },
      {
        id: 'purchase_cancel',
        label: 'Purchase Cancel',
        fullName: 'Purchase Cancel Register',
        description: 'Cancelled supplier purchase orders and rejected inward materials.',
        iconName: 'ban',
        iconType: 'ionicons',
        iconColor: '#DC2626',
        iconBg: '#FEF2F2',
        category: 'PURCHASE',
      },
      {
        id: 'purchase_credit',
        label: 'Purchase Credit',
        fullName: 'Purchase Credit Summary',
        description: 'Vendor payables, credit limits, and upcoming settlement deadlines.',
        iconName: 'card-outline',
        iconType: 'ionicons',
        iconColor: '#10B981',
        iconBg: '#ECFDF5',
        category: 'PURCHASE',
        route: '/purchase-credit',
      },
      {
        id: 'purchase_receipt',
        label: 'Purchase Receipt',
        fullName: 'Purchase Receipt Summary',
        description: 'Goods receipt notes (GRN) and payment receipts issued to suppliers.',
        iconName: 'receipt-outline',
        iconType: 'ionicons',
        iconColor: '#0D9488',
        iconBg: '#F0FDFA',
        category: 'PURCHASE',
      },
      {
        id: 'purchase_ledger',
        label: 'Purchase Ledger',
        fullName: 'Purchase Ledger Book',
        description: 'Vendor double-entry account ledger with balance carryforwards.',
        iconName: 'book-outline',
        iconType: 'ionicons',
        iconColor: '#4F46E5',
        iconBg: '#EEF2FF',
        category: 'PURCHASE',
      },
      {
        id: 'purchase_tds',
        label: 'Purchase TDS',
        fullName: 'Purchase TDS Register',
        description: 'Section 194Q TDS deductions from wholesale supplier payments.',
        iconName: 'percent',
        iconType: 'feather',
        iconColor: '#7C3AED',
        iconBg: '#F5F3FF',
        category: 'PURCHASE',
      },
      {
        id: 'purchase_advance',
        label: 'Purchase Advance',
        fullName: 'Purchase Advance Txn Detail',
        description: 'Advance payments remitted to suppliers for upcoming consignments.',
        iconName: 'arrow-up',
        iconType: 'feather',
        iconColor: '#EA580C',
        iconBg: '#FFF7ED',
        category: 'PURCHASE',
      },
    ],
  },
  {
    key: 'miscellaneous',
    title: "REPORT'S - MISCELLANEOUS",
    accentColor: '#8B5CF6',
    badgeBg: '#F5F3FF',
    badgeText: '#8B5CF6',
    filterKey: 'Miscellaneous',
    items: [
      {
        id: 'damage_stock_misc',
        label: 'Damage Stock',
        fullName: 'Damage Stock Register',
        description: 'Comprehensive scrap, leakage, and damaged product records.',
        iconName: 'alert-triangle',
        iconType: 'feather',
        iconColor: '#DC2626',
        iconBg: '#FEF2F2',
        category: 'MISCELLANEOUS',
      },
      {
        id: 'receipt_payment_mode',
        label: 'Payment Modes',
        fullName: 'Receipt Payment Mode Detail',
        description: 'Split between UPI, Cash, Cheque, NEFT/RTGS, and Card collections.',
        iconName: 'card-outline',
        iconType: 'ionicons',
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
        category: 'MISCELLANEOUS',
      },
      {
        id: 'bulk_upload',
        label: 'Bulk Uploader',
        fullName: 'Bulk Uploader Register',
        description: 'Import logs for Excel party lists, price lists, and opening stocks.',
        iconName: 'upload-cloud',
        iconType: 'feather',
        iconColor: '#4F46E5',
        iconBg: '#EEF2FF',
        category: 'MISCELLANEOUS',
      },
      {
        id: 'serial_return',
        label: 'Serial Return',
        fullName: 'Serial No Return Report',
        description: 'Serialized product and warranty barcode returns history.',
        iconName: 'swap-horizontal-outline',
        iconType: 'ionicons',
        iconColor: '#7C3AED',
        iconBg: '#F5F3FF',
        category: 'MISCELLANEOUS',
      },
      {
        id: 'product_serial',
        label: 'Product Serial',
        fullName: 'Product Serial No Detail',
        description: 'Tracking barcodes, batch numbers, and expiry timeline data.',
        iconName: 'list-outline',
        iconType: 'ionicons',
        iconColor: '#0D9488',
        iconBg: '#F0FDFA',
        category: 'MISCELLANEOUS',
      },
      {
        id: 'same_gstin',
        label: 'Same GSTIN Bills',
        fullName: 'Same GSTIN-No Bills Detail',
        description: 'Consolidated invoices billed across branches sharing the same GSTIN.',
        iconName: 'document-text-outline',
        iconType: 'ionicons',
        iconColor: '#0891B2',
        iconBg: '#ECFEFF',
        category: 'MISCELLANEOUS',
      },
    ],
  },
  {
    key: 'cash_bank',
    title: "REPORT'S - CASH / BANK",
    accentColor: '#059669',
    badgeBg: '#ECFDF5',
    badgeText: '#059669',
    filterKey: 'Cash',
    items: [
      {
        id: 'cash_in_hand',
        label: 'Cash in Hand',
        fullName: 'Cash In Hand Register',
        description: 'Physical vault cash tally, petty cash balances and denomination notes.',
        iconName: 'wallet-outline',
        iconType: 'ionicons',
        iconColor: '#16A34A',
        iconBg: '#ECFDF5',
        category: 'CASH / BANK',
      },
      {
        id: 'other_cash',
        label: 'Other Cash Txn',
        fullName: 'Other Cash Txn Master',
        description: 'Internal cash transfers, partner drawings, and miscellaneous receipts.',
        iconName: 'cash-outline',
        iconType: 'ionicons',
        iconColor: '#0D9488',
        iconBg: '#F0FDFA',
        category: 'CASH / BANK',
      },
      {
        id: 'cash_at_bank',
        label: 'Cash at Bank',
        fullName: 'Cash At Bank Register',
        description: 'Bank current account balances, reconciliation slips and statements.',
        iconName: 'business-outline',
        iconType: 'ionicons',
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
        category: 'CASH / BANK',
      },
      {
        id: 'bank_deposit',
        label: 'Bank Contra',
        fullName: 'Bank Deposit / Withdrawal',
        description: 'Cash deposit contra slips, ATM withdrawals and bank charges.',
        iconName: 'arrow-up-right',
        iconType: 'feather',
        iconColor: '#4F46E5',
        iconBg: '#EEF2FF',
        category: 'CASH / BANK',
      },
      {
        id: 'expense_master',
        label: 'Expense Master',
        fullName: 'Expense Master Register',
        description: 'Daily operational expenses: fuel, rent, office supplies, and meals.',
        iconName: 'document-text-outline',
        iconType: 'ionicons',
        iconColor: '#DC2626',
        iconBg: '#FEF2F2',
        category: 'CASH / BANK',
      },
      {
        id: 'expense_head',
        label: 'Expense Head',
        fullName: 'Expense Head Master',
        description: 'Category-wise spending analysis and monthly departmental overheads.',
        iconName: 'list-outline',
        iconType: 'ionicons',
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        category: 'CASH / BANK',
      },
    ],
  },
  {
    key: 'financial_year',
    title: "REPORT'S - FINANCIAL YEAR",
    accentColor: '#0284C7',
    badgeBg: '#E0F2FE',
    badgeText: '#0284C7',
    filterKey: 'Financial',
    items: [
      {
        id: 'sale_register_fy',
        label: 'Sale Register FY',
        fullName: 'Sale Register Financial Year',
        description: 'Audited yearly sales consolidation with HSN breakdown for CA review.',
        iconName: 'calendar-outline',
        iconType: 'ionicons',
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
        category: 'FINANCIAL YEAR',
      },
      {
        id: 'purchase_register_fy',
        label: 'Purchase Reg FY',
        fullName: 'Purchase Register FY',
        description: 'Annual input tax credit (ITC) statement and vendor procurement summary.',
        iconName: 'cart-outline',
        iconType: 'ionicons',
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        category: 'FINANCIAL YEAR',
      },
      {
        id: 'money_report_fy',
        label: 'Money Report FY',
        fullName: 'Money Report FY',
        description: 'Annual cash flow statement, bank reconciliations and net liquidity.',
        iconName: 'cash-outline',
        iconType: 'ionicons',
        iconColor: '#10B981',
        iconBg: '#ECFDF5',
        category: 'FINANCIAL YEAR',
      },
      {
        id: 'challan_register_fy',
        label: 'Challan Reg FY',
        fullName: 'Challan Register FY',
        description: 'Yearly delivery challans, job work dispatches, and material transfers.',
        iconName: 'document-text-outline',
        iconType: 'ionicons',
        iconColor: '#4F46E5',
        iconBg: '#EEF2FF',
        category: 'FINANCIAL YEAR',
      },
      {
        id: 'gst_summary_report',
        label: 'GST Summary',
        fullName: 'GST (GSTR-1 & 3B) Summary',
        description: 'Government compliance filing sheets ready for GST portal uploading.',
        iconName: 'shield-checkmark-outline',
        iconType: 'ionicons',
        iconColor: '#7C3AED',
        iconBg: '#F5F3FF',
        category: 'FINANCIAL YEAR',
      },
      {
        id: 'profit_loss_report',
        label: 'Profit & Loss',
        fullName: 'Profit & Loss Statement',
        description: 'Gross profit, EBITDA, operating margins and annual net earnings.',
        iconName: 'trending-up-outline',
        iconType: 'ionicons',
        iconColor: '#0D9488',
        iconBg: '#F0FDFA',
        category: 'FINANCIAL YEAR',
      },
    ],
  },
  {
    key: 'credits',
    title: "REPORT'S - CREDITS",
    accentColor: '#4F46E5',
    badgeBg: '#EEF2FF',
    badgeText: '#4F46E5',
    filterKey: 'Credits',
    items: [
      {
        id: 'dtr_credit',
        label: 'DTR Credit Book',
        fullName: 'DTR Credit Book',
        description: 'Distributor-level credit notes and credit transaction registers.',
        iconName: 'person-outline',
        iconType: 'ionicons',
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
        category: 'CREDITS',
      },
      {
        id: 'credit_summary_report',
        label: 'Credit Summary',
        fullName: 'Credit Summary Register',
        description: 'Total market outstanding, risk categorization, and aging buckets.',
        iconName: 'checkmark-done-circle-outline',
        iconType: 'ionicons',
        iconColor: '#10B981',
        iconBg: '#ECFDF5',
        category: 'CREDITS',
      },
      {
        id: 'exec_outstanding_report',
        label: 'Executive Dues',
        fullName: 'Executive Outstanding Report',
        description: 'Field representative route-wise market dues and recovery targets.',
        iconName: 'time-outline',
        iconType: 'ionicons',
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        category: 'CREDITS',
      },
    ],
  },
  {
    key: 'attendance',
    title: "REPORT'S - ATTENDANCE & TEAMS",
    accentColor: '#E11D48',
    badgeBg: '#FFE4E6',
    badgeText: '#E11D48',
    filterKey: 'Attendance',
    items: [
      {
        id: 'exec_attendance',
        label: 'Exec Attendance',
        fullName: 'Sales Executive Attendance',
        description: 'Daily GPS check-in logs, market route visits, and call logs.',
        iconName: 'checkmark-circle-outline',
        iconType: 'ionicons',
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
        category: 'ATTENDANCE',
      },
      {
        id: 'shift_master',
        label: 'Shift Master',
        fullName: 'Shift Master Register',
        description: 'Working shift rosters, timing configurations and overtime tracking.',
        iconName: 'time-outline',
        iconType: 'ionicons',
        iconColor: '#0D9488',
        iconBg: '#F0FDFA',
        category: 'ATTENDANCE',
      },
      {
        id: 'leave_history',
        label: 'Leave History',
        fullName: 'Executive Leave History',
        description: 'Approved sick leaves, casual time-off, and holiday schedules.',
        iconName: 'calendar-outline',
        iconType: 'ionicons',
        iconColor: '#7C3AED',
        iconBg: '#F5F3FF',
        category: 'ATTENDANCE',
      },
      {
        id: 'material_transfer',
        label: 'Material Transfer',
        fullName: 'Material Transfer Register',
        description: 'Assembly material transfers between shop floor and main stock godowns.',
        iconName: 'repeat-outline',
        iconType: 'ionicons',
        iconColor: '#4F46E5',
        iconBg: '#EEF2FF',
        category: 'ATTENDANCE',
      },
    ],
  },
];

const FILTER_PILLS = [
  { key: 'ALL', label: 'All' },
  { key: 'Cash', label: 'Cash' },
  { key: 'Party', label: 'Party' },
  { key: 'Stock', label: 'Stock' },
  { key: 'Bank', label: 'Bank' },
  { key: 'Sale', label: 'Sale' },
  { key: 'Purchase', label: 'Purchase' },
  { key: 'Financial', label: 'Financial' },
  { key: 'Credits', label: 'Credits' },
  { key: 'Attendance', label: 'Attendance' },
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  data,
  currency = '₹',
  onOpenReport,
  onOpenDrawer,
  onOpenSettings,
}) => {
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Active Selected Report for Bottom Sheet Preview
  const [selectedReport, setSelectedReport] = useState<ReportItemDef | null>(null);
  const [selectedDatePreset, setSelectedDatePreset] = useState<'today' | 'week' | 'month' | 'fy'>('month');
  const [isExporting, setIsExporting] = useState(false);

  // Filter Categories & Items based on active tab & search query
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return REPORT_CATEGORIES.map((cat) => {
      // 1. Check if category matches the pill filter
      if (activeFilter !== 'ALL') {
        if (activeFilter === 'Bank' && cat.key !== 'cash_bank') return null;
        if (activeFilter !== 'Bank' && cat.filterKey !== activeFilter && cat.key !== activeFilter.toLowerCase()) {
          return null;
        }
      }

      // 2. Filter items by search query
      let items = cat.items;
      if (query) {
        items = items.filter(
          (item) =>
            item.fullName.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            item.label.toLowerCase().includes(query)
        );
      }

      if (items.length === 0) return null;

      return {
        ...cat,
        items,
      };
    }).filter(Boolean) as ReportCategoryDef[];
  }, [searchQuery, activeFilter]);

  const totalMatchingReports = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  }, [filteredCategories]);

  // Handle Report Tap - Direct launch of all A-to-Z reports like Sale Register
  const handleItemPress = (item: ReportItemDef) => {
    if (item.id === 'sales_register') {
      router.push('/sales-register' as any);
      return;
    }
    if (item.id === 'receipt_register' || item.id === 'receipt_book') {
      router.push('/receipt-book' as any);
      return;
    }
    if (item.id === 'purchase_credit') {
      router.push('/purchase-credit' as any);
      return;
    }
    if (item.id === 'other_cash') {
      Alert.alert(
        'Other Cash Txn Master',
        'Other Cash Transaction Master is maintained and configured directly through the BTHAWK Web Portal.',
        [{ text: 'OK' }]
      );
      return;
    }
    if (item.route) {
      router.push(item.route as any);
      return;
    }

    // Direct open into Report Viewer register
    router.push({
      pathname: '/report-viewer',
      params: {
        id: item.id,
        title: item.fullName,
        category: item.category,
      },
    } as any);
  };

  // Execute Direct Navigation or Action
  const handleOpenReportLive = () => {
    if (!selectedReport) return;
    const item = selectedReport;
    setSelectedReport(null);
    handleItemPress(item);
  };

  // Simulate PDF Export
  const handleExportPdf = () => {
    if (!selectedReport) return;
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        'PDF Export Ready',
        `${selectedReport.fullName} has been compiled into a GST-compliant PDF format and is saved to downloads.`,
        [{ text: 'Open PDF', style: 'default' }, { text: 'Done', style: 'cancel' }]
      );
    }, 600);
  };

  // Simulate Excel Export
  const handleExportExcel = () => {
    if (!selectedReport) return;
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        'Excel (.xlsx) Export Complete',
        `${selectedReport.fullName} has been exported as Microsoft Excel spreadsheet (.xlsx) with all voucher formulas intact.`,
        [{ text: 'Open Sheet', style: 'default' }, { text: 'Done', style: 'cancel' }]
      );
    }, 600);
  };

  // WhatsApp Share
  const handleShareWhatsApp = async () => {
    if (!selectedReport) return;
    const textMsg = `*BTHAWK Report Statement*\nReport: *${selectedReport.fullName}*\nCategory: ${selectedReport.category}\nDate Filter: ${selectedDatePreset.toUpperCase()}\nGenerated via BTHAWK ERP.`;
    try {
      await Share.share({
        message: textMsg,
        title: selectedReport.fullName,
      });
    } catch {
      // Fallback
      const url = `whatsapp://send?text=${encodeURIComponent(textMsg)}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Share', 'WhatsApp is not installed on this device.');
      });
    }
  };

  // Render Icon Helper
  const renderItemIcon = (item: ReportItemDef) => {
    if (item.iconType === 'feather') {
      return <Feather name={item.iconName as any} size={22} color={item.iconColor} />;
    }
    if (item.iconType === 'mci') {
      return <MaterialCommunityIcons name={item.iconName as any} size={22} color={item.iconColor} />;
    }
    return <Ionicons name={item.iconName as any} size={22} color={item.iconColor} />;
  };

  return (
    <View style={styles.screenWrapper}>
      {/* 1. TOP BAR (STICKY / FIXED LOOK) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onOpenDrawer}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityLabel="Open navigation drawer"
          accessibilityRole="button"
        >
          <Feather name="menu" size={20} color="#0A2558" />
        </TouchableOpacity>

        <View style={styles.centerBrand}>
          <Text style={styles.brandTitle}>
            BTHAWK <Text style={styles.brandAccent}>+</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={onOpenSettings}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        >
          <Feather name="settings" size={19} color="#0A2558" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* 2. SEARCH BAR & VIEW TOGGLE */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={18} color="#5A6B87" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor="#8FA0B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.searchClearBtn}
              activeOpacity={0.7}
            >
              <Feather name="x" size={16} color="#5A6B87" />
            </TouchableOpacity>
          )}
        </View>

        {/* WEB STYLE / GRID TOGGLE BUTTON */}
        <TouchableOpacity
          style={styles.viewModeToggleBtn}
          onPress={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
          activeOpacity={0.8}
          accessibilityLabel={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
        >
          <Feather
            name={viewMode === 'grid' ? 'list' : 'grid'}
            size={18}
            color="#0047AB"
          />
        </TouchableOpacity>
      </View>

      {/* 3. HORIZONTAL FILTER PILLS */}
      <View style={styles.filterPillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {FILTER_PILLS.map((pill) => {
            const isActive = activeFilter === pill.key;
            return (
              <TouchableOpacity
                key={pill.key}
                onPress={() => setActiveFilter(pill.key)}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. MAIN SCROLLABLE REPORTS BODY */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* EXECUTIVE TREASURY & LIQUIDITY OVERVIEW */}
        <View style={styles.treasuryCard}>
          <View style={styles.treasuryTopRow}>
            <View>
              <Text style={styles.treasurySuperLabel}>TOTAL AVAILABLE LIQUIDITY</Text>
              <Text style={styles.treasuryTotalValue}>
                {formatIndianCurrency((data?.cashBalance ?? 0) + (data?.bankBalance ?? 0), currency)}
              </Text>
            </View>
            <View style={styles.treasuryLivePill}>
              <View style={styles.treasuryLiveDot} />
              <Text style={styles.treasuryLiveText}>ACTIVE BALANCE</Text>
            </View>
          </View>

          <View style={styles.treasuryDivider} />

          <View style={styles.treasuryAccountsRow}>
            {/* CASH IN HAND */}
            <View style={styles.treasurySubCard}>
              <View style={styles.treasurySubHeader}>
                <View style={[styles.treasuryIconWrap, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="wallet-outline" size={15} color="#059669" />
                </View>
                <Text style={styles.treasurySubTitle}>Cash in Hand</Text>
              </View>
              <Text style={[styles.treasurySubAmount, { color: '#059669' }]}>
                {formatIndianCurrency(data?.cashBalance ?? 0, currency)}
              </Text>
            </View>

            {/* BANK ACCOUNTS */}
            <View style={styles.treasurySubCard}>
              <View style={styles.treasurySubHeader}>
                <View style={[styles.treasuryIconWrap, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="business-outline" size={15} color="#0047AB" />
                </View>
                <Text style={styles.treasurySubTitle}>Bank Accounts</Text>
              </View>
              <Text style={[styles.treasurySubAmount, { color: '#0047AB' }]}>
                {formatIndianCurrency(data?.bankBalance ?? 0, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* SEARCH MATCHES INFO (IF SEARCHING) */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.searchSummaryRow}>
            <Text style={styles.searchSummaryText}>
              Showing <Text style={styles.searchSummaryCount}>{totalMatchingReports}</Text> reports matching "{searchQuery}"
            </Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.searchClearLink}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EMPTY STATE */}
        {filteredCategories.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="search" size={32} color="#8FA0B8" />
            </View>
            <Text style={styles.emptyStateTitle}>No Reports Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              We couldn't find any report matching "{searchQuery}". Try searching for GST, Sales, Cash, Stock, or Party.
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyResetBtnText}>Show All Reports</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CATEGORY SECTIONS LIST - ALL REPORTS DISPLAYED (SUPPORTS GRID & WEB-STYLE LIST) */}
        {filteredCategories.map((category) => (
          <View
            key={category.key}
            style={[
              styles.categoryCard,
              viewMode === 'list' && {
                borderLeftWidth: 4,
                borderLeftColor: category.accentColor,
              },
            ]}
          >
            {/* CATEGORY HEADER */}
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleGroup}>
                <Text
                  style={[
                    styles.categoryTitle,
                    viewMode === 'list' && { color: category.accentColor },
                  ]}
                >
                  {category.title}
                </Text>
                <View style={[styles.categoryBadge, { backgroundColor: category.badgeBg }]}>
                  <Text style={[styles.categoryBadgeText, { color: category.badgeText }]}>
                    {category.items.length} Reports
                  </Text>
                </View>
              </View>
            </View>

            {/* VIEW MODE: WEB-STYLE LIST */}
            {viewMode === 'list' ? (
              <View style={styles.reportListContainer}>
                {category.items.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.listItemRow, idx > 0 && styles.listItemBorder]}
                    activeOpacity={0.7}
                    onPress={() => handleItemPress(item)}
                    accessibilityLabel={item.fullName}
                  >
                    <View style={[styles.listItemIconWrap, { backgroundColor: item.iconBg }]}>
                      {renderItemIcon(item)}
                    </View>
                    <View style={styles.listItemTextGroup}>
                      <Text style={styles.listItemTitle}>{item.fullName}</Text>
                      <Text style={styles.listItemSub} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              /* VIEW MODE: 3-COLUMN RESPONSIVE GRID */
              <View style={styles.reportGrid}>
                {category.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.gridItem}
                    activeOpacity={0.7}
                    onPress={() => handleItemPress(item)}
                    accessibilityLabel={item.fullName}
                    accessibilityRole="button"
                  >
                    {/* CIRCULAR / SQUIRCLE ICON BADGE */}
                    <View style={[styles.itemIconBadge, { backgroundColor: item.iconBg }]}>
                      {renderItemIcon(item)}
                    </View>

                    {/* TWO-LINE CLEAN LABEL */}
                    <Text style={styles.itemLabel} numberOfLines={2} ellipsizeMode="tail">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* 5. REPORT ACTION & PREVIEW MODAL (BOTTOM SHEET) */}
      <Modal
        visible={!!selectedReport}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setSelectedReport(null)}
          />

          <View style={styles.modalSheet}>
            {/* DRAG HANDLE */}
            <View style={styles.sheetHandle} />

            {selectedReport && (
              <>
                {/* MODAL HEADER */}
                <View style={styles.modalHeaderRow}>
                  <View style={[styles.modalIconWrap, { backgroundColor: selectedReport.iconBg }]}>
                    {renderItemIcon(selectedReport)}
                  </View>

                  <View style={styles.modalHeaderInfo}>
                    <View style={styles.modalTagRow}>
                      <View style={styles.modalCategoryTag}>
                        <Text style={styles.modalCategoryTagText}>{selectedReport.category}</Text>
                      </View>
                      <View style={styles.modalGstPill}>
                        <Text style={styles.modalGstPillText}>GST COMPLIANT</Text>
                      </View>
                    </View>
                    <Text style={styles.modalTitle} numberOfLines={2}>
                      {selectedReport.fullName}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setSelectedReport(null)}
                    style={styles.modalCloseBtn}
                    activeOpacity={0.7}
                  >
                    <Feather name="x" size={20} color="#5A6B87" />
                  </TouchableOpacity>
                </View>

                {/* DESCRIPTION */}
                <Text style={styles.modalDescription}>{selectedReport.description}</Text>

                {/* DATE PRESET SELECTOR */}
                <Text style={styles.modalSectionHeading}>SELECT TIMEFRAME</Text>
                <View style={styles.dateChipsRow}>
                  {[
                    { key: 'today', label: 'Today' },
                    { key: 'week', label: 'This Week' },
                    { key: 'month', label: 'This Month' },
                    { key: 'fy', label: 'FY 2024-25' },
                  ].map((preset) => {
                    const isChipActive = selectedDatePreset === preset.key;
                    return (
                      <TouchableOpacity
                        key={preset.key}
                        style={[
                          styles.dateChip,
                          isChipActive ? styles.dateChipActive : styles.dateChipInactive,
                        ]}
                        onPress={() => setSelectedDatePreset(preset.key as any)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dateChipText,
                            isChipActive ? styles.dateChipTextActive : styles.dateChipTextInactive,
                          ]}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ACCOUNTING PATTERN SELECTOR (FROM WEB FRONTEND) */}
                <Text style={styles.modalSectionHeading}>ACCOUNTING EXPORT PATTERN</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.modalPatternScroll}
                >
                  {['MARG', 'BUSY', 'TALLY', 'TFD', 'SARAL', 'STD.INV', 'STD.ITEM'].map((pat, idx) => (
                    <View
                      key={pat}
                      style={[styles.modalPatternBadge, idx === 0 && styles.modalPatternBadgeActive]}
                    >
                      <Text
                        style={[styles.modalPatternText, idx === 0 && styles.modalPatternTextActive]}
                      >
                        {pat}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                {/* SUMMARY HIGHLIGHTS CARD */}
                <View style={styles.modalMetricsCard}>
                  <View style={styles.modalMetricCol}>
                    <Text style={styles.modalMetricLabel}>Format</Text>
                    <Text style={styles.modalMetricVal}>Summary & Itemised</Text>
                  </View>
                  <View style={styles.modalMetricDivider} />
                  <View style={styles.modalMetricCol}>
                    <Text style={styles.modalMetricLabel}>Sync Status</Text>
                    <Text style={[styles.modalMetricVal, { color: '#16A34A' }]}>Up to date</Text>
                  </View>
                </View>

                {/* PRIMARY ACTION BUTTON: VIEW LIVE REGISTER */}
                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  activeOpacity={0.85}
                  onPress={handleOpenReportLive}
                >
                  <Ionicons name="eye-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalPrimaryBtnText}>Open Live Register</Text>
                </TouchableOpacity>

                {/* SECONDARY ACTIONS: PDF / EXCEL / WHATSAPP */}
                <View style={styles.modalActionButtonsRow}>
                  <TouchableOpacity
                    style={styles.modalSecondaryBtn}
                    activeOpacity={0.8}
                    onPress={handleExportPdf}
                    disabled={isExporting}
                  >
                    <Feather name="file-text" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSecondaryBtnText}>PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalSecondaryBtn}
                    activeOpacity={0.8}
                    onPress={handleExportExcel}
                    disabled={isExporting}
                  >
                    <Feather name="download" size={16} color="#16A34A" style={{ marginRight: 6 }} />
                    <Text style={styles.modalSecondaryBtnText}>Excel (.xlsx)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSecondaryBtn, { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' }]}
                    activeOpacity={0.8}
                    onPress={handleShareWhatsApp}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#16A34A" style={{ marginRight: 6 }} />
                    <Text style={[styles.modalSecondaryBtnText, { color: '#16A34A' }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },

  // 1. TOP BAR STYLES
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6E00',
  },
  centerBrand: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: 0.5,
  },
  brandAccent: {
    color: '#FF6E00',
    fontWeight: '900',
  },

  // 2. SEARCH BAR & VIEW TOGGLE
  searchBarWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F8FD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  viewModeToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '500',
  },
  searchClearBtn: {
    padding: 4,
  },

  // 3. FILTER PILLS
  filterPillsContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#0047AB',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterPillInactive: {
    backgroundColor: '#F4F8FD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#5A6B87',
  },

  // 4. MAIN SCROLL CONTAINER
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110, // Generous padding to clear the bottom navigation bar
    gap: 14,
  },

  // EXECUTIVE TREASURY & LIQUIDITY CARD
  treasuryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  treasuryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  treasurySuperLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5A6B87',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  treasuryTotalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0E204E',
    letterSpacing: -0.4,
  },
  treasuryLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  treasuryLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  treasuryLiveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  treasuryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  treasuryAccountsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  treasurySubCard: {
    flex: 1,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  treasurySubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  treasuryIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  treasurySubTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5A6B87',
  },
  treasurySubAmount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // SEARCH SUMMARY ROW
  searchSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  searchSummaryText: {
    fontSize: 12,
    color: '#5A6B87',
  },
  searchSummaryCount: {
    fontWeight: '700',
    color: '#0047AB',
  },
  searchClearLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },

  // EMPTY STATE
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F4F8FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyResetBtn: {
    backgroundColor: '#0047AB',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  emptyResetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // CATEGORY CARD
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0E204E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  categoryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: 0.8,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // RESPONSIVE REPORT GRID (3 COLUMNS)
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginHorizontal: -2,
  },
  gridItem: {
    width: '33.33%', // 3 items per row for clean, unclipped display
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  itemIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E204E',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 2,
  },

  // WEB-STYLE LIST VIEW (INSPIRED BY FRONTEND)
  reportListContainer: {
    paddingVertical: 2,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  listItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  listItemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  listItemTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  listItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 2,
  },
  listItemSub: {
    fontSize: 11,
    color: '#5A6B87',
    lineHeight: 15,
  },


  // 5. MODAL BOTTOM SHEET
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 88, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalCategoryTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalCategoryTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  modalGstPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalGstPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 0.4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  modalDescription: {
    fontSize: 13,
    color: '#5A6B87',
    lineHeight: 19,
    marginBottom: 16,
  },

  modalSectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  dateChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipActive: {
    backgroundColor: '#0047AB',
  },
  dateChipInactive: {
    backgroundColor: '#F4F8FD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateChipTextInactive: {
    color: '#5A6B87',
  },

  modalMetricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  modalMetricCol: {
    flex: 1,
  },
  modalMetricLabel: {
    fontSize: 11,
    color: '#5A6B87',
    marginBottom: 2,
  },
  modalMetricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  modalMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },

  modalPatternScroll: {
    gap: 6,
    paddingVertical: 2,
    marginBottom: 14,
  },
  modalPatternBadge: {
    backgroundColor: '#F4F8FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  modalPatternBadgeActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  modalPatternText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
  },
  modalPatternTextActive: {
    color: '#FFFFFF',
  },

  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0047AB',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  modalSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E204E',
  },
});
