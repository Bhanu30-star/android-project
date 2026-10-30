import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

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
      style={[
        styles.touchable,
        isDisabled ? styles.disabledTouchable : styles.activeTouchable,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color="#F2F2FA" size="small" />
      ) : (
        <Text style={[styles.text, isDisabled && styles.disabledText, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    height: 50,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  activeTouchable: {
    backgroundColor: '#2A3D6E',
    shadowColor: '#2A3D6E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  disabledTouchable: {
    backgroundColor: '#1E2540',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: '#F2F2FA',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabledText: {
    color: '#5B6084',
  },
});
