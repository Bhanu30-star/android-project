import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Rect, Circle } from 'react-native-svg';
import { Colors, Typography, Shapes, Shadows } from '@/theme';

export interface StatCardProps {
  label: string;
  value: string;
  iconName?: keyof typeof Feather.glyphMap;
  isBanknote?: boolean;
  chipBg: string;
  chipIconColor: string;
  valueColor?: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  iconName = 'shopping-cart',
  isBanknote = false,
  chipBg,
  chipIconColor,
  valueColor = Colors.text,
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
      <View style={[styles.iconChip, { backgroundColor: chipBg }]}>
        {isBanknote ? (
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Rect
              x="2"
              y="5"
              width="20"
              height="14"
              rx="2.5"
              stroke={chipIconColor}
              strokeWidth="2"
            />
            <Circle
              cx="12"
              cy="12"
              r="2.8"
              stroke={chipIconColor}
              strokeWidth="2"
            />
          </Svg>
        ) : (
          <Feather name={iconName} size={18} color={chipIconColor} />
        )}
      </View>

      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>

      <Text
        style={[styles.value, { color: valueColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.card,
    borderRadius: Shapes.cardRadius,
    padding: Shapes.cardPadding,
    ...Shadows.card,
  },
  iconChip: {
    width: Shapes.iconChipSize,
    height: Shapes.iconChipSize,
    borderRadius: Shapes.iconChipRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.statLabel,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    ...Typography.statValue,
    fontVariant: ['tabular-nums'],
  },
});
