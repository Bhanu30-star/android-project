import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Shapes, Shadows } from '@/theme';
import { formatIndianCurrency } from '@/utils/formatters';

interface HeroBalanceCardProps {
  cashBalance: number;
  bankBalance: number;
  expensesThisMonth: number;
  onPressCash?: () => void;
  onPressBank?: () => void;
  onPressExpense?: () => void;
}

export const HeroBalanceCard: React.FC<HeroBalanceCardProps> = ({
  cashBalance,
  bankBalance,
  expensesThisMonth,
  onPressCash,
  onPressBank,
  onPressExpense,
}) => {
  const isNegative = cashBalance < 0;
  const formattedCash = formatIndianCurrency(cashBalance);
  const formattedBank = formatIndianCurrency(bankBalance);
  const formattedExpense = formatIndianCurrency(expensesThisMonth);

  return (
    <View style={styles.card}>
      {/* TOP ROW: Cash in hand label + Negative balance pill */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPressCash}
        accessibilityLabel={`Cash in hand: ${formattedCash}`}
        accessibilityRole="button"
      >
        <View style={styles.topRow}>
          <Text style={styles.label}>Cash in hand</Text>
          {isNegative && (
            <View style={styles.negativePill}>
              <Text style={styles.negativePillText}>Negative balance</Text>
            </View>
          )}
        </View>

        {/* HERO MAIN AMOUNT */}
        <Text
          style={[
            styles.heroAmount,
            { color: isNegative ? Colors.hero.negativeAmount : Colors.hero.positiveAmount },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formattedCash}
        </Text>
      </TouchableOpacity>

      {/* DIVIDER */}
      <View style={styles.divider} />

      {/* TWO COLUMNS: Bank balance & Expenses */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.col}
          activeOpacity={0.8}
          onPress={onPressBank}
          accessibilityLabel={`Bank balance: ${formattedBank}`}
          accessibilityRole="button"
        >
          <Text style={styles.subLabel}>Bank balance</Text>
          <Text style={styles.subValue} numberOfLines={1}>
            {formattedBank}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.col}
          activeOpacity={0.8}
          onPress={onPressExpense}
          accessibilityLabel={`Expenses this month: ${formattedExpense}`}
          accessibilityRole="button"
        >
          <Text style={styles.subLabel}>Expenses this month</Text>
          <Text style={styles.subValue} numberOfLines={1}>
            {formattedExpense}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.hero.bg,
    borderRadius: Shapes.heroRadius,
    padding: Shapes.heroPadding,
    marginBottom: Shapes.verticalGap,
    ...Shadows.hero,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    ...Typography.heroLabel,
  },
  negativePill: {
    backgroundColor: 'rgba(92, 40, 95, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  negativePillText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 11,
    color: Colors.hero.negativeAmount,
  },
  heroAmount: {
    ...Typography.heroAmount,
    marginTop: 2,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.hero.divider,
    marginVertical: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  subLabel: {
    ...Typography.statLabel,
    color: Colors.hero.label,
    marginBottom: 4,
  },
  subValue: {
    ...Typography.heroSubValue,
  },
});
