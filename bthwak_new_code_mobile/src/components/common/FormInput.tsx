import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shapes } from '@/theme';

export interface FormInputProps extends Omit<TextInputProps, 'onChangeText'> {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  onValidate?: (val: string) => string | null;
  isPassword?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  required,
  value,
  onChangeText,
  error: externalError,
  onValidate,
  isPassword = false,
  disabled = false,
  helperText,
  multiline = false,
  numberOfLines = 1,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasBlurred, setHasBlurred] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const activeError = externalError || (hasBlurred ? localError : null);

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    setHasBlurred(true);
    if (onValidate) {
      const err = onValidate(value);
      setLocalError(err);
    }
    rest.onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (hasBlurred && onValidate) {
      const err = onValidate(text);
      setLocalError(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
          isFocused && styles.inputWrapperFocused,
          activeError ? styles.inputWrapperError : null,
          disabled && styles.inputWrapperDisabled,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          editable={!disabled}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor={Colors.textSecondary}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            activeError ? styles.inputErrorText : null,
            style,
          ]}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {activeError ? (
        <Text style={styles.errorMessage}>{activeError}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  label: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: Colors.error,
    fontFamily: Typography.fontFamily.bold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: Shapes.buttons.minHeight,
    paddingHorizontal: 14,
  },
  multilineWrapper: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputWrapperFocused: {
    borderColor: Colors.inputBorderFocused,
    backgroundColor: '#FFFFFF',
  },
  inputWrapperError: {
    borderColor: Colors.inputBorderError,
    backgroundColor: Colors.inputBgError,
  },
  inputWrapperDisabled: {
    opacity: 0.65,
    backgroundColor: '#F0EFFB',
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputErrorText: {
    color: Colors.text,
  },
  eyeBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
    marginTop: 4,
  },
  helperText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textSecondary,
    marginTop: 3,
  },
});
