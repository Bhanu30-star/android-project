import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Shadows } from '@/theme';

interface MiniStatTileProps {
  label: string;
  value: number | string;
  valueColor: string;
  onPress?: () => void;
}

export const MiniStatTile: React.FC<MiniStatTileProps> = ({
  label,
  value,
  valueColor,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole="button"
    >
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
    ...Shadows.circleBtn,
  },
  value: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 20,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
    marginBottom: 2,
  },
  label: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
});
