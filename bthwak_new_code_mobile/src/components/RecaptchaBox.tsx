import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

interface RecaptchaBoxProps {
  verified: boolean;
  onVerify: (token: string) => void;
  error?: string;
}

export const RecaptchaBox: React.FC<RecaptchaBoxProps> = ({
  verified,
  onVerify,
  error,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const handlePress = () => {
    if (verified || isVerifying) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onVerify('mobile_recaptcha_verified_' + Date.now());
    }, 500);
  };

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[styles.container, !!error && styles.containerError, verified && styles.containerVerified]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: verified }}
        accessibilityLabel="I'm not a robot reCAPTCHA verification"
      >
        {/* Left Side: Checkbox + Text */}
        <View style={styles.leftSection}>
          <View
            style={[
              styles.checkboxSquare,
              verified && styles.checkboxSquareVerified,
              isVerifying && styles.checkboxSquareVerifying,
            ]}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color="#FF5B00" />
            ) : verified ? (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            ) : null}
          </View>
          <Text style={styles.label}>I&apos;m not a robot</Text>
        </View>

        {/* Right Side: ReCAPTCHA branding */}
        <View style={styles.brandSection}>
          <View style={styles.brandIconWrapper}>
            <Ionicons name="shield-checkmark-outline" size={22} color={verified ? '#16A34A' : '#3B82F6'} />
          </View>
          <Text style={styles.brandText}>reCAPTCHA</Text>
          <View style={styles.termsRow}>
            <Text style={styles.termsText}>Privacy</Text>
            <Text style={styles.termsDot}>•</Text>
            <Text style={styles.termsText}>Terms</Text>
          </View>
        </View>
      </TouchableOpacity>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#17162A',
    borderWidth: 1,
    borderColor: '#2A2D4A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  containerVerified: {
    borderColor: '#2DD4A8',
    backgroundColor: '#162828',
  },
  containerError: {
    borderColor: '#FF5C6C',
    backgroundColor: '#26131D',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#2A2D4A',
    backgroundColor: '#1E1D36',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareVerified: {
    borderColor: '#2DD4A8',
    backgroundColor: '#2DD4A8',
  },
  checkboxSquareVerifying: {
    borderColor: '#6C7CFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F2F2FA',
  },
  brandSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  brandIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9AA0BF',
    marginTop: 1,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 8,
    color: '#5B6084',
  },
  termsDot: {
    fontSize: 8,
    color: '#5B6084',
  },
  errorText: {
    color: '#FF5C6C',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
