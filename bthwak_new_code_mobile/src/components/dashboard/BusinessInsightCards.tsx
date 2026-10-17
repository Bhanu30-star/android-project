import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { DashboardData } from '@/api/dashboard';
import { formatCurrency } from '@/utils/dateUtils';

export type InsightCardType = 'sales' | 'collection' | 'outstanding' | 'invoice';

interface BusinessInsightCardsProps {
  data: DashboardData | null;
  currency?: string;
  onPressCard?: (cardType: InsightCardType) => void;
}

export const BusinessInsightCards: React.FC<BusinessInsightCardsProps> = ({
  data,
  currency = '₹',
  onPressCard,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. SALES & PURCHASE */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => onPressCard?.('sales')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
            <Feather name="shopping-cart" size={18} color="#2563EB" />
          </View>
          <Text style={styles.cardTitle}>Sales & Purchase</Text>
          <Feather
            name="chevron-right"
            size={16}
            color={Theme.colors.textSecondary}
            style={styles.chevron}
          />
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Sale</Text>
          <Text style={[styles.metricValue, { color: '#2563EB' }]}>
            {formatCurrency(data?.totalSale ?? 0, currency)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Purchase</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(data?.totalPurchase ?? 0, currency)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 2. COLLECTION */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => onPressCard?.('collection')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="cash-outline" size={18} color="#10B981" />
          </View>
          <Text style={styles.cardTitle}>Collection</Text>
          <Feather
            name="chevron-right"
            size={16}
            color={Theme.colors.textSecondary}
            style={styles.chevron}
          />
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Cash Collected</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(data?.cashCollected ?? 0, currency)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Bank Collected</Text>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>
            {formatCurrency(data?.bankCollected ?? 0, currency)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 3. OUTSTANDING */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => onPressCard?.('outstanding')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
            <Feather name="credit-card" size={18} color="#EA580C" />
          </View>
          <Text style={styles.cardTitle}>Outstanding</Text>
          <Feather
            name="chevron-right"
            size={16}
            color={Theme.colors.textSecondary}
            style={styles.chevron}
          />
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>To Collect</Text>
          <Text style={[styles.metricValue, { color: '#EA580C' }]}>
            {formatCurrency(data?.outstandingCollected ?? 0, currency)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>To Pay</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(data?.outstandingPay ?? 0, currency)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 4. INVOICES */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => onPressCard?.('invoice')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: '#FAF5FF' }]}>
            <Feather name="file-text" size={18} color="#9333EA" />
          </View>
          <Text style={styles.cardTitle}>Invoices</Text>
          <Feather
            name="chevron-right"
            size={16}
            color={Theme.colors.textSecondary}
            style={styles.chevron}
          />
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Invoices</Text>
          <Text style={styles.metricValue}>
            {(data?.totalInvoice ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Credit Invoices</Text>
          <Text style={[styles.metricValue, { color: '#9333EA' }]}>
            {(data?.totalCreditInvoice ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: Theme.spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Theme.spacing.sm + 2,
  },
  chevron: {
    marginLeft: 'auto',
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: Theme.typography.sizes.sm + 1,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  metricLabel: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
});
