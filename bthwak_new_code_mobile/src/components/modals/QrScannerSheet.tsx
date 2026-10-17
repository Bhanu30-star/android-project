import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';

interface QrScannerSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const QrScannerSheet: React.FC<QrScannerSheetProps> = ({
  visible,
  onClose,
}) => {
  const [torchOn, setTorchOn] = useState(false);

  const handleSimulateScan = () => {
    Alert.alert(
      'Web Session Authenticated',
      'Your desktop browser session has been securely authorized. You are now logged into BTHAWK Web.',
      [{ text: 'Done', onPress: onClose }]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.iconCircle}>
              <Feather name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.topBarTitle}>Scan BTHAWK Web QR</Text>

            <TouchableOpacity
              onPress={() => setTorchOn(!torchOn)}
              style={[styles.iconCircle, torchOn && styles.iconCircleActive]}
            >
              <Ionicons
                name={torchOn ? 'flash' : 'flash-outline'}
                size={20}
                color={torchOn ? '#FDE047' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>

          {/* VIEWFINDER TARGET AREA */}
          <View style={styles.centerArea}>
            <View style={styles.viewfinder}>
              {/* CORNER MARKS */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              <View style={styles.laserBeam} />

              <Text style={styles.aimText}>Align QR code within frame</Text>
            </View>
          </View>

          {/* BOTTOM INSTRUCTIONS */}
          <View style={styles.bottomCard}>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Open <Text style={styles.bold}>https://app.bthawk.com</Text> on PC
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Select the <Text style={styles.bold}>QR Code tab</Text> on login screen
              </Text>
            </View>

            <TouchableOpacity
              style={styles.simulateBtn}
              activeOpacity={0.8}
              onPress={handleSimulateScan}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.simulateBtnText}>Authenticate Desktop Session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(253, 224, 71, 0.3)',
  },
  centerArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderColor: Theme.colors.primary,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  laserBeam: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: Theme.colors.primary,
    opacity: 0.8,
  },
  aimText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 180,
  },
  bottomCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.md,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  bold: {
    fontWeight: '700',
    color: '#93C5FD',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 12,
    marginTop: 6,
  },
  simulateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
