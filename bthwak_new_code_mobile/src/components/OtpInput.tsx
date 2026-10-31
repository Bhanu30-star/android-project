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

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const char = value[index] || '';
        const isFilled = !!char.trim();
        const isCurrentFocus =
          value.length === index || (index === 5 && value.length === 6);

        return (
          <TextInput
            key={index}
            ref={(r) => {
              inputsRef.current[index] = r;
            }}
            value={char.trim()}
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
    borderColor: '#DFE7F2',
    backgroundColor: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    color: '#0E204E',
    textAlign: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  digitBoxFilled: {
    borderColor: '#0047AB',
    backgroundColor: '#F0F6FF',
    color: '#0E204E',
  },
  digitBoxActive: {
    borderColor: '#0047AB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  digitBoxError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
  },
});
