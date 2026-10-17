import React, { useState, forwardRef, useRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '../theme';

export interface AppInputProps extends TextInputProps {
  label: string;
  iconName?: keyof typeof Feather.glyphMap;
  error?: string;
  rightAction?: React.ReactNode;
}

export const AppInput = forwardRef<any, AppInputProps>(
  ({ label, iconName, error, rightAction, style, value, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const innerRef = useRef<any>(null);

    useImperativeHandle(ref, () => innerRef.current);

    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          onPress={() => innerRef.current?.focus()}
          style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
            !!error && styles.inputContainerError,
          ]}
        >
          {iconName && (
            <Feather
              name={iconName}
              size={18}
              color={isFocused ? Theme.colors.primary : Theme.colors.tabInactiveText}
              style={styles.leadingIcon}
            />
          )}

          <TextInput
            ref={innerRef}
            value={value ?? ''}
            placeholderTextColor={Theme.colors.textMuted}
            style={[styles.input, style]}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            accessibilityLabel={label}
            {...props}
          />

          {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
        </Pressable>

        {!!error && (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        )}
      </View>
    );
  }
);

AppInput.displayName = 'AppInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: Theme.spacing.md,
    minHeight: 48,
  },
  inputContainerFocused: {
    borderColor: Theme.colors.inputBorderFocused,
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderColor: Theme.colors.error,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: Theme.typography.sizes.base,
    color: Theme.colors.textPrimary,
    paddingVertical: 10,
    minHeight: 44,
  },
  rightAction: {
    marginLeft: 8,
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: Theme.typography.sizes.xs,
    marginTop: 4,
    marginLeft: 2,
  },
});
