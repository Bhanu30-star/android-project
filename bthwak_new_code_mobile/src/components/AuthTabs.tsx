import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';

export type AuthTabType = 'password' | 'otp' | 'qr';

interface AuthTabsProps {
  activeTab: AuthTabType;
  onTabChange: (tab: AuthTabType) => void;
}

const TABS: { id: AuthTabType; label: string }[] = [
  { id: 'password', label: 'Password' },
  { id: 'otp', label: 'OTP' },
  { id: 'qr', label: 'QR Code' },
];

export const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);
  const translateX = useSharedValue(0);

  const tabWidth = containerWidth > 0 ? (containerWidth - 8) / TABS.length : 0;

  useEffect(() => {
    if (tabWidth > 0) {
      translateX.value = withTiming(activeIndex * tabWidth, {
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [activeIndex, tabWidth, translateX]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: tabWidth,
    };
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth(width);
  };

  return (
    <View style={styles.container} onLayout={onLayout} accessibilityRole="tablist">
      {tabWidth > 0 && (
        <Animated.View style={[styles.indicatorWrapper, animatedIndicatorStyle]}>
          <LinearGradient
            colors={Theme.colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientPill}
          />
        </Animated.View>
      )}

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
            <Text style={[styles.tabText, isActive ? styles.tabTextActive : styles.tabTextInactive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.tabsContainerBg,
    borderRadius: Theme.borderRadius.xl,
    padding: 4,
    position: 'relative',
    height: 44,
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  indicatorWrapper: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
  },
  gradientPill: {
    flex: 1,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.pill,
  },
  tabButton: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Theme.colors.tabActiveText,
  },
  tabTextInactive: {
    color: Theme.colors.tabInactiveText,
  },
});
