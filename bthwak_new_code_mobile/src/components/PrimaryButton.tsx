import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  isLoading = false,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={[styles.touchable, isDisabled && styles.disabledTouchable, style]}
    >
      <LinearGradient
        colors={isDisabled ? Theme.colors.primaryGradientDisabled : Theme.colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={[styles.text, isDisabled && styles.disabledText, textStyle]}>
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
    ...Theme.shadows.button,
  },
  disabledTouchable: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
  },
  text: {
    color: '#FFFFFF',
    fontSize: Theme.typography.sizes.base,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabledText: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
