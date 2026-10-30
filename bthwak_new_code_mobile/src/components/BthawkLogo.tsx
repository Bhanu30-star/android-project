import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Circle, Path, G, Rect } from 'react-native-svg';

interface BthawkLogoProps {
  size?: number;
}

export const BthawkLogo: React.FC<BthawkLogoProps> = ({ size = 56 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Defs>
        <LinearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#6C7CFF" />
          <Stop offset="100%" stopColor="#38498C" />
        </LinearGradient>
        <LinearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#2A3D6E" />
          <Stop offset="100%" stopColor="#17162A" />
        </LinearGradient>
      </Defs>

      {/* Outer Wheel Rim */}
      <Circle
        cx="60"
        cy="60"
        r="54"
        stroke="url(#wheelGradient)"
        strokeWidth="4"
        strokeDasharray="14 6"
        opacity={0.95}
      />
      <Circle cx="60" cy="60" r="47" stroke="#2A2D4A" strokeWidth="2" />

      {/* Wheel Center Body */}
      <Circle cx="60" cy="60" r="38" fill="url(#innerGradient)" stroke="#2A2D4A" strokeWidth="1.5" />

      {/* Hawk Wing / Dynamic Wheel Spokes */}
      <Path d="M38 52 L68 34 L58 48 L78 44 L52 64 L72 60 L44 80 L56 68 L36 68 Z" fill="#6C7CFF" />

      {/* Hawk Eye */}
      <Circle cx="67" cy="40" r="2.5" fill="#FFFFFF" />

      {/* Accent Orange Center Plus / Cross */}
      <G transform="translate(68, 70)">
        <Rect x="0" y="4" width="14" height="4.5" rx="2" fill="#E8552D" />
        <Rect x="4.75" y="-0.75" width="4.5" height="14" rx="2" fill="#E8552D" />
      </G>
    </Svg>
  );
};
