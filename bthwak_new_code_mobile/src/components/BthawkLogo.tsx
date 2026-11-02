import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Path,
  Rect,
  G,
} from 'react-native-svg';

export interface BthawkLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: number;
  textColor?: string;
}

export const BthawkLogo: React.FC<BthawkLogoProps> = ({
  size = 56,
  showText = false,
  textSize = 20,
  textColor = '#0E204E',
}) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 140 140" fill="none">
        <Defs>
          {/* Ambient Blue Halo Glow */}
          <RadialGradient id="haloGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
            <Stop offset="55%" stopColor="#3B82F6" stopOpacity="0.08" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>

          {/* Deep Royal Navy Swoosh Gradient */}
          <LinearGradient id="navySwooshGrad" x1="10%" y1="10%" x2="90%" y2="90%">
            <Stop offset="0%" stopColor="#0D3B8E" />
            <Stop offset="50%" stopColor="#07296C" />
            <Stop offset="100%" stopColor="#021742" />
          </LinearGradient>

          {/* Bar 1 Gradient (Bright Cyan Blue) */}
          <LinearGradient id="barGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#00BAFF" />
            <Stop offset="100%" stopColor="#0077D4" />
          </LinearGradient>

          {/* Bar 2 Gradient (Cobalt / Cerulean Blue) */}
          <LinearGradient id="barGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#0080FF" />
            <Stop offset="100%" stopColor="#0050C8" />
          </LinearGradient>

          {/* Bar 3 Gradient (Deep Royal Blue) */}
          <LinearGradient id="barGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#0052EA" />
            <Stop offset="100%" stopColor="#002D8C" />
          </LinearGradient>

          {/* Dynamic Orange Arrow Gradient */}
          <LinearGradient id="orangeArrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF4D00" />
            <Stop offset="45%" stopColor="#FF7700" />
            <Stop offset="100%" stopColor="#FFA600" />
          </LinearGradient>
        </Defs>

        {/* Ambient Soft Glow Behind Logo */}
        <Circle cx="70" cy="70" r="66" fill="url(#haloGlow)" />

        {/* 1. Deep Royal Navy 'V' Wing Swoosh */}
        <Path
          d="M 28 42
             L 44 42
             C 43 57, 49 78, 62 89
             C 70 95, 80 94, 88 87
             C 94 82, 98 73, 100 63
             C 96 71, 90 77, 82 78
             C 74 79, 66 74, 59 65
             C 51 54, 47 43, 46 36
             L 28 42 Z"
          fill="url(#navySwooshGrad)"
        />

        {/* 2. Three Growth Bar Columns */}
        {/* Bar 1 (Shortest - Left) */}
        <Rect x="64" y="55" width="8.5" height="26" rx="4.25" fill="url(#barGrad1)" />

        {/* Bar 2 (Medium - Center) */}
        <Rect x="77" y="40" width="8.5" height="41" rx="4.25" fill="url(#barGrad2)" />

        {/* Bar 3 (Tallest - Right) */}
        <Rect x="90" y="25" width="8.5" height="56" rx="4.25" fill="url(#barGrad3)" />

        {/* 3. Sweeping Orange Flight Swoosh & Soaring Arrowhead */}
        <Path
          d="M 59 104
             C 72 105, 88 98, 100 86
             C 111 75, 118 60, 122 45
             L 110 47
             L 134 29
             L 132 57
             L 124 50
             C 120 64, 113 78, 102 90
             C 88 104, 73 109, 59 104 Z"
          fill="url(#orangeArrowGrad)"
        />
      </Svg>

      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { fontSize: textSize, color: textColor }]}>
            BTHAWK<Text style={styles.brandAccent}>+</Text>
          </Text>
        </View>
      )}
    </View>
  );
};

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
