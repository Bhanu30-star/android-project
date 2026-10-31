import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

interface QrInstructionCardProps {
  onSwitchToPassword: () => void;
}

export const QrInstructionCard: React.FC<QrInstructionCardProps> = ({ onSwitchToPassword }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="qr-code-outline" size={38} color="#0047AB" />
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
        <Feather name="arrow-left" size={16} color="#0047AB" />
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
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F0F5FC',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F1FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#5A6B87',
    lineHeight: 18,
  },
  boldText: {
    color: '#0E204E',
    fontWeight: '700',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  switchButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0047AB',
  },
});
