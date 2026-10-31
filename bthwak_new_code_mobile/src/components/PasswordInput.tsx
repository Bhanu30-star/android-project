import React, { useState, forwardRef } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppInput, AppInputProps } from './AppInput';

export type PasswordInputProps = Omit<AppInputProps, 'rightAction' | 'secureTextEntry'>;

export const PasswordInput = forwardRef<any, PasswordInputProps>(
  ({ iconName = 'lock', ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
      <AppInput
        ref={ref}
        iconName={iconName}
        secureTextEntry={!isPasswordVisible}
        rightAction={
          <TouchableOpacity
            onPress={() => setIsPasswordVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.eyeButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={isPasswordVisible ? '#0047AB' : '#8E9CAE'}
            />
          </TouchableOpacity>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

const styles = StyleSheet.create({
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
