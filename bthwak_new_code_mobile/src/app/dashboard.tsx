import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { Colors, Typography, Shapes, Shadows } from '@/theme';
import {
  PresetKey,
  DateRange,
  getPresetDateRange,
} from '@/utils/dateUtils';
import {
  getDashboardDetailsApi,
  getFaqDetailsApi,
  DashboardData,
  FaqItem,
} from '@/api/dashboard';
import { formatIndianCurrency } from '@/utils/formatters';

// Redesigned UI Components
import { ScreenHeader } from '@/components/dashboard/ScreenHeader';
import { HeroBalanceCard } from '@/components/dashboard/HeroBalanceCard';
import { SectionHeader } from '@/components/dashboard/SectionHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { MiniStatTile } from '@/components/dashboard/MiniStatTile';
import { InfoListCard, InfoListRowItem } from '@/components/dashboard/InfoListCard';
import { BarChartCard } from '@/components/dashboard/BarChartCard';
import { ExpensesCard } from '@/components/dashboard/ExpensesCard';
import { SupportCard } from '@/components/dashboard/SupportCard';
import { FaqAccordion } from '@/components/dashboard/FaqAccordion';
import { PeriodSheet } from '@/components/dashboard/PeriodSheet';
import { SkeletonLoader } from '@/components/dashboard/SkeletonLoader';

// Navigation & Modals
import { AppTabBar } from '@/components/navigation/AppTabBar';
import { AppDrawer } from '@/components/navigation/AppDrawer';
import { PlusActionSheet } from '@/components/modals/PlusActionSheet';
import { MetricDetailModal, MetricDetailConfig } from '@/components/dashboard/MetricDetailModal';
import { InvoiceCreateSheet } from '@/components/modals/InvoiceCreateSheet';
import { PaymentReceiptSheet } from '@/components/modals/PaymentReceiptSheet';
import { AddPartySheet } from '@/components/modals/AddPartySheet';
import { QrScannerSheet } from '@/components/modals/QrScannerSheet';
import { ProfileModal } from '@/components/dashboard/ProfileModal';

// Alternative Tab Views
import { SalesView } from '@/components/dashboard/SalesView';
import { PartiesView } from '@/components/dashboard/PartiesView';
import { ReportsView } from '@/components/dashboard/ReportsView';
import { SettingsScreen } from '@/components/settings/SettingsScreen';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { activeTab, setActiveTab } = useApp();

  // Time Filter State
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('MTD');
  const [activeRange, setActiveRange] = useState<DateRange>(() =>
    getPresetDateRange('MTD')
  );

  // Data State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  // Sheet & Modal Visibility State
  const [showDrawer, setShowDrawer] = useState(false);
  const [showPeriodSheet, setShowPeriodSheet] = useState(false);
  const [showPlusSheet, setShowPlusSheet] = useState(false);
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showAddPartySheet, setShowAddPartySheet] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [detailModalConfig, setDetailModalConfig] =
    useState<MetricDetailConfig | null>(null);

  // Left-edge swipe to open drawer
  const edgePanResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => {
          return gesture.x0 < 40 && gesture.dx > 25 && Math.abs(gesture.dy) < 30;
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 40) {
            setShowDrawer(true);
          }
        },
      }),
    []
  );

  // Map preset key to display text
  const getPeriodLabel = (preset: PresetKey): string => {
    switch (preset) {
      case 'MTD':
        return 'This month';
      case 'FTD':
        return 'Today';
      case 'YESTERDAY':
        return 'Yesterday';
      case 'LAST_7':
        return 'Last 7 days';
      case 'LAST_30':
        return 'Last 30 days';
      case 'LAST_MONTH':
        return 'Last month';
      case 'YTD':
        return 'Year to date';
      default:
        return 'This month';
    }
  };

  // Fetch dashboard data
  const loadDashboard = useCallback(
    async (range: DateRange, isPull = false) => {
      if (isPull) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setApiError(null);

      try {
        const data = await getDashboardDetailsApi(range.startDate, range.endDate);
        setDashboardData(data);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to fetch dashboard metrics. Please check your connection.';
        setApiError(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Load FAQs
  const loadFaqs = useCallback(async () => {
    try {
      const items = await getFaqDetailsApi();
      setFaqs(items);
    } catch {
      // Graceful fallback to default FAQs
    }
  }, []);

  // Fetch on mount and period change
  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      try {
        const [dashResult, faqResult] = await Promise.allSettled([
          getDashboardDetailsApi(activeRange.startDate, activeRange.endDate),
          getFaqDetailsApi(),
        ]);

        if (!isCancelled) {
          if (dashResult.status === 'fulfilled') {
            setDashboardData(dashResult.value);
            setApiError(null);
          } else {
            const err = dashResult.reason;
            setApiError(
              err instanceof Error
                ? err.message
                : 'Unable to fetch dashboard metrics. Please check your connection.'
            );
          }

          if (faqResult.status === 'fulfilled') {
            setFaqs(faqResult.value);
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      isCancelled = true;
    };
  }, [activeRange]);

  // Handle Preset Selection
  const handleSelectPreset = (preset: PresetKey) => {
    setSelectedPreset(preset);
    const newRange = getPresetDateRange(preset);
    setActiveRange(newRange);
  };

  // Pull-to-refresh
  const handleRefresh = () => {
    loadDashboard(activeRange, true);
    loadFaqs();
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // Plus sheet action routing
  const handlePlusActionSelect = (action: 'invoice' | 'receipt' | 'purchase') => {
    if (action === 'invoice') {
      setShowInvoiceSheet(true);
    } else if (action === 'receipt') {
      setShowPaymentSheet(true);
    } else if (action === 'purchase') {
      setActiveTab('parties');
    }
  };

  // Drilldown modals for cards
  const handleOpenSaleDetail = () => {
    setDetailModalConfig({
      title: 'Gross Sales',
      subtitle: 'Turnover & outward billings summary',
      iconName: 'shopping-cart',
      iconColor: Colors.primary,
      iconBg: Colors.chips.sale.bg,
      items: [
        {
          label: 'Total Sale Revenue',
          value: dashboardData?.totalSale ?? 0,
          highlightColor: Colors.primary,
          subtext: 'Net turnover for selected period',
        },
        {
          label: 'Total Invoices Count',
          value: `${dashboardData?.totalInvoice ?? 0} Bills`,
          subtext: 'Number of GST invoices generated',
        },
      ],
      tips: 'Daily sales updates automatically reconcile with your GST portal ledger.',
    });
  };

  const handleOpenPurchaseDetail = () => {
    setDetailModalConfig({
      title: 'Total Purchases',
      subtitle: 'Stock procurement and vendor acquisitions',
      iconName: 'package',
      iconColor: Colors.chips.purchase.icon,
      iconBg: Colors.chips.purchase.bg,
      items: [
        {
          label: 'Gross Purchases',
          value: dashboardData?.totalPurchase ?? 0,
          highlightColor: Colors.chips.purchase.icon,
          subtext: 'Inventory goods purchased this period',
        },
      ],
      tips: 'Ensure all purchase invoices have matching vendor GSTIN records.',
    });
  };

  const handleOpenCashCollectedDetail = () => {
    setDetailModalConfig({
      title: 'Cash Collected',
      subtitle: 'Physical cash received across sales & receipts',
      iconName: 'dollar-sign',
      iconColor: Colors.chips.collected.icon,
      iconBg: Colors.chips.collected.bg,
      items: [
        {
          label: 'Cash Inflow',
          value: dashboardData?.cashCollected ?? 0,
          highlightColor: Colors.chips.collected.icon,
          subtext: 'Liquid cash physically received',
        },
        {
          label: 'Bank Collections',
          value: dashboardData?.bankCollected ?? 0,
          subtext: 'Direct transfers, UPI and cheque deposits',
        },
      ],
      tips: 'Deposit daily cash collections to maintain cash-in-hand thresholds.',
    });
  };

  const handleOpenToCollectDetail = () => {
    setDetailModalConfig({
      title: 'Outstanding Receivables',
      subtitle: 'Unsettled credit balances owed by parties',
      iconName: 'clock',
      iconColor: Colors.chips.toCollect.icon,
      iconBg: Colors.chips.toCollect.bg,
      items: [
        {
          label: 'Total To Collect',
          value: dashboardData?.outstandingCollected ?? dashboardData?.toCollect ?? 0,
          highlightColor: Colors.chips.toCollect.icon,
          subtext: 'Pending receivables from customers and retailers',
        },
      ],
      tips: 'Send automated WhatsApp reminders to clear pending credit bills faster.',
    });
  };

  const currencySymbol =
    dashboardData?.currency_value === 'INR'
      ? '₹'
      : dashboardData?.currency_value || '₹';

  // Invoices & payments row data
  const invoiceRows: InfoListRowItem[] = [
    {
      id: 'total-invoices',
      label: 'Total invoices',
      value: String(dashboardData?.totalInvoice ?? 0),
      onPress: handleOpenSaleDetail,
    },
    {
      id: 'credit-invoices',
      label: 'Credit invoices',
      value: String(dashboardData?.totalCreditInvoice ?? 0),
      onPress: handleOpenSaleDetail,
    },
    {
      id: 'bank-collected',
      label: 'Bank collected',
      value: formatIndianCurrency(dashboardData?.bankCollected ?? 0, currencySymbol),
      onPress: handleOpenCashCollectedDetail,
    },
    {
      id: 'to-pay',
      label: 'To pay',
      value: formatIndianCurrency(
        dashboardData?.outstandingPay ?? dashboardData?.toPay ?? 0,
        currencySymbol
      ),
      onPress: handleOpenPurchaseDetail,
    },
  ];

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
      {...edgePanResponder.panHandlers}
    >
      {/* 1. DASHBOARD INSIGHTS SCREEN */}
      {activeTab === 'dashboard' && (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: Shapes.tabBarHeight + Math.max(insets.bottom, 12) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* HEADER ROW & TITLE ROW */}
          <ScreenHeader
            onPressHamburger={() => setShowDrawer(true)}
            onPressNotification={() =>
              Alert.alert(
                'Notifications',
                'Your business compliance and GST reporting are up to date.'
              )
            }
            onPressProfile={() => setShowProfileModal(true)}
            selectedPeriodLabel={getPeriodLabel(selectedPreset)}
            onPressPeriod={() => setShowPeriodSheet(true)}
          />

          {/* ERROR CARD WITH FRIENDLY RETRY */}
          {apiError && (
            <View style={styles.errorCard}>
              <View style={styles.errorIconWrap}>
                <Feather name="alert-circle" size={20} color={Colors.error} />
              </View>
              <View style={styles.errorTextWrap}>
                <Text style={styles.errorTitle}>Unable to load insights</Text>
                <Text style={styles.errorSub} numberOfLines={2}>
                  {apiError}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadDashboard(activeRange)}
                activeOpacity={0.8}
                accessibilityLabel="Retry loading data"
                accessibilityRole="button"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* SKELETON LOADER OR REAL CONTENT */}
          {isLoading && !dashboardData ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* HERO BALANCE CARD */}
              <HeroBalanceCard
                cashBalance={dashboardData?.cashBalance ?? -84120}
                bankBalance={dashboardData?.bankBalance ?? 0}
                expensesThisMonth={dashboardData?.expenseAmt ?? 0}
                onPressCash={handleOpenCashCollectedDetail}
                onPressBank={handleOpenCashCollectedDetail}
                onPressExpense={() => {
                  setDetailModalConfig({
                    title: 'Operating Expenses',
                    subtitle: 'Business, operational, and office expenditures',
                    iconName: 'trending-down',
                    iconColor: '#DC2626',
                    iconBg: '#FEF2F2',
                    items: [
                      {
                        label: 'Total Expenses This Month',
                        value: dashboardData?.expenseAmt ?? 0,
                        highlightColor: '#DC2626',
                        subtext: 'Operational and miscellaneous costs',
                      },
                    ],
                    tips: 'Record all fuel and conveyance vouchers to claim tax deductions.',
                  });
                }}
              />

              {/* OVERVIEW SECTION (2x2 STAT CARDS) */}
              <SectionHeader
                title="Overview"
                actionText="See all"
                onPressAction={handleOpenSaleDetail}
              />

              <View style={styles.overviewGrid}>
                {/* Row 1 */}
                <View style={styles.gridRow}>
                  <StatCard
                    label="Total sale"
                    value={formatIndianCurrency(dashboardData?.totalSale ?? 0, currencySymbol)}
                    iconName="shopping-cart"
                    chipBg={Colors.chips.sale.bg}
                    chipIconColor={Colors.chips.sale.icon}
                    valueColor={Colors.chips.sale.value}
                    onPress={handleOpenSaleDetail}
                  />
                  <StatCard
                    label="Total purchase"
                    value={formatIndianCurrency(dashboardData?.totalPurchase ?? 5000, currencySymbol)}
                    iconName="package"
                    chipBg={Colors.chips.purchase.bg}
                    chipIconColor={Colors.chips.purchase.icon}
                    valueColor={Colors.chips.purchase.value}
                    onPress={handleOpenPurchaseDetail}
                  />
                </View>

                {/* Row 2 */}
                <View style={styles.gridRow}>
                  <StatCard
                    label="Cash collected"
                    value={formatIndianCurrency(dashboardData?.cashCollected ?? 113020, currencySymbol)}
                    isBanknote={true}
                    chipBg={Colors.chips.collected.bg}
                    chipIconColor={Colors.chips.collected.icon}
                    valueColor={Colors.chips.collected.value}
                    onPress={handleOpenCashCollectedDetail}
                  />
                  <StatCard
                    label="To collect"
                    value={formatIndianCurrency(
                      dashboardData?.outstandingCollected ?? dashboardData?.toCollect ?? 5000,
                      currencySymbol
                    )}
                    iconName="clock"
                    chipBg={Colors.chips.toCollect.bg}
                    chipIconColor={Colors.chips.toCollect.icon}
                    valueColor={Colors.chips.toCollect.value}
                    onPress={handleOpenToCollectDetail}
                  />
                </View>
              </View>

              {/* INVOICES & PAYMENTS CARD */}
              <InfoListCard
                title="Invoices & payments"
                badge="MTD"
                items={invoiceRows}
              />

              {/* FIELD & STOCK SECTION */}
              <SectionHeader title="Field & stock" />
              <View style={styles.fieldStockRow}>
                <MiniStatTile
                  label="FSE"
                  value={dashboardData?.totalFSE ?? 1}
                  valueColor={Colors.fieldStock.fse}
                  onPress={() => setActiveTab('parties')}
                />
                <MiniStatTile
                  label="Pending"
                  value={dashboardData?.pendingStockReq ?? 0}
                  valueColor={Colors.fieldStock.pending}
                  onPress={() => setActiveTab('parties')}
                />
                <MiniStatTile
                  label="Approved"
                  value={dashboardData?.stockApproved ?? 0}
                  valueColor={Colors.fieldStock.approved}
                  onPress={() => setActiveTab('parties')}
                />
                <MiniStatTile
                  label="DSR"
                  value={dashboardData?.totalDSR ?? 0}
                  valueColor={Colors.fieldStock.dsr}
                  onPress={() => setActiveTab('parties')}
                />
              </View>

              {/* SALE & PURCHASE CHART CARD */}
              <BarChartCard
                data={dashboardData?.graphData || []}
              />

              {/* EXPENSES CARD */}
              <ExpensesCard
                amount={dashboardData?.expenseAmt ?? 0}
                onPressViewDetails={() => {
                  setDetailModalConfig({
                    title: 'Operating Expenses',
                    subtitle: 'Business, operational, and office expenditures',
                    iconName: 'trending-down',
                    iconColor: '#DC2626',
                    iconBg: '#FEF2F2',
                    items: [
                      {
                        label: 'Total Expenses This Month',
                        value: dashboardData?.expenseAmt ?? 0,
                        highlightColor: '#DC2626',
                        subtext: 'Operational and petty cash payments',
                      },
                    ],
                    tips: 'Log all petty cash and rent vouchers to maximize eligible deductions.',
                  });
                }}
              />

              {/* SUPPORT SECTION */}
              <SectionHeader title="Support" />
              <SupportCard
                onPressBookMeeting={() =>
                  Alert.alert(
                    'Book Meeting',
                    'Schedule an onboarding or compliance session with our BTHAWK team.'
                  )
                }
                onPressEmail={() =>
                  Alert.alert('Email Support', 'Contact us directly at support@bthawk.com')
                }
                onPressTutorial={() =>
                  Alert.alert('Video Tutorials', 'Opening BTHAWK tutorial video library.')
                }
                onPressWhatsapp={() =>
                  Alert.alert('WhatsApp', 'Connecting to 24/7 BTHAWK WhatsApp support...')
                }
                onPressChatAi={() =>
                  Alert.alert('BTHAWK+ Assistant', 'AI business and GST assistant active.')
                }
              />

              {/* FAQS ACCORDION */}
              <SectionHeader title="FAQs" />
              <FaqAccordion faqs={faqs} />
            </>
          )}
        </ScrollView>
      )}

      {/* 2. SALES TAB */}
      {activeTab === 'sales' && (
        <SalesView
          data={dashboardData}
          startDate={activeRange.startDate}
          endDate={activeRange.endDate}
          onNewInvoice={() => setShowInvoiceSheet(true)}
        />
      )}

      {/* 3. PARTIES / PURCHASE TAB */}
      {activeTab === 'parties' && (
        <PartiesView
          data={dashboardData}
          onAddParty={() => setShowAddPartySheet(true)}
        />
      )}

      {/* 4. REPORTS TAB */}
      {activeTab === 'reports' && (
        <ReportsView
          data={dashboardData}
          currency={currencySymbol}
          onOpenReport={(reportName) => {
            if (reportName === 'SaleRegister') handleOpenSaleDetail();
            else if (reportName === 'ExpenseMaster') handleOpenPurchaseDetail();
            else handleOpenSaleDetail();
          }}
        />
      )}

      {/* 5. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <SettingsScreen
          onLogout={handleLogout}
          onOpenQr={() => setShowQrScanner(true)}
        />
      )}

      {/* BOTTOM TAB BAR */}
      <AppTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPressPlus={() => setShowPlusSheet(true)}
      />

      {/* PERIOD SELECTOR BOTTOM SHEET */}
      <PeriodSheet
        visible={showPeriodSheet}
        selectedPreset={selectedPreset}
        onSelect={handleSelectPreset}
        onClose={() => setShowPeriodSheet(false)}
      />

      {/* PLUS ACTION SHEET */}
      <PlusActionSheet
        visible={showPlusSheet}
        onClose={() => setShowPlusSheet(false)}
        onSelectAction={handlePlusActionSelect}
      />

      {/* LEFT NAVIGATION DRAWER */}
      <AppDrawer
        visible={showDrawer}
        activeRoute="/dashboard"
        onClose={() => setShowDrawer(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab as any);
        }}
        onOpenHelpSupport={() => {
          Alert.alert('Help & Support', 'Reach our team anytime at support@bthawk.com');
        }}
        onLogout={handleLogout}
      />

      {/* INVOICE CREATION SHEET */}
      <InvoiceCreateSheet
        visible={showInvoiceSheet}
        onClose={() => setShowInvoiceSheet(false)}
        onSuccess={() => loadDashboard(activeRange)}
      />

      {/* RECORD PAYMENT RECEIPT SHEET */}
      <PaymentReceiptSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        onSuccess={() => loadDashboard(activeRange)}
      />

      {/* ADD PARTY SHEET */}
      <AddPartySheet
        visible={showAddPartySheet}
        onClose={() => setShowAddPartySheet(false)}
        onSuccess={() => loadDashboard(activeRange)}
      />

      {/* QR SCANNER SHEET */}
      <QrScannerSheet
        visible={showQrScanner}
        onClose={() => setShowQrScanner(false)}
      />

      {/* METRIC DRILL-DOWN MODAL */}
      <MetricDetailModal
        visible={!!detailModalConfig}
        config={detailModalConfig}
        currency={currencySymbol}
        onClose={() => setDetailModalConfig(null)}
      />

      {/* USER & BUSINESS PROFILE MODAL */}
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onLogout={handleLogout}
        onOpenQr={() => setShowQrScanner(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    paddingHorizontal: Shapes.screenPadding,
    paddingTop: 8,
  },
  overviewGrid: {
    gap: Shapes.gridGap,
    marginBottom: Shapes.verticalGap,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Shapes.gridGap,
  },
  fieldStockRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Shapes.verticalGap,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Shapes.cardRadius,
    padding: Shapes.cardPadding,
    marginBottom: Shapes.verticalGap,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    ...Shadows.card,
  },
  errorIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE3E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTextWrap: {
    flex: 1,
  },
  errorTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.text,
  },
  errorSub: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: Colors.white,
  },
});
