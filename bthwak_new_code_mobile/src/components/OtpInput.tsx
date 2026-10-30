import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  NativeSyntheticEvent,
} from 'react-native';

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
  const lastCompletedRef = useRef<string>('');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (value.length === 6 && lastCompletedRef.current !== value) {
      lastCompletedRef.current = value;
      onCompleteRef.current?.(value);
    } else if (value.length < 6) {
      lastCompletedRef.current = '';
    }
  }, [value]);

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

    const currentDigits = (value || '').padEnd(6, ' ').split('');
    currentDigits[index] = cleanDigits.slice(-1) || ' ';
    const newOtp = currentDigits.join('').replace(/\s+$/, '');
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
      const currentDigits = (value || '').split('');
      if (!currentDigits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const digits = value.padEnd(6, ' ').slice(0, 6).split('');

  return (
    <View style={styles.container} accessibilityRole="none">
      {digits.map((digit, index) => {
        const char = digit.trim();
        const isFilled = !!char;
        const isCurrentFocus = value.length === index;

        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputsRef.current[index] = ref;
            }}
            value={char}
            onChangeText={(text) => handleDigitChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={6}
            style={[
              styles.digitBox,
              isFilled && styles.digitBoxFilled,
              isCurrentFocus && styles.digitBoxActive,
              hasError && styles.digitBoxError,
            ]}
            textAlign="center"
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
    alignItems: 'center',
    width: '100%',
    marginVertical: 14,
    gap: 8,
  },
  digitBox: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2D4A',
    backgroundColor: '#17162A',
    fontSize: 22,
    fontWeight: '700',
    color: '#F2F2FA',
    textAlign: 'center',
  },
  digitBoxFilled: {
    borderColor: '#6C7CFF',
    backgroundColor: '#1E1D36',
    color: '#F2F2FA',
  },
  digitBoxActive: {
    borderColor: '#6C7CFF',
    backgroundColor: '#1E1D36',
    shadowColor: '#6C7CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  digitBoxError: {
    borderColor: '#FF5C6C',
    backgroundColor: '#26131D',
  },
});
