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
import { Feather, Ionicons } from '@expo/vector-icons';

export interface AppInputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof Feather.glyphMap;
  ioniconsName?: keyof typeof Ionicons.glyphMap;
  error?: string;
  rightAction?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const AppInput = forwardRef<any, AppInputProps>(
  (
    {
      label,
      iconName,
      ioniconsName,
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
          {ioniconsName ? (
            <Ionicons
              name={ioniconsName}
              size={18}
              color={isFocused ? '#0047AB' : '#0E204E'}
              style={styles.leadingIcon}
            />
          ) : iconName ? (
            <Feather
              name={iconName}
              size={18}
              color={isFocused ? '#0047AB' : '#0E204E'}
              style={styles.leadingIcon}
            />
          ) : null}

          {(iconName || ioniconsName) && <View style={styles.verticalDivider} />}

          <TextInput
            ref={innerRef}
            value={value ?? ''}
            placeholderTextColor="#8E9CAE"
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
            <Feather name="alert-circle" size={13} color="#DC2626" />
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
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 9999,
    height: 52,
    paddingHorizontal: 16,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: '#0047AB',
    shadowOpacity: 0.1,
    shadowColor: '#0047AB',
  },
  inputContainerError: {
    borderColor: '#DC2626',
    backgroundColor: '#FFF8F8',
  },
  leadingIcon: {
    marginRight: 4,
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#DCE6F2',
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
    fontWeight: '500',
  },
  rightAction: {
    marginLeft: 8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 12,
    gap: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
  },
});
