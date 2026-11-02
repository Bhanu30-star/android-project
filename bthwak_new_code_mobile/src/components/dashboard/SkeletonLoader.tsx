import React from 'react';
import { View, StyleSheet } from 'react-native';

export const SkeletonLoader: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Hero Cards Skeleton */}
      <View style={styles.heroRow}>
        <View style={styles.heroSkeletonCard}>
          <View style={styles.heroBadgePlaceholder} />
          <View style={styles.heroValuePlaceholder} />
        </View>
        <View style={styles.heroSkeletonCard}>
          <View style={styles.heroBadgePlaceholder} />
          <View style={styles.heroValuePlaceholder} />
        </View>
      </View>

      {/* 2. Grid Skeleton */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heroSkeletonCard: {
    flex: 1,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    justifyContent: 'space-between',
  },
  heroBadgePlaceholder: {
    width: 60,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F1FC',
  },
  heroValuePlaceholder: {
    width: 100,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardSkeleton: {
    flex: 1,
    height: 104,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    justifyContent: 'space-between',
  },
  chipPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F1FC',
  },
  statLabelPlaceholder: {
    width: 70,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  statValPlaceholder: {
    width: 60,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
});
