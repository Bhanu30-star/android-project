import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  G,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AuthBackgroundDecorations: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* ============================================================== */}
      {/* 1. TOP-LEFT WAVE RIBBONS & TOP-RIGHT DOT MATRIX               */}
      {/* ============================================================== */}
      <Svg
        width={SCREEN_WIDTH}
        height={220}
        viewBox={`0 0 ${SCREEN_WIDTH} 220`}
        style={styles.topSvg}
      >
        <Defs>
          {/* Deep Navy Ribbon Gradient */}
          <LinearGradient id="topNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#051C48" />
            <Stop offset="50%" stopColor="#0B3E93" />
            <Stop offset="100%" stopColor="#1856C2" />
          </LinearGradient>

          {/* Radiant Orange Ribbon Gradient */}
          <LinearGradient id="topOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF4500" />
            <Stop offset="50%" stopColor="#FF7A00" />
            <Stop offset="100%" stopColor="#FFA600" />
          </LinearGradient>

          {/* Soft Sky Ambient Light */}
          <LinearGradient id="topSoftSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#CBE2FC" stopOpacity="0.45" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Soft Ambient Sky Bloom */}
        <Path
          d={`M -20 -20 L ${SCREEN_WIDTH * 0.7} -20 C ${SCREEN_WIDTH * 0.5} 80, 50 150, -20 180 Z`}
          fill="url(#topSoftSky)"
        />

        {/* Orange Ribbon Wave (underneath navy) */}
        <Path
          d={`M -20 30
             C 50 60, 100 130, ${SCREEN_WIDTH * 0.42} 110
             C ${SCREEN_WIDTH * 0.28} 150, 40 185, -20 190 Z`}
          fill="url(#topOrangeGrad)"
        />

        {/* Deep Royal Navy Ribbon Wave (main top ribbon) */}
        <Path
          d={`M -20 -20
             L ${SCREEN_WIDTH * 0.48} -20
             C ${SCREEN_WIDTH * 0.36} 65, 80 85, -20 120 Z`}
          fill="url(#topNavyGrad)"
        />

        {/* Dot Matrix Grid (Top Right) */}
        <G opacity={0.35} transform={`translate(${SCREEN_WIDTH - 90}, 50)`}>
          {[0, 1, 2, 3, 4].map((col) =>
            [0, 1, 2, 3, 4, 5].map((row) => (
              <Circle
                key={`dot-${col}-${row}`}
                cx={col * 14}
                cy={row * 14}
                r={2}
                fill="#2563EB"
              />
            ))
          )}
        </G>
      </Svg>

      {/* ============================================================== */}
      {/* 2. BOTTOM ARTWORK: SKYLINE + RISING CHART + SOARING ARROW + WAVES */}
      {/* ============================================================== */}
      <Svg
        width={SCREEN_WIDTH}
        height={180}
        viewBox={`0 0 ${SCREEN_WIDTH} 180`}
        style={styles.bottomSvg}
      >
        <Defs>
          {/* Bottom Skyline Gradient */}
          <LinearGradient id="skylineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#4A8BF0" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#2563EB" stopOpacity="0.08" />
          </LinearGradient>

          {/* Bottom Blue Wave Gradient */}
          <LinearGradient id="bottomNavyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#05245E" />
            <Stop offset="60%" stopColor="#093888" />
            <Stop offset="100%" stopColor="#104EB8" />
          </LinearGradient>

          {/* Bottom Orange Ribbon Wave Gradient */}
          <LinearGradient id="bottomOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF4D00" />
            <Stop offset="50%" stopColor="#FF7B00" />
            <Stop offset="100%" stopColor="#FFA600" />
          </LinearGradient>

          {/* Arrow Gradient */}
          <LinearGradient id="bottomArrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#FF5500" />
            <Stop offset="100%" stopColor="#FFB300" />
          </LinearGradient>
        </Defs>

        {/* 1. City Skyline Silhouettes */}
        <G fill="url(#skylineGrad)">
          {/* Building Silhouettes along left-to-center bottom */}
          <Rect x={10} y={90} width={14} height={40} rx={1} />
          <Rect x={26} y={75} width={12} height={55} rx={1} />
          <Rect x={40} y={100} width={10} height={30} rx={1} />
          <Rect x={52} y={65} width={15} height={65} rx={1} />
          <Rect x={69} y={80} width={13} height={50} rx={1} />
          <Rect x={84} y={92} width={11} height={38} rx={1} />
          <Rect x={97} y={70} width={16} height={60} rx={1} />
          <Rect x={115} y={85} width={12} height={45} rx={1} />
          <Rect x={129} y={95} width={14} height={35} rx={1} />
          <Rect x={145} y={78} width={12} height={52} rx={1} />
          <Rect x={159} y={88} width={11} height={42} rx={1} />
          <Rect x={172} y={100} width={14} height={30} rx={1} />
        </G>

        {/* 2. Rising Bar Chart (Right side bottom) */}
        <G transform={`translate(${SCREEN_WIDTH - 120}, 70)`}>
          <Rect x={0} y={48} width={9} height={26} rx={3} fill="#4B90F2" opacity={0.65} />
          <Rect x={13} y={38} width={9} height={36} rx={3} fill="#327CEB" opacity={0.75} />
          <Rect x={26} y={28} width={9} height={46} rx={3} fill="#1D6DE2" opacity={0.85} />
          <Rect x={39} y={18} width={9} height={56} rx={3} fill="#0F5FD8" opacity={0.9} />
          <Rect x={52} y={8} width={9} height={66} rx={3} fill="#0951C2" opacity={0.95} />
          <Rect x={65} y={0} width={9} height={74} rx={3} fill="#063F9E" />
        </G>

        {/* 3. Soaring Orange Arrow Curve over the bars */}
        <Path
          d={`M ${SCREEN_WIDTH - 140} 115
             C ${SCREEN_WIDTH - 90} 95, ${SCREEN_WIDTH - 60} 70, ${SCREEN_WIDTH - 30} 42
             L ${SCREEN_WIDTH - 42} 44
             L ${SCREEN_WIDTH - 20} 30
             L ${SCREEN_WIDTH - 22} 55
             L ${SCREEN_WIDTH - 31} 49
             C ${SCREEN_WIDTH - 60} 78, ${SCREEN_WIDTH - 90} 103, ${SCREEN_WIDTH - 138} 122 Z`}
          fill="url(#bottomArrowGrad)"
        />

        {/* 4. Sweeping Orange Bottom Ribbon Wave */}
        <Path
          d={`M -10 165
             C ${SCREEN_WIDTH * 0.3} 145, ${SCREEN_WIDTH * 0.6} 168, ${SCREEN_WIDTH + 10} 130
             L ${SCREEN_WIDTH + 10} 180
             L -10 180 Z`}
          fill="url(#bottomOrangeGrad)"
        />

        {/* 5. Sweeping Deep Navy Bottom Wave */}
        <Path
          d={`M -10 148
             C ${SCREEN_WIDTH * 0.28} 140, ${SCREEN_WIDTH * 0.55} 175, ${SCREEN_WIDTH + 10} 146
             L ${SCREEN_WIDTH + 10} 180
             L -10 180 Z`}
          fill="url(#bottomNavyGrad)"
        />
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
  bottomSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
