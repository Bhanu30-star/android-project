import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { GraphDataPoint } from '@/api/dashboard';
import { formatCurrency, formatShortDate } from '@/utils/dateUtils';

interface SalesPurchaseChartProps {
  data: GraphDataPoint[];
  currency?: string;
}

const CHART_HEIGHT = 160;
const SCREEN_WIDTH = Dimensions.get('window').width;

export const SalesPurchaseChart: React.FC<SalesPurchaseChartProps> = ({
  data,
  currency = '₹',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Reverse if needed or ensure chronological order
  const chartPoints = [...data].reverse();

  // Find max value for proportional heights
  const maxVal = Math.max(
    ...chartPoints.flatMap((p) => [p.sale || 0, p.purchase || 0]),
    1000 // avoid div by zero
  );

  const totalSales = chartPoints.reduce((acc, p) => acc + (p.sale || 0), 0);
  const totalPurchases = chartPoints.reduce((acc, p) => acc + (p.purchase || 0), 0);

  const selectedPoint = selectedIndex !== null ? chartPoints[selectedIndex] : null;

  return (
    <View style={styles.card}>
      {/* HEADER & LEGEND */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sale & Purchase Summary</Text>
          <Text style={styles.subtitle}>Trend over selected period</Text>
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2C3179' }]} />
            <Text style={styles.legendText}>Sale</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8085E8' }]} />
            <Text style={styles.legendText}>Purchase</Text>
          </View>
        </View>
      </View>

      {/* SUMMARY TOTALS */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Sales</Text>
          <Text style={[styles.summaryVal, { color: '#2C3179' }]}>
            {formatCurrency(totalSales, currency)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Purchase</Text>
          <Text style={[styles.summaryVal, { color: '#6366F1' }]}>
            {formatCurrency(totalPurchases, currency)}
          </Text>
        </View>
      </View>

      {/* INTERACTIVE POPUP / CALLOUT */}
      {selectedPoint && (
        <View style={styles.popover}>
          <Text style={styles.popoverDate}>
            {formatShortDate(selectedPoint.date)}
          </Text>
          <View style={styles.popoverRow}>
            <Text style={styles.popoverSale}>
              Sale: {formatCurrency(selectedPoint.sale, currency)}
            </Text>
            <Text style={styles.popoverPurchase}>
              Purchase: {formatCurrency(selectedPoint.purchase, currency)}
            </Text>
          </View>
        </View>
      )}

      {/* CHART BARS */}
      {chartPoints.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="bar-chart" size={28} color="#94A3B8" />
          <Text style={styles.emptyText}>No data available for this range</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.chartScroll,
            chartPoints.length < 8 && { minWidth: SCREEN_WIDTH - 64 },
          ]}
        >
          {chartPoints.map((point, idx) => {
            const isSelected = selectedIndex === idx;
            const saleHeight = Math.max((point.sale / maxVal) * (CHART_HEIGHT - 35), 4);
            const purchaseHeight = Math.max(
              (point.purchase / maxVal) * (CHART_HEIGHT - 35),
              4
            );

            return (
              <TouchableOpacity
                key={`${point.date}-${idx}`}
                onPress={() => setSelectedIndex(isSelected ? null : idx)}
                style={[styles.barColumn, isSelected && styles.barColumnActive]}
                activeOpacity={0.8}
              >
                {/* Bars group */}
                <View style={styles.barsPair}>
                  {/* Sales bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: saleHeight,
                        backgroundColor: '#2C3179',
                      },
                    ]}
                  />
                  {/* Purchase bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: purchaseHeight,
                        backgroundColor: '#8085E8',
                      },
                    ]}
                  />
                </View>

                {/* Date Label */}
                <Text
                  style={[styles.dateLabel, isSelected && styles.dateLabelActive]}
                  numberOfLines={1}
                >
                  {formatShortDate(point.date)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: Theme.typography.sizes.sm + 1,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: Theme.spacing.sm + 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  popover: {
    backgroundColor: '#1E293B',
    borderRadius: Theme.borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    alignSelf: 'center',
  },
  popoverDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 2,
  },
  popoverRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  popoverSale: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '600',
  },
  popoverPurchase: {
    fontSize: 11,
    color: '#C4B5FD',
    fontWeight: '600',
  },
  chartScroll: {
    height: CHART_HEIGHT,
    alignItems: 'flex-end',
    paddingVertical: 6,
    gap: 10,
    paddingRight: 10,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  barColumnActive: {
    backgroundColor: '#F1F5F9',
  },
  barsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: 6,
  },
  bar: {
    width: 10,
    borderRadius: 3,
  },
  dateLabel: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
    width: 38,
    textAlign: 'center',
  },
  dateLabelActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  emptyBox: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
});
