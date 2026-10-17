import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shapes, Shadows } from '@/theme/tokens';

interface SignatureCanvasModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (base64Svg: string) => void;
}

export const SignatureCanvasModal: React.FC<SignatureCanvasModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentPath(`M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentPath((prev) => `${prev} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
        },
        onPanResponderRelease: () => {
          setCurrentPath((curr) => {
            if (curr) {
              setPaths((prev) => [...prev, curr]);
            }
            return '';
          });
        },
      }),
    []
  );

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const handleDone = () => {
    if (paths.length === 0 && !currentPath) {
      onSave('');
      onClose();
      return;
    }
    const allPaths = currentPath ? [...paths, currentPath] : paths;
    // Generate simple SVG data URL
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">${allPaths
      .map((d) => `<path d="${d}" stroke="#1B1840" stroke-width="2.5" fill="none" stroke-linecap="round"/>`)
      .join('')}</svg>`;
    const base64 = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    onSave(base64);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Authorized Signature</Text>
              <Text style={styles.subtitle}>Sign within the box below</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.canvasContainer} {...panResponder.panHandlers}>
            <Svg height="180" width="100%" style={styles.svg}>
              {paths.map((d, index) => (
                <Path
                  key={index}
                  d={d}
                  stroke={Colors.text}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {currentPath ? (
                <Path
                  d={currentPath}
                  stroke={Colors.text}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
            </Svg>
            {paths.length === 0 && !currentPath && (
              <View style={styles.placeholder}>
                <Feather name="edit-3" size={24} color={Colors.tabBorder} />
                <Text style={styles.placeholderText}>Draw your signature here</Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
              <Feather name="trash-2" size={16} color="#B01E25" />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleDone} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save Signature</Text>
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
    backgroundColor: 'rgba(27, 24, 64, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.radiusLarge,
    width: '100%',
    padding: 20,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasContainer: {
    height: 180,
    backgroundColor: '#FAF9FF',
    borderRadius: Shapes.radiusMedium,
    borderWidth: 1.5,
    borderColor: Colors.tabBorder,
    borderStyle: 'dashed',
    position: 'relative',
    overflow: 'hidden',
  },
  svg: {
    flex: 1,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  placeholderText: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Shapes.radiusMedium,
    backgroundColor: '#FFE3E3',
    gap: 6,
  },
  clearBtnText: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#B01E25',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Shapes.radiusMedium,
  },
  saveBtnText: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
