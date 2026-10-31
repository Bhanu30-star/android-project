import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconName?: keyof typeof Ionicons.glyphMap;
  showDivider?: boolean;
  accessibilityLabel?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  isLoading = false,
  style,
  textStyle,
  iconName,
  showDivider = false,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || isLoading;

  const gradientColors = isDisabled
    ? (['#CBD5E1', '#94A3B8'] as const)
    : (['#0047AB', '#0B5CD6', '#FF7A00', '#FF5500'] as const);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={[styles.touchable, isDisabled && styles.disabledTouchable, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.contentRow}>
            {iconName && (
              <Ionicons
                name={iconName}
                size={20}
                color="#FFFFFF"
                style={styles.leadingIcon}
              />
            )}
            {showDivider && iconName && <View style={styles.buttonDivider} />}
            <Text style={[styles.text, isDisabled && styles.disabledText, textStyle]}>
              {title}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    shadowColor: '#FF6E00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 5,
  },
  disabledTouchable: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingIcon: {
    marginRight: 4,
  },
  buttonDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    marginHorizontal: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabledText: {
    color: '#F1F5F9',
  },
});
