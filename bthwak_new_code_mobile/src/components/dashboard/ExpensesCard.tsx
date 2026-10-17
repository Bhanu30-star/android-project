import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Shapes, Shadows } from '@/theme';
import { formatIndianCurrency } from '@/utils/formatters';

interface ExpensesCardProps {
  amount: number;
  onPressViewDetails?: () => void;
}

export const ExpensesCard: React.FC<ExpensesCardProps> = ({
  amount,
  onPressViewDetails,
}) => {
  const formatted = formatIndianCurrency(amount);

  return (
    <View style={styles.card}>
      <View style={styles.leftGroup}>
        {/* Tinted round icon chip */}
        <View style={styles.iconChip}>
          <Text style={styles.chipSymbol}>₹</Text>
        </View>

        {/* Label & Amount */}
        <View style={styles.textGroup}>
          <Text style={styles.label}>Expenses this month</Text>
          <Text style={styles.value} numberOfLines={1}>
            {formatted}
          </Text>
        </View>
      </View>

      {/* View details button */}
      <TouchableOpacity
        style={styles.detailsBtn}
        onPress={onPressViewDetails}
        activeOpacity={0.8}
        accessibilityLabel="View expense details"
        accessibilityRole="button"
      >
        <Text style={styles.detailsBtnText}>View details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.cardRadius,
    padding: Shapes.cardPadding,
    marginBottom: Shapes.verticalGap,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconChip: {
    width: Shapes.iconChipSize,
    height: Shapes.iconChipSize,
    borderRadius: 18,
    backgroundColor: Colors.chips.expense.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSymbol: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 17,
    color: Colors.chips.expense.icon,
  },
  textGroup: {
    flex: 1,
  },
  label: {
    ...Typography.statLabel,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 20,
    lineHeight: 24,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  detailsBtn: {
    backgroundColor: '#EEEDFA',
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
    color: Colors.primary,
  },
});
