import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
} from 'react-native';
import { Theme } from '../theme';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (otp: string) => void;
  hasError?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  onComplete,
  hasError = false,
}) => {
  const inputsRef = useRef<any[]>([]);

  useEffect(() => {
    if (value.length === 6 && onComplete) {
      onComplete(value);
    }
  }, [value, onComplete]);

  const handleDigitChange = (text: string, index: number) => {
    const cleanDigits = text.replace(/[^0-9]/g, '');

    // Handling multi-character paste
    if (cleanDigits.length > 1) {
      const pasted = cleanDigits.slice(0, 6);
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, 5);
      inputsRef.current[nextFocus]?.focus();
      return;
    }

    const currentDigits = value.split('');
    currentDigits[index] = cleanDigits.slice(-1) || '';
    const newOtp = currentDigits.join('').slice(0, 6);
    onChange(newOtp);

    if (cleanDigits && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<{ key: string }>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      const currentDigits = value.split('');
      if (!currentDigits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        currentDigits[index - 1] = '';
        onChange(currentDigits.join(''));
      } else {
        currentDigits[index] = '';
        onChange(currentDigits.join(''));
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, index) => {
        const digit = value[index] || '';
        const isCurrent = index === value.length || (index === 5 && value.length === 6);

        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputsRef.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleDigitChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={index === 0 ? 6 : 1}
            textAlign="center"
            style={[
              styles.box,
              digit ? styles.boxFilled : null,
              isCurrent ? styles.boxCurrent : null,
              hasError ? styles.boxError : null,
            ]}
            selectTextOnFocus
            accessibilityLabel={`OTP digit ${index + 1}`}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: Theme.spacing.md,
    gap: 8,
  },
  box: {
    flex: 1,
    height: 52,
    backgroundColor: Theme.colors.inputBg,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
  },
  boxCurrent: {
    borderColor: Theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  boxFilled: {
    borderColor: Theme.colors.primary,
  },
  boxError: {
    borderColor: Theme.colors.error,
  },
});
