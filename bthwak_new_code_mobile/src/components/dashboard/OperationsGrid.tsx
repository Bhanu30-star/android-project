import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { DashboardData } from '@/api/dashboard';

interface OperationsGridProps {
  data: DashboardData | null;
}

export const OperationsGrid: React.FC<OperationsGridProps> = ({ data }) => {
  return (
    <View style={styles.grid}>
      {/* 1. FSE */}
      <View style={styles.tile}>
        <View style={styles.tileTop}>
          <Text style={styles.tileLabel}>FSE</Text>
          <View style={[styles.iconPill, { backgroundColor: '#EFF6FF' }]}>
            <Feather name="users" size={14} color="#2563EB" />
          </View>
        </View>
        <Text style={styles.tileValue}>
          {(data?.totalFSE ?? 0).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.tileSub}>Field Sales Exec</Text>
      </View>

      {/* 2. PENDING STOCK */}
      <View style={styles.tile}>
        <View style={styles.tileTop}>
          <Text style={styles.tileLabel}>Pending Stock</Text>
          <View style={[styles.iconPill, { backgroundColor: '#ECFDF5' }]}>
            <Feather name="box" size={14} color="#10B981" />
          </View>
        </View>
        <Text style={[styles.tileValue, { color: '#10B981' }]}>
          {(data?.pendingStockReq ?? 0).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.tileSub}>Awaiting approval</Text>
      </View>

      {/* 3. STOCK APPROVED */}
      <View style={styles.tile}>
        <View style={styles.tileTop}>
          <Text style={styles.tileLabel}>Stock Approved</Text>
          <View style={[styles.iconPill, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="check-square" size={14} color="#D97706" />
          </View>
        </View>
        <Text style={[styles.tileValue, { color: '#D97706' }]}>
          {(data?.stockApproved ?? 0).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.tileSub}>Approved requests</Text>
      </View>

      {/* 4. DSR */}
      <View style={styles.tile}>
        <View style={styles.tileTop}>
          <Text style={styles.tileLabel}>DSR</Text>
          <View style={[styles.iconPill, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="clipboard-outline" size={14} color="#4F46E5" />
          </View>
        </View>
        <Text style={[styles.tileValue, { color: '#4F46E5' }]}>
          {(data?.totalDSR ?? 0).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.tileSub}>Daily sales reports</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  tile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.sm + 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconPill: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  tileSub: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
});
