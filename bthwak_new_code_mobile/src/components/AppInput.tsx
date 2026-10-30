import React, { useState, forwardRef, useRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '../theme';

export interface AppInputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof Feather.glyphMap;
  error?: string;
  rightAction?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const AppInput = forwardRef<any, AppInputProps>(
  (
    {
      label,
      iconName,
      error,
      rightAction,
      style,
      containerStyle,
      value,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const innerRef = useRef<any>(null);

    useImperativeHandle(ref, () => innerRef.current);

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
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
              size={19}
              color={isFocused ? '#6C7CFF' : '#5B6084'}
              style={styles.leadingIcon}
            />
          )}

          <TextInput
            ref={innerRef}
            value={value ?? ''}
            placeholderTextColor="#5B6084"
            style={[styles.input, style]}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            accessibilityLabel={label || props.placeholder}
            {...props}
          />

          {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
        </Pressable>

        {!!error && (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={13} color="#FF5C6C" />
            <Text style={styles.errorText} accessibilityRole="alert">
              {error}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

AppInput.displayName = 'AppInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9AA0BF',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17162A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2D4A',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputContainerFocused: {
    borderColor: '#6C7CFF',
    backgroundColor: '#1E1D36',
    shadowColor: '#6C7CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: '#FF5C6C',
    backgroundColor: '#26131D',
  },
  leadingIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#F2F2FA',
    paddingVertical: 10,
    fontWeight: '500',
  },
  rightAction: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF5C6C',
    fontWeight: '500',
  },
});
