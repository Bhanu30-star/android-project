import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../theme';

export type AuthTabType = 'password' | 'otp' | 'qr';

interface AuthTabsProps {
  activeTab: AuthTabType;
  onTabChange: (tab: AuthTabType) => void;
}

const TABS: { id: AuthTabType; label: string }[] = [
  { id: 'password', label: 'Password' },
  { id: 'otp', label: 'OTP' },
  { id: 'qr', label: 'QR' },
];

export const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const translateX = useSharedValue(0);

  const tabWidth = containerWidth > 0 ? containerWidth / TABS.length : 0;
  // Underline width
  const indicatorWidth = 54;

  useEffect(() => {
    if (tabWidth > 0) {
      // Center the indicator under the active tab
      const targetX = activeIndex * tabWidth + (tabWidth - indicatorWidth) / 2;
      translateX.value = withTiming(targetX, {
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [activeIndex, tabWidth, translateX]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth(width);
  };

  return (
    <View style={styles.wrapper} onLayout={onLayout} accessibilityRole="tablist">
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={styles.tabButton}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Baseline divider and sliding indicator */}
      <View style={styles.lineContainer}>
        {tabWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              { width: indicatorWidth },
              animatedIndicatorStyle,
            ]}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: Theme.spacing.lg,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#6C7CFF',
    fontWeight: '700',
  },
  tabTextInactive: {
    color: '#9AA0BF',
    fontWeight: '600',
  },
  lineContainer: {
    height: 3,
    backgroundColor: '#2A2D4A',
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    height: 3,
    backgroundColor: '#6C7CFF',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
