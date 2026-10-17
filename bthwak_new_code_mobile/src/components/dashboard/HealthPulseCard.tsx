import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/theme';
import { DashboardData } from '@/api/dashboard';
import { useApp } from '@/context/AppContext';

interface HealthPulseCardProps {
  data: DashboardData | null;
  onPressAction?: () => void;
}

export const HealthPulseCard: React.FC<HealthPulseCardProps> = ({
  data,
  onPressAction,
}) => {
  const { formatAmount } = useApp();

  const collected = (data?.cashCollected || 0) + (data?.bankCollected || 0);
  const receivables = data?.outstandingCollected || 0;
  const payables = data?.outstandingPay || 0;
  const netLiquidity = (data?.cashBalance || 0) + (data?.bankBalance || 0);

  // Compute a 1-100 score based on cash health & collection ratio
  let score = 88;
  if (receivables > collected && collected > 0) {
    score = 76;
  } else if (netLiquidity > payables) {
    score = 94;
  }

  const isOptimal = score >= 85;

  return (
    <LinearGradient
      colors={['#1E1B4B', '#2E1065']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* TOP ROW: PULSE BADGE & SCORE */}
      <View style={styles.topRow}>
        <View style={styles.titleBadge}>
          <Ionicons name="pulse-outline" size={16} color="#38BDF8" />
          <Text style={styles.titleBadgeText}>FINANCIAL HEALTH PULSE</Text>
        </View>

        <View style={[styles.scoreBadge, isOptimal ? styles.scoreGood : styles.scoreWarn]}>
          <Text style={styles.scoreText}>{score}/100</Text>
          <Text style={styles.scoreLabel}>{isOptimal ? 'Optimal' : 'Attention'}</Text>
        </View>
      </View>

      {/* CENTER: KEY LIQUIDITY METRIC */}
      <View style={styles.centerBlock}>
        <Text style={styles.metricLabel}>Total Liquid Capital</Text>
        <Text style={styles.metricValue}>{formatAmount(netLiquidity)}</Text>
        <Text style={styles.metricSub}>
          Cash in hand & available bank deposits across distributor accounts
        </Text>
      </View>

      {/* METRIC CHIPS ROW */}
      <View style={styles.chipsRow}>
        <View style={styles.chip}>
          <Text style={styles.chipLabel}>Collected</Text>
          <Text style={[styles.chipVal, { color: '#34D399' }]}>
            {formatAmount(collected)}
          </Text>
        </View>

        <View style={styles.chipDivider} />

        <View style={styles.chip}>
          <Text style={styles.chipLabel}>To Collect</Text>
          <Text style={[styles.chipVal, { color: '#FDBA74' }]}>
            {formatAmount(receivables)}
          </Text>
        </View>

        <View style={styles.chipDivider} />

        <View style={styles.chip}>
          <Text style={styles.chipLabel}>To Pay</Text>
          <Text style={[styles.chipVal, { color: '#FCA5A5' }]}>
            {formatAmount(payables)}
          </Text>
        </View>
      </View>

      {/* ACTION SUGGESTION BANNER */}
      <TouchableOpacity
        style={styles.actionBanner}
        activeOpacity={0.8}
        onPress={onPressAction}
      >
        <Feather name="zap" size={14} color="#FDE047" />
        <Text style={styles.actionBannerText} numberOfLines={1}>
          {receivables > 0
            ? `${formatAmount(receivables)} pending from parties • Tap to send reminders`
            : `All collections synchronized for this period`}
        </Text>
        <Feather name="arrow-right" size={14} color="#FFFFFF" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.md + 2,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  titleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  titleBadgeText: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  scoreGood: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  scoreWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scoreLabel: {
    color: '#D1FAE5',
    fontSize: 10,
    fontWeight: '700',
  },
  centerBlock: {
    marginBottom: Theme.spacing.md,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  metricSub: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  chipsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: Theme.spacing.md,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
  },
  chipLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  chipVal: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  chipDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.md,
  },
  actionBannerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
