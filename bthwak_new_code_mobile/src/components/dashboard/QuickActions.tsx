import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';

export const QuickActions: React.FC = () => {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <View style={styles.container}>
      {/* SCAN WEB QR PROMPT CARD */}
      <View style={styles.scannerCard}>
        <View style={styles.scannerIconWrapper}>
          <Ionicons name="qr-code-outline" size={24} color={Theme.colors.primary} />
        </View>
        <View style={styles.scannerTextGroup}>
          <Text style={styles.scannerTitle}>Login to BTHAWK Web</Text>
          <Text style={styles.scannerSubtitle}>
            Scan the QR code displayed on your desktop screen to instantly log in.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.scanPill}
          activeOpacity={0.8}
          onPress={() => setShowQrModal(true)}
        >
          <Feather name="camera" size={14} color="#FFFFFF" />
          <Text style={styles.scanPillText}>Scan</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL FOR QR SCANNER EXPLANATION */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="qr-code" size={36} color={Theme.colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Desktop Web Pairing</Text>
            <Text style={styles.modalDesc}>
              1. Open <Text style={styles.boldText}>https://app.bthawk.com</Text> on your computer.{'\n'}
              2. Click on the <Text style={styles.boldText}>QR Code</Text> tab.{'\n'}
              3. Point your camera at the QR code to sign in directly without typing your password.
            </Text>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowQrModal(false)}
            >
              <Text style={styles.closeBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  scannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...Theme.shadows.card,
  },
  scannerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTextGroup: {
    flex: 1,
  },
  scannerTitle: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  scannerSubtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  scanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.borderRadius.md,
  },
  scanPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  modalTitle: {
    fontSize: Theme.typography.sizes.base,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  boldText: {
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  closeBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: Theme.borderRadius.md,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
