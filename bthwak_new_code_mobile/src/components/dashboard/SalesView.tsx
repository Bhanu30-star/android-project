import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { DashboardData } from '@/api/dashboard';
import { fetchInvoicesApi, InvoiceItem } from '@/api/invoices';
import { formatReadable } from '@/utils/dateUtils';
import { useApp } from '@/context/AppContext';

interface SalesViewProps {
  data: DashboardData | null;
  startDate?: string;
  endDate?: string;
  onNewInvoice: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  data,
  startDate,
  endDate,
  onNewInvoice,
}) => {
  const { formatAmount } = useApp();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute effective date range
  const todayStr = new Date().toISOString().split('T')[0];
  const sDate = startDate || todayStr;
  const eDate = endDate || todayStr;

  const loadInvoices = useCallback(async (isPull = false) => {
    if (isPull) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const realInvoices = await fetchInvoicesApi(sDate, eDate, 1, 30);
      setInvoices(realInvoices);
    } catch {
      setInvoices([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [sDate, eDate]);

  useEffect(() => {
    let isCancelled = false;
    async function fetchOnMount() {
      try {
        const realInvoices = await fetchInvoicesApi(sDate, eDate, 1, 30);
        if (!isCancelled) setInvoices(realInvoices);
      } catch {
        if (!isCancelled) setInvoices([]);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }
    void fetchOnMount();
    return () => {
      isCancelled = true;
    };
  }, [sDate, eDate]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadInvoices(true)}
          colors={[Theme.colors.primary]}
          tintColor={Theme.colors.primary}
        />
      }
    >
      {/* HEADER ROW */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Sales & Invoices</Text>
          <Text style={styles.pageSubtitle}>Real-time billing, tax invoices, and challans</Text>
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={onNewInvoice} activeOpacity={0.8}>
          <Feather name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Invoice</Text>
        </TouchableOpacity>
      </View>

      {/* SALES STATS ROW */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Total Sales</Text>
          <Text style={[styles.statValue, { color: '#2563EB' }]}>
            {formatAmount(data?.totalSale ?? 0)}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Total Bills</Text>
          <Text style={styles.statValue}>
            {(data?.totalInvoice ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Credit Bills</Text>
          <Text style={[styles.statValue, { color: '#9333EA' }]}>
            {(data?.totalCreditInvoice ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* QUICK INVOICE CREATION ACTIONS */}
      <Text style={styles.sectionTitle}>Invoicing Operations</Text>
      <View style={styles.grid}>
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7} onPress={onNewInvoice}>
          <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
            <Feather name="file-text" size={20} color="#2563EB" />
          </View>
          <Text style={styles.actionTitle}>Tax Invoice</Text>
          <Text style={styles.actionDesc}>Generate GST invoice with HSN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7} onPress={onNewInvoice}>
          <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
            <Feather name="truck" size={20} color="#10B981" />
          </View>
          <Text style={styles.actionTitle}>Delivery Challan</Text>
          <Text style={styles.actionDesc}>Create delivery & dispatch note</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
          <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="rotate-ccw" size={20} color="#D97706" />
          </View>
          <Text style={styles.actionTitle}>Sale Return</Text>
          <Text style={styles.actionDesc}>Manage returned goods & credit note</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
          <View style={[styles.actionIcon, { backgroundColor: '#FAF5FF' }]}>
            <Ionicons name="receipt-outline" size={20} color="#9333EA" />
          </View>
          <Text style={styles.actionTitle}>Sale Register</Text>
          <Text style={styles.actionDesc}>Export full ledger & sales history</Text>
        </TouchableOpacity>
      </View>

      {/* REAL INVOICES LIST FROM SERVER */}
      <Text style={styles.sectionTitle}>
        Invoices for Period ({invoices.length})
      </Text>

      {isLoading && !isRefreshing ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="small" color={Theme.colors.primary} />
          <Text style={styles.loaderText}>Fetching real sales records...</Text>
        </View>
      ) : invoices.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="file-text" size={32} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Invoices Found</Text>
          <Text style={styles.emptySubtitle}>
            No sales bills or challans were recorded for this period. Tap &quot;+ Invoice&quot; above to create one.
          </Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {invoices.map((inv, idx) => {
            const isCredit = inv.payment_mode === 'Credit';
            const billNo = inv.transaction_bill_number || `INV-#${inv.transaction_id}`;
            const party = inv.party_name || 'Retail Customer';
            const dateStr = inv.transaction_date ? formatReadable(inv.transaction_date) : 'Today';

            return (
              <View key={`${inv.transaction_id}-${idx}`}>
                <View style={styles.listItem}>
                  <View style={styles.listLeft}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: isCredit ? '#FEF3C7' : '#ECFDF5' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: isCredit ? '#D97706' : '#059669' },
                        ]}
                      >
                        {inv.payment_mode || 'Paid'}
                      </Text>
                    </View>
                    <Text style={styles.listName} numberOfLines={1}>
                      {party}
                    </Text>
                    <Text style={styles.listDate}>
                      {billNo} • {dateStr}
                    </Text>
                  </View>
                  <Text style={styles.listAmount}>
                    {formatAmount(inv.final_amt || inv.total_amount || 0)}
                  </Text>
                </View>

                {idx < invoices.length - 1 && <View style={styles.itemDivider} />}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.xs,
    paddingBottom: Theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  pageTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.borderRadius.md,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  actionDesc: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  listLeft: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  listName: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  listDate: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  listAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
});
