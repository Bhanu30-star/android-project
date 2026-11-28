import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';

export interface BthawkLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: number;
  textColor?: string;
}

export const MandioLogo: React.FC<BthawkLogoProps> = ({
  size = 56,
  showText = false,
  textSize = 20,
  textColor = '#0E204E',
}) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Rect width="120" height="120" rx="24" fill="#C2410C" />
        <Polygon points="30,28 90,28 98,50 22,50" fill="#FFFFFF" />
        <Path
          d="M22 50 a12.67 12 0 0 0 25.33 0 a12.67 12 0 0 0 25.33 0 a12.67 12 0 0 0 25.34 0 Z"
          fill="#FDE68A"
        />
        <Rect x="32" y="72" width="56" height="22" rx="4" fill="#FFFFFF" />
      </Svg>

      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { fontSize: textSize, color: textColor }]}>
            Mandio
          </Text>
        </View>
      )}
    </View>
  );
};

export const BthawkLogo = MandioLogo;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: 0.5,
  },
  brandAccent: {
    color: '#FF6E00',
  },
});
