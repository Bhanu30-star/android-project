import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shadows } from '@/theme';

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error';
  onDismiss?: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  onDismiss,
  duration = 3000,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDismiss?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      opacityAnim.setValue(0);
      translateYAnim.setValue(-20);
    }
  }, [visible, duration, onDismiss, opacityAnim, translateYAnim]);

  if (!visible) return null;

  const isSuccess = type === 'success';

  return (
    <Animated.View
      style={[
        styles.container,
        isSuccess ? styles.successBg : styles.errorBg,
        {
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      <Feather
        name={isSuccess ? 'check-circle' : 'alert-circle'}
        size={18}
        color="#FFFFFF"
      />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
    ...Shadows.card,
  },
  successBg: {
    backgroundColor: '#059669',
  },
  errorBg: {
    backgroundColor: Colors.error,
  },
  text: {
    flex: 1,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: '#FFFFFF',
  },
});
