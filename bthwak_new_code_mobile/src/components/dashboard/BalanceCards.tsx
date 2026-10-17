import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { DashboardData } from '@/api/dashboard';
import { formatCurrency } from '@/utils/dateUtils';

interface BalanceCardsProps {
  data: DashboardData | null;
  currency?: string;
  onPressBalance?: (type: 'cash' | 'bank' | 'expense') => void;
}

export const BalanceCards: React.FC<BalanceCardsProps> = ({
  data,
  currency = '₹',
  onPressBalance,
}) => {
  return (
    <View style={styles.container}>
      {/* CASH & BANK ROW */}
      <View style={styles.row}>
        {/* Cash Balance */}
        <TouchableOpacity
          style={styles.halfCard}
          activeOpacity={0.7}
          onPress={() => onPressBalance?.('cash')}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={17} color="#16A34A" />
            <Text style={styles.title}>Cash Balance</Text>
          </View>
          <Text style={[styles.amount, { color: '#16A34A' }]}>
            {formatCurrency(data?.cashBalance ?? 0, currency)}
          </Text>
          <Text style={styles.subtitle}>Available cash in hand</Text>
        </TouchableOpacity>

        {/* Bank Balance */}
        <TouchableOpacity
          style={styles.halfCard}
          activeOpacity={0.7}
          onPress={() => onPressBalance?.('bank')}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="business-outline" size={17} color="#2563EB" />
            <Text style={styles.title}>Bank Balance</Text>
          </View>
          <Text style={[styles.amount, { color: '#2563EB' }]}>
            {formatCurrency(data?.bankBalance ?? 0, currency)}
          </Text>
          <Text style={styles.subtitle}>Bank available balance</Text>
        </TouchableOpacity>
      </View>

      {/* EXPENSES FULL CARD */}
      <TouchableOpacity
        style={styles.fullCard}
        activeOpacity={0.7}
        onPress={() => onPressBalance?.('expense')}
      >
        <View style={styles.expenseLeft}>
          <View style={styles.cardHeader}>
            <Feather name="trending-down" size={17} color="#DC2626" />
            <Text style={styles.title}>Expenses</Text>
          </View>
          <Text style={[styles.amount, { color: '#DC2626' }]}>
            {formatCurrency(data?.expenseAmt ?? 0, currency)}
          </Text>
          <Text style={styles.subtitle}>Total expenses for this period</Text>
        </View>
        <Feather name="chevron-right" size={18} color={Theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  fullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  expenseLeft: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 3,
  },
});
