import React, { useState, forwardRef } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppInput, AppInputProps } from './AppInput';
import { Theme } from '../theme';

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
          >
            <Feather
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={18}
              color={Theme.colors.tabInactiveText}
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
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
