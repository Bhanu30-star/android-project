import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Theme } from '../theme';

interface QrInstructionCardProps {
  onSwitchToPassword: () => void;
}

export const QrInstructionCard: React.FC<QrInstructionCardProps> = ({ onSwitchToPassword }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="qr-code-outline" size={48} color={Theme.colors.primary} />
      </View>

      <Text style={styles.title}>Logging In to BTHAWK Web?</Text>
      <Text style={styles.description}>
        QR Code login is designed to authenticate your desktop/web browser using this mobile app.
      </Text>

      <View style={styles.stepsContainer}>
        <View style={styles.stepRow}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <Text style={styles.stepText}>
            Open <Text style={styles.boldText}>www.bthawk.com</Text> on your computer
          </Text>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <Text style={styles.stepText}>
            Select the <Text style={styles.boldText}>QR Code</Text> tab on your computer
          </Text>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={styles.stepText}>
            Log into this mobile app first, then tap the scanner icon on the dashboard header to scan
            the screen
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onSwitchToPassword}
        style={styles.switchButton}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Switch to password login"
      >
        <Feather name="arrow-left" size={16} color={Theme.colors.primary} />
        <Text style={styles.switchButtonText}>Log in with Password / OTP</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Theme.spacing.lg,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Theme.spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: Theme.typography.sizes.xs + 1,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  switchButtonText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
});
