import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { updateLoginQrStatusApi } from '@/api/auth';
import { getAuthToken } from '@/utils/secureStore';

interface QrScannerSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const QrScannerSheet: React.FC<QrScannerSheetProps> = ({
  visible,
  onClose,
}) => {
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setSubmitting(false);
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible, permission?.granted, requestPermission]);

  const extractQrToken = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    try {
      if (trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        if (parsed?.qr_token) return String(parsed.qr_token).trim();
        if (parsed?.token) return String(parsed.token).trim();
      }
      if (trimmed.includes('qr_token=')) {
        const url = new URL(trimmed);
        const qp = url.searchParams.get('qr_token');
        if (qp) return qp.trim();
      }
    } catch {
      // Fallback to raw trimmed token
    }
    return trimmed;
  };

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || submitting) return;
    const qrToken = extractQrToken(result?.data || '');
    if (!qrToken) return;

    setScanned(true);
    setSubmitting(true);

    try {
      const authToken = token || (await getAuthToken());
      if (!authToken) {
        Alert.alert('Not Logged In', 'Please log in on this phone first before scanning.', [
          { text: 'OK', onPress: () => setScanned(false) },
        ]);
        setSubmitting(false);
        return;
      }

      const res = await updateLoginQrStatusApi(qrToken, authToken);
      if (res?.status) {
        Alert.alert(
          'Web Session Authenticated',
          'Your desktop dashboard has been logged in successfully.',
          [{ text: 'Done', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Scan Failed',
          res?.message || 'Could not verify QR code. Please refresh QR on web and try again.',
          [{ text: 'Retry', onPress: () => setScanned(false) }]
        );
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'QR code expired or invalid. Refresh QR and try again.';
      Alert.alert('QR Login Failed', errMsg, [
        { text: 'Retry', onPress: () => setScanned(false) },
      ]);
    } finally {
      setSubmitting(false);
    }
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
          {/* CAMERA BACKGROUND */}
          {visible && permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torchOn}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
          ) : null}

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
            {!permission?.granted ? (
              <View style={styles.permissionBox}>
                <Text style={styles.permissionText}>
                  Camera permission is required to scan QR codes.
                </Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                  <Text style={styles.permissionBtnText}>Allow Camera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {submitting ? (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.aimText}>Authenticating Web...</Text>
                  </View>
                ) : (
                  <Text style={styles.aimText}>Align QR code within frame</Text>
                )}
              </View>
            )}
          </View>

          {/* BOTTOM INSTRUCTIONS */}
          <View style={styles.bottomCard}>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Open <Text style={styles.boldText}>app.bthawk.com</Text> and click &quot;Login With QR&quot;
              </Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Point camera at the QR code — dashboard logs in automatically
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(253,224,71,0.25)',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  aimText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  loadingOverlay: {
    alignItems: 'center',
    gap: 10,
  },
  permissionBox: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 32,
  },
  permissionText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
  },
  permissionBtn: {
    backgroundColor: '#2C3179',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomCard: {
    backgroundColor: 'rgba(15,23,42,0.88)',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
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
    backgroundColor: '#2C3179',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    color: '#E2E8F0',
    fontSize: 13,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
