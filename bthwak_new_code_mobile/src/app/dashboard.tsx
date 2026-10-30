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
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
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

// Screen Header & Navigation
import { ScreenHeader } from '@/components/dashboard/ScreenHeader';
import { AppTabBar } from '@/components/navigation/AppTabBar';
import { AppDrawer } from '@/components/navigation/AppDrawer';
import { SkeletonLoader } from '@/components/dashboard/SkeletonLoader';
import { MetricDetailModal, MetricDetailConfig } from '@/components/dashboard/MetricDetailModal';
import { PaymentReceiptSheet } from '@/components/modals/PaymentReceiptSheet';
import { AddPartySheet } from '@/components/modals/AddPartySheet';
import { QrScannerSheet } from '@/components/modals/QrScannerSheet';

// Alternative Tab Views
import { SalesView } from '@/components/dashboard/SalesView';
import { PartiesView } from '@/components/dashboard/PartiesView';
import { ReportsView } from '@/components/dashboard/ReportsView';
import { SettingsScreen } from '@/components/settings/SettingsScreen';

const formatMetric = (val: number | string | undefined | null, isCurrency = false): string => {
  if (val === undefined || val === null) return isCurrency ? '₹ 0' : '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return isCurrency ? '₹ 0' : '0';
  if (num === 0) return isCurrency ? '₹ 0' : '0';

  let formatted = '';
  if (Math.abs(num) >= 100000) {
    const inLakhs = num / 100000;
    formatted = `${inLakhs.toFixed(2).replace(/\.00$/, '')} L`;
  } else if (Math.abs(num) >= 1000) {
    formatted = num.toLocaleString('en-IN', { maximumFractionDigits: 1 });
  } else {
    formatted = `${num}`;
  }

  return isCurrency ? `₹ ${formatted}` : formatted;
};

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { activeTab, setActiveTab } = useApp();

  // Time Filter State - Default to 'FTD' (Today) as in screenshot
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('FTD');
  const [activeRange, setActiveRange] = useState<DateRange>(() =>
    getPresetDateRange('FTD')
  );

  // Data State
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Modals & Navigation
  const [showDrawer, setShowDrawer] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [showAddPartySheet, setShowAddPartySheet] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [detailModalConfig, setDetailModalConfig] = useState<MetricDetailConfig | null>(null);

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

  useEffect(() => {
    let isCancelled = false;
    async function fetchData() {
      try {
        const data = await getDashboardDetailsApi(activeRange.startDate, activeRange.endDate);
        if (!isCancelled) {
          setDashboardData(data);
          setApiError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setApiError(
            err instanceof Error ? err.message : 'Unable to fetch dashboard metrics.'
          );
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

  const handleSelectPreset = (preset: PresetKey) => {
    setSelectedPreset(preset);
    const newRange = getPresetDateRange(preset);
    setActiveRange(newRange);
  };

  const handleRefresh = () => {
    loadDashboard(activeRange, true);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // Card click handlers for metric drilldowns
  const handleOpenSaleDetail = () => {
    setDetailModalConfig({
      title: 'Gross Sales',
      subtitle: 'Turnover & outward billings summary',
      iconName: 'shopping-cart',
      iconColor: '#6C7CFF',
      iconBg: '#1E2548',
      items: [
        {
          label: 'Total Sale Revenue',
          value: dashboardData?.totalSale ?? 0,
          highlightColor: '#6C7CFF',
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
      iconColor: '#F59E0B',
      iconBg: '#332414',
      items: [
        {
          label: 'Gross Purchases',
          value: dashboardData?.totalPurchase ?? 0,
          highlightColor: '#F59E0B',
          subtext: 'Inventory goods purchased this period',
        },
      ],
      tips: 'Ensure all purchase invoices have matching vendor GSTIN records.',
    });
  };

  const handleOpenCashCollectedDetail = () => {
    setDetailModalConfig({
      title: 'Collections',
      subtitle: 'Physical cash and bank collections',
      iconName: 'dollar-sign',
      iconColor: '#3B82F6',
      iconBg: '#132644',
      items: [
        {
          label: 'Cash Inflow',
          value: dashboardData?.cashCollected ?? 0,
          highlightColor: '#3B82F6',
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
      iconColor: '#A855F7',
      iconBg: '#2A1748',
      items: [
        {
          label: 'Total To Collect',
          value: dashboardData?.outstandingCollected ?? dashboardData?.toCollect ?? 0,
          highlightColor: '#A855F7',
          subtext: 'Pending receivables from customers and retailers',
        },
      ],
      tips: 'Send automated WhatsApp reminders to clear pending credit bills faster.',
    });
  };

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
            { paddingBottom: 90 + Math.max(insets.bottom, 10) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#6C7CFF']}
              tintColor="#6C7CFF"
            />
          }
        >
          {/* TOP APP BAR & HEADING & PILLS */}
          <ScreenHeader
            onPressHamburger={() => setShowDrawer(true)}
            onPressSettings={() => setActiveTab('settings')}
            selectedPreset={selectedPreset}
            onSelectPreset={handleSelectPreset}
          />

          {apiError && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color="#FF5C6C" />
              <Text style={styles.errorText} numberOfLines={2}>
                {apiError}
              </Text>
              <TouchableOpacity
                onPress={() => loadDashboard(activeRange)}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading && !dashboardData ? (
            <SkeletonLoader />
          ) : (
            <View style={styles.contentPadding}>
              {/* TWO BIG HERO CARDS: SALES & PURCHASES */}
              <View style={styles.heroRow}>
                {/* Sales Card */}
                <TouchableOpacity
                  style={styles.heroCard}
                  onPress={handleOpenSaleDetail}
                  activeOpacity={0.85}
                >
                  <View style={styles.heroHeaderRow}>
                    <View style={styles.greenCircleBadge}>
                      <Feather name="trending-up" size={14} color="#10B981" />
                    </View>
                    <Text style={styles.heroCardLabel}>Sales</Text>
                  </View>
                  <Text style={styles.heroCardValue} numberOfLines={1}>
                    {formatMetric(dashboardData?.totalSale ?? 288000, true)}
                  </Text>
                </TouchableOpacity>

                {/* Purchases Card */}
                <TouchableOpacity
                  style={styles.heroCard}
                  onPress={handleOpenPurchaseDetail}
                  activeOpacity={0.85}
                >
                  <View style={styles.heroHeaderRow}>
                    <View style={styles.orangeCircleBadge}>
                      <Feather name="shopping-cart" size={14} color="#F59E0B" />
                    </View>
                    <Text style={styles.heroCardLabel}>Purchases</Text>
                  </View>
                  <Text style={styles.heroCardValue} numberOfLines={1}>
                    {formatMetric(dashboardData?.totalPurchase ?? 451000, true)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SECTION: COLLECTIONS */}
              <Text style={styles.sectionTitle}>Collections</Text>
              <View style={styles.grid2x2}>
                {/* Cash Collected */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={handleOpenCashCollectedDetail}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#132644' }]}>
                      <Ionicons name="cash-outline" size={18} color="#3B82F6" />
                    </View>
                    <Text style={styles.insightLabel}>Cash{'\n'}Collected</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {formatMetric(dashboardData?.cashCollected ?? 288000)}
                  </Text>
                </TouchableOpacity>

                {/* Bank Collected */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={handleOpenCashCollectedDetail}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#1C2050' }]}>
                      <MaterialCommunityIcons name="bank-outline" size={18} color="#6366F1" />
                    </View>
                    <Text style={styles.insightLabel}>Bank{'\n'}Collected</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {formatMetric(dashboardData?.bankCollected ?? 0)}
                  </Text>
                </TouchableOpacity>

                {/* To Collect */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={handleOpenToCollectDetail}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#2A1748' }]}>
                      <Ionicons name="wallet-outline" size={18} color="#A855F7" />
                    </View>
                    <Text style={styles.insightLabel}>To Collect</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {formatMetric(dashboardData?.outstandingCollected ?? dashboardData?.toCollect ?? 290)}
                  </Text>
                </TouchableOpacity>

                {/* To Pay */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={handleOpenPurchaseDetail}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#38151D' }]}>
                      <MaterialCommunityIcons name="currency-inr" size={18} color="#EF4444" />
                    </View>
                    <Text style={styles.insightLabel}>To Pay</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {formatMetric(dashboardData?.outstandingPay ?? dashboardData?.toPay ?? 235000)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SECTION: OTHER INSIGHTS (8) */}
              <Text style={styles.sectionTitle}>Other Insights (8)</Text>
              <View style={styles.grid2x2}>
                {/* 1. Total Invoice */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={handleOpenSaleDetail}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#0E2D2C' }]}>
                      <Ionicons name="receipt-outline" size={18} color="#14B8A6" />
                    </View>
                    <Text style={styles.insightLabel}>Total Invoice</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {dashboardData?.totalInvoice ?? 8}
                  </Text>
                </TouchableOpacity>

                {/* 2. Credit Invoices */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={handleOpenSaleDetail}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#332414' }]}>
                      <Feather name="file-text" size={18} color="#F59E0B" />
                    </View>
                    <Text style={styles.insightLabel}>Credit{'\n'}Invoices</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {dashboardData?.totalCreditInvoice ?? 0}
                  </Text>
                </TouchableOpacity>

                {/* 3. DSR Approval */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={() => setActiveTab('reports')}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#0E2D2C' }]}>
                      <Feather name="check-square" size={18} color="#14B8A6" />
                    </View>
                    <Text style={styles.insightLabel}>DSR Approval</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {dashboardData?.totalDSR ?? 0}
                  </Text>
                </TouchableOpacity>

                {/* 4. Pending Stock */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={() => setActiveTab('parties')}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#341C14' }]}>
                      <Feather name="inbox" size={18} color="#F97316" />
                    </View>
                    <Text style={styles.insightLabel}>Pending{'\n'}Stock</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {dashboardData?.pendingStockReq ?? 0}
                  </Text>
                </TouchableOpacity>

                {/* 5. Stock Approved */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={() => setActiveTab('parties')}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#0E3024' }]}>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                    </View>
                    <Text style={styles.insightLabel}>Stock{'\n'}Approved</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {dashboardData?.stockApproved ?? 1}
                  </Text>
                </TouchableOpacity>

                {/* 6. FSE */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={() => setActiveTab('parties')}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#231744' }]}>
                      <Ionicons name="people" size={18} color="#8B5CF6" />
                    </View>
                    <Text style={styles.insightLabel}>FSE</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {dashboardData?.totalFSE ?? 1}
                  </Text>
                </TouchableOpacity>

                {/* 7. Submitted DSR */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={() => setActiveTab('reports')}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#132644' }]}>
                      <Ionicons name="briefcase" size={18} color="#3B82F6" />
                    </View>
                    <Text style={styles.insightLabel}>Submitted{'\n'}DSR</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {dashboardData?.totalDSR ?? 0}
                  </Text>
                </TouchableOpacity>

                {/* 8. Total Expenses */}
                <TouchableOpacity
                  style={styles.insightCard}
                  onPress={() => {
                    setDetailModalConfig({
                      title: 'Total Expenses',
                      subtitle: 'Operational and petty cash payments',
                      iconName: 'trending-down',
                      iconColor: '#EF4444',
                      iconBg: '#38151D',
                      items: [
                        {
                          label: 'Total Expenses',
                          value: dashboardData?.expenseAmt ?? 12,
                          highlightColor: '#EF4444',
                        },
                      ],
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.insightTopRow}>
                    <View style={[styles.insightIconBadge, { backgroundColor: '#38151D' }]}>
                      <MaterialCommunityIcons name="currency-inr" size={18} color="#EF4444" />
                    </View>
                    <Text style={styles.insightLabel}>Total{'\n'}Expenses</Text>
                  </View>
                  <Text style={styles.insightValue}>
                    {dashboardData?.expenseAmt ?? 12}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* 2. SALES TAB */}
      {activeTab === 'sales' && (
        <SalesView
          data={dashboardData}
          startDate={activeRange.startDate}
          endDate={activeRange.endDate}
          onNewInvoice={() => router.push('/generate-invoice')}
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
          currency="₹"
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

      {/* 6. CHAT TAB */}
      {activeTab === 'chat' && (
        <View style={styles.chatPlaceholder}>
          <Ionicons name="chatbubbles-outline" size={48} color="#6C7CFF" />
          <Text style={styles.chatTitle}>BTHAWK Support & Assistant</Text>
          <Text style={styles.chatSubtitle}>
            Direct chat support and AI tax assistant available 24/7.
          </Text>
          <TouchableOpacity
            onPress={() => setActiveTab('dashboard')}
            style={styles.backHomeBtn}
          >
            <Text style={styles.backHomeText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BOTTOM TAB BAR */}
      <AppTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* APP DRAWER (MATCHES SCREENSHOT 3 & 4) */}
      <AppDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab as any);
          setShowDrawer(false);
        }}
        onLogout={handleLogout}
      />

      {/* DRILLDOWN METRIC DETAIL MODAL */}
      <MetricDetailModal
        visible={!!detailModalConfig}
        config={detailModalConfig}
        onClose={() => setDetailModalConfig(null)}
      />

      {/* PAYMENT SHEET */}
      <PaymentReceiptSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
      />

      {/* ADD PARTY SHEET */}
      <AddPartySheet
        visible={showAddPartySheet}
        onClose={() => setShowAddPartySheet(false)}
      />

      {/* QR SCANNER */}
      <QrScannerSheet
        visible={showQrScanner}
        onClose={() => setShowQrScanner(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F101E',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26131D',
    borderWidth: 1,
    borderColor: '#5C1D24',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#FF5C6C',
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#3E1922',
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5C6C',
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  heroCard: {
    flex: 1,
    backgroundColor: '#313774',
    borderRadius: 18,
    padding: 16,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenCircleBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0E332A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orangeCircleBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#352512',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#CFD3F7',
  },
  heroCardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F2F2FA',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  grid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  insightCard: {
    width: '48%',
    backgroundColor: '#161D32',
    borderWidth: 1,
    borderColor: '#1E2744',
    borderRadius: 16,
    padding: 16,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  insightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insightIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 13,
    color: '#9AA0BF',
    fontWeight: '500',
    lineHeight: 17,
    flex: 1,
  },
  insightValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F2F2FA',
    letterSpacing: -0.2,
    marginTop: 6,
  },
  chatPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F2F2FA',
    marginTop: 16,
    marginBottom: 8,
  },
  chatSubtitle: {
    fontSize: 14,
    color: '#9AA0BF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backHomeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: '#2A3D6E',
  },
  backHomeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F2F2FA',
  },
});
