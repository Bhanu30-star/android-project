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
        <Ionicons name="qr-code-outline" size={40} color="#6C7CFF" />
      </View>

      <Text style={styles.title}>Logging In to BTHAWK Web?</Text>
      <Text style={styles.description}>
        QR Code login allows you to securely authenticate your desktop or web browser instantly.
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
            Log into this mobile app, then tap the QR scanner icon on your dashboard to scan the screen
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
        <Feather name="arrow-left" size={16} color="#6C7CFF" />
        <Text style={styles.switchButtonText}>Log in with Password / OTP</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1E1D36',
    borderWidth: 1,
    borderColor: '#2A2D4A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F2F2FA',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#9AA0BF',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#17162A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2D4A',
    padding: 14,
    marginBottom: 18,
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6C7CFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#9AA0BF',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#F2F2FA',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 9999,
    backgroundColor: '#1E1D36',
    borderWidth: 1,
    borderColor: '#2A2D4A',
  },
  switchButtonText: {
    fontSize: 13,
    color: '#6C7CFF',
    fontWeight: '700',
  },
});
