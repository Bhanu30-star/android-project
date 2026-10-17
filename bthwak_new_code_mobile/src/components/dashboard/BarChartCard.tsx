import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Colors, Typography, Shapes, Shadows } from '@/theme';
import { GraphDataPoint } from '@/api/dashboard';

interface BarChartCardProps {
  data: GraphDataPoint[];
}

export const BarChartCard: React.FC<BarChartCardProps> = ({ data }) => {
  // Fallback default sample data if API returns empty
  const chartItems =
    data && data.length > 0
      ? data.slice(-5)
      : [
          { date: '16 Oct', sale: 0, purchase: 5000 },
          { date: '17 Oct', sale: 0, purchase: 150 },
        ];

  // Calculate maximum value for bar scale
  const maxVal = Math.max(
    ...chartItems.map((d) => Math.max(d.sale || 0, d.purchase || 0)),
    1000
  );

  const chartHeight = 110;

  const formatDateLabel = (d: string) => {
    // If format is YYYY-MM-DD
    if (d.includes('-') && d.length === 10) {
      const parts = d.split('-');
      const day = parseInt(parts[2], 10);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[parseInt(parts[1], 10) - 1] || '';
      return `${day} ${month}`;
    }
    return d;
  };

  return (
    <View style={styles.card}>
      {/* HEADER: Title & Legend */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Sale & purchase</Text>

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendText}>Sale</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.chips.purchase.icon }]} />
            <Text style={styles.legendText}>Purchase</Text>
          </View>
        </View>
      </View>

      {/* CHART SVG AREA */}
      <View style={styles.chartWrapper}>
        <Svg height={chartHeight} width="100%" style={styles.svg}>
          {/* Dashed Grid Lines */}
          <Line
            x1="0"
            y1={20}
            x2="100%"
            y2={20}
            stroke="#ECEBFA"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <Line
            x1="0"
            y1={60}
            x2="100%"
            y2={60}
            stroke="#ECEBFA"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          {/* Baseline */}
          <Line
            x1="0"
            y1={chartHeight - 4}
            x2="100%"
            y2={chartHeight - 4}
            stroke="#ECEBFA"
            strokeWidth="1"
          />
        </Svg>

        {/* Bars Container */}
        <View style={styles.barsContainer}>
          {chartItems.map((item, index) => {
            const saleRatio = Math.min((item.sale || 0) / maxVal, 1);
            const purchaseRatio = Math.min((item.purchase || 0) / maxVal, 1);

            // Minimum bar height is 2px flat line for 0, up to available height
            const availableHeight = chartHeight - 16;
            const saleHeight = Math.max(saleRatio * availableHeight, 3);
            const purchaseHeight = Math.max(purchaseRatio * availableHeight, 3);

            return (
              <View key={`${item.date}-${index}`} style={styles.dayGroup}>
                <View style={styles.barsPair}>
                  {/* Sale bar (Indigo) */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: saleHeight,
                        backgroundColor: Colors.primary,
                      },
                    ]}
                  />

                  {/* Purchase bar (Rust) */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: purchaseHeight,
                        backgroundColor: Colors.chips.purchase.icon,
                      },
                    ]}
                  />
                </View>

                {/* Day Label */}
                <Text style={styles.dayLabel}>{formatDateLabel(item.date)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.cardRadius,
    padding: Shapes.cardPadding,
    marginBottom: Shapes.verticalGap,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  chartWrapper: {
    height: 140,
    justifyContent: 'flex-end',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 110,
    paddingBottom: 4,
  },
  dayGroup: {
    alignItems: 'center',
    width: 70,
  },
  barsPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 94,
    marginBottom: 6,
  },
  bar: {
    width: 24,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  dayLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
});
