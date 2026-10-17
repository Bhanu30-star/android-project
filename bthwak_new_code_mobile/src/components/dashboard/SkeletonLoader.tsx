import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Shapes, Shadows } from '@/theme';

export const SkeletonLoader: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Hero Card Skeleton */}
      <View style={styles.heroSkeleton}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroLabelPlaceholder} />
          <View style={styles.heroPillPlaceholder} />
        </View>
        <View style={styles.heroAmountPlaceholder} />
        <View style={styles.heroDivider} />
        <View style={styles.heroBottomRow}>
          <View style={styles.heroColPlaceholder} />
          <View style={styles.heroColPlaceholder} />
        </View>
      </View>

      {/* 2. Overview 2x2 Grid Skeleton */}
      <View style={styles.gridRow}>
        <View style={styles.cardSkeleton}>
          <View style={styles.chipPlaceholder} />
          <View style={styles.statLabelPlaceholder} />
          <View style={styles.statValPlaceholder} />
        </View>
        <View style={styles.cardSkeleton}>
          <View style={styles.chipPlaceholder} />
          <View style={styles.statLabelPlaceholder} />
          <View style={styles.statValPlaceholder} />
        </View>
      </View>
      <View style={styles.gridRow}>
        <View style={styles.cardSkeleton}>
          <View style={styles.chipPlaceholder} />
          <View style={styles.statLabelPlaceholder} />
          <View style={styles.statValPlaceholder} />
        </View>
        <View style={styles.cardSkeleton}>
          <View style={styles.chipPlaceholder} />
          <View style={styles.statLabelPlaceholder} />
          <View style={styles.statValPlaceholder} />
        </View>
      </View>

      {/* 3. Invoices & Payments Skeleton */}
      <View style={styles.listCardSkeleton}>
        <View style={styles.listHeaderPlaceholder} />
        <View style={styles.listLinePlaceholder} />
        <View style={styles.listLinePlaceholder} />
        <View style={styles.listLinePlaceholder} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Shapes.verticalGap,
    paddingVertical: 4,
  },
  heroSkeleton: {
    backgroundColor: '#352E7E',
    borderRadius: Shapes.heroRadius,
    padding: Shapes.heroPadding,
    minHeight: 180,
    ...Shadows.hero,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroLabelPlaceholder: {
    width: 100,
    height: 14,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroPillPlaceholder: {
    width: 90,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroAmountPlaceholder: {
    width: 180,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 16,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroColPlaceholder: {
    width: 110,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  gridRow: {
    flexDirection: 'row',
    gap: Shapes.gridGap,
  },
  cardSkeleton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Shapes.cardRadius,
    padding: Shapes.cardPadding,
    minHeight: 110,
    ...Shadows.card,
  },
  chipPlaceholder: {
    width: Shapes.iconChipSize,
    height: Shapes.iconChipSize,
    borderRadius: Shapes.iconChipRadius,
    backgroundColor: '#ECEBFA',
    marginBottom: 12,
  },
  statLabelPlaceholder: {
    width: 70,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#ECEBFA',
    marginBottom: 6,
  },
  statValPlaceholder: {
    width: 90,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E3E1F7',
  },
  listCardSkeleton: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.cardRadius,
    padding: Shapes.cardPadding,
    gap: 16,
    ...Shadows.card,
  },
  listHeaderPlaceholder: {
    width: 140,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#ECEBFA',
  },
  listLinePlaceholder: {
    width: '100%',
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F5F4FF',
  },
});
