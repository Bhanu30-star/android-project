import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

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
        size={18}
        color={isActive ? '#6C7CFF' : '#F2F2FA'}
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
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 2,
  },
  rowActive: {
    backgroundColor: '#1E2540',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#F2F2FA',
  },
  labelActive: {
    color: '#6C7CFF',
    fontWeight: '600',
  },
});
