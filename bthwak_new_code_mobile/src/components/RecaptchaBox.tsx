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
    // Simulate quick verification or generate mobile verification token
    setTimeout(() => {
      setIsVerifying(false);
      onVerify('mobile_recaptcha_verified_' + Date.now());
    }, 600);
  };

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[styles.container, !!error && styles.containerError]}
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
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            ) : verified ? (
              <Ionicons name="checkmark" size={20} color={Theme.colors.success} />
            ) : null}
          </View>
          <Text style={styles.label}>I&apos;m not a robot</Text>
        </View>

        {/* Right Side: ReCAPTCHA branding */}
        <View style={styles.brandSection}>
          <View style={styles.brandIconWrapper}>
            <Ionicons name="reload-circle-outline" size={26} color="#1A73E8" />
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
    marginVertical: Theme.spacing.sm,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 10,
    width: '100%',
    maxWidth: 300,
  },
  containerError: {
    borderColor: Theme.colors.error,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxSquare: {
    width: 26,
    height: 26,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#C1C7D0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareVerified: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  checkboxSquareVerifying: {
    borderColor: Theme.colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#222222',
  },
  brandSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  brandIconWrapper: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#555555',
    marginTop: 1,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 8,
    color: '#777777',
  },
  termsDot: {
    fontSize: 8,
    color: '#777777',
  },
  errorText: {
    color: Theme.colors.error,
    fontSize: Theme.typography.sizes.xs,
    marginTop: 4,
    textAlign: 'center',
  },
});
