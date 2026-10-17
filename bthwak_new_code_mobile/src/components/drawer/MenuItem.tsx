import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Typography } from '@/theme';

interface MenuItemProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  isActive?: boolean;
  onPress: () => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  icon,
  isActive = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.row, isActive && styles.rowActive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather
        name={icon}
        size={20}
        color={isActive ? '#2A2470' : '#4F46E5'}
      />
      <Text
        style={[
          styles.label,
          isActive && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowActive: {
    backgroundColor: '#EEEDFF',
  },
  label: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#1B1840',
    flex: 1,
  },
  labelActive: {
    color: '#2A2470',
  },
});
