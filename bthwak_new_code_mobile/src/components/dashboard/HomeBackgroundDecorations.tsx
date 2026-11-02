import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
  G,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HomeBackgroundDecorations: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        width={SCREEN_WIDTH}
        height={240}
        viewBox={`0 0 ${SCREEN_WIDTH} 240`}
        style={styles.topSvg}
      >
        <Defs>
          {/* Soft Luminous Ambient Glow - No harsh dark navy burst */}
          <LinearGradient id="homeSoftGlow" x1="0%" y1="0%" x2="70%" y2="80%">
            <Stop offset="0%" stopColor="#D9E9FC" stopOpacity="0.45" />
            <Stop offset="60%" stopColor="#EBF4FE" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#F4F8FD" stopOpacity="0" />
          </LinearGradient>

          {/* Subtle Orange Trajectory Glow */}
          <LinearGradient id="homeWarmGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFA600" stopOpacity="0.12" />
            <Stop offset="100%" stopColor="#FF6E00" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Soft Ambient Sky Bloom */}
        <Path
          d={`M -20 -20 L ${SCREEN_WIDTH * 0.75} -20 C ${SCREEN_WIDTH * 0.45} 80, 50 140, -20 160 Z`}
          fill="url(#homeSoftGlow)"
        />

        {/* Delicate Soft Wave Arc - subtle structure without heavy dark colors */}
        <Path
          d={`M -20 30 C 60 70, ${SCREEN_WIDTH * 0.3} 100, ${SCREEN_WIDTH * 0.55} 60`}
          fill="none"
          stroke="#0047AB"
          strokeWidth={1.5}
          strokeOpacity={0.08}
        />

        {/* Top-Right Dot Matrix Grid */}
        <G opacity={0.22} transform={`translate(${SCREEN_WIDTH - 85}, 36)`}>
          {[0, 1, 2, 3, 4].map((col) =>
            [0, 1, 2, 3, 4].map((row) => (
              <Circle
                key={`hdot-${col}-${row}`}
                cx={col * 14}
                cy={row * 14}
                r={2}
                fill="#2563EB"
              />
            ))
          )}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  topSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
