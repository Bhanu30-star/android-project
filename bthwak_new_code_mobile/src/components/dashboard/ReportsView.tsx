import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { DashboardData } from '@/api/dashboard';
import { formatCurrency } from '@/utils/dateUtils';

interface ReportsViewProps {
  data: DashboardData | null;
  currency?: string;
  onOpenReport?: (reportName: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  data,
  currency = '₹',
  onOpenReport,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Reports & Ledgers</Text>
          <Text style={styles.pageSubtitle}>Financial statements, GST, and day-end registers</Text>
        </View>
      </View>

      {/* CASH & LIQUIDITY BANNER */}
      <View style={styles.liquidityCard}>
        <Text style={styles.cardHeaderTitle}>Available Liquidity</Text>
        <View style={styles.liquidityRow}>
          <View style={styles.liquidityItem}>
            <View style={styles.iconWithTitle}>
              <Ionicons name="wallet" size={16} color="#16A34A" />
              <Text style={styles.liquidityLabel}>Cash in Hand</Text>
            </View>
            <Text style={[styles.liquidityValue, { color: '#16A34A' }]}>
              {formatCurrency(data?.cashBalance ?? 0, currency)}
            </Text>
          </View>

          <View style={styles.vDivider} />

          <View style={styles.liquidityItem}>
            <View style={styles.iconWithTitle}>
              <Ionicons name="business" size={16} color="#2563EB" />
              <Text style={styles.liquidityLabel}>Bank Accounts</Text>
            </View>
            <Text style={[styles.liquidityValue, { color: '#2563EB' }]}>
              {formatCurrency(data?.bankBalance ?? 0, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* REPORT REGISTERS LIST */}
      <Text style={styles.sectionTitle}>Financial Registers</Text>
      <View style={styles.registersList}>
        <TouchableOpacity
          style={styles.reportRow}
          activeOpacity={0.7}
          onPress={() => onOpenReport?.('SaleRegister')}
        >
          <View style={[styles.reportIcon, { backgroundColor: '#EFF6FF' }]}>
            <Feather name="file-text" size={18} color="#2563EB" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Sales Register</Text>
            <Text style={styles.reportSubtitle}>Item-wise sales bills & Tax breakdown</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportRow}
          activeOpacity={0.7}
          onPress={() => onOpenReport?.('Purchase')}
        >
          <View style={[styles.reportIcon, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="shopping-bag" size={18} color="#D97706" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Purchase Register</Text>
            <Text style={styles.reportSubtitle}>Vendor transactions, returns & input tax credit</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportRow}
          activeOpacity={0.7}
          onPress={() => onOpenReport?.('DSR')}
        >
          <View style={[styles.reportIcon, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="clipboard-outline" size={18} color="#4F46E5" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Daily Sales Report (DSR)</Text>
            <Text style={styles.reportSubtitle}>Executive day-end submissions & cash tally</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportRow}
          activeOpacity={0.7}
          onPress={() => onOpenReport?.('ExpenseMaster')}
        >
          <View style={[styles.reportIcon, { backgroundColor: '#FEF2F2' }]}>
            <Feather name="trending-down" size={18} color="#DC2626" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Expense Master</Text>
            <Text style={styles.reportSubtitle}>Operational and business expense register</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* COMPLIANCE SECTION */}
      <Text style={styles.sectionTitle}>Tax & Compliance</Text>
      <View style={styles.complianceCard}>
        <View style={styles.complianceRow}>
          <View style={[styles.checkCircle, { backgroundColor: '#ECFDF5' }]}>
            <Feather name="check" size={14} color="#10B981" />
          </View>
          <View style={styles.complianceTextGroup}>
            <Text style={styles.complianceTitle}>Simplified GST Filings</Text>
            <Text style={styles.complianceDesc}>GSTR-1, GSTR-3B summary reports ready</Text>
          </View>
        </View>

        <View style={styles.complianceRow}>
          <View style={[styles.checkCircle, { backgroundColor: '#ECFDF5' }]}>
            <Feather name="check" size={14} color="#10B981" />
          </View>
          <View style={styles.complianceTextGroup}>
            <Text style={styles.complianceTitle}>Timely TDS Compliance</Text>
            <Text style={styles.complianceDesc}>Section-wise TDS registers aligned</Text>
          </View>
        </View>
      </View>
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
  liquidityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  liquidityRow: {
    flexDirection: 'row',
  },
  liquidityItem: {
    flex: 1,
  },
  iconWithTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liquidityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  liquidityValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  vDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  registersList: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
    ...Theme.shadows.card,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  reportIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  reportSubtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  complianceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...Theme.shadows.card,
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  complianceTextGroup: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  complianceDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
});
