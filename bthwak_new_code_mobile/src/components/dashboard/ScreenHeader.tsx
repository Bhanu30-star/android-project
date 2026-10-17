import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shapes, Shadows } from '@/theme';

interface ScreenHeaderProps {
  onPressHamburger: () => void;
  onPressNotification: () => void;
  onPressProfile: () => void;
  selectedPeriodLabel: string;
  onPressPeriod: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  onPressHamburger,
  onPressNotification,
  onPressProfile,
  selectedPeriodLabel,
  onPressPeriod,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER ROW */}
      <View style={styles.topRow}>
        {/* Left: Hamburger + Real Logo */}
        <View style={styles.leftGroup}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={onPressHamburger}
            activeOpacity={0.8}
            accessibilityLabel="Open navigation menu"
            accessibilityRole="button"
          >
            <Feather name="menu" size={20} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="BTHAWK Logo"
            />
          </View>
        </View>

        {/* Right: Notification Bell + Profile */}
        <View style={styles.rightGroup}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={onPressNotification}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Feather name="bell" size={20} color={Colors.text} />
            <View style={styles.dangerDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={onPressProfile}
            activeOpacity={0.8}
            accessibilityLabel="User Profile"
            accessibilityRole="button"
          >
            <Feather name="user" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. TITLE & PERIOD ROW */}
      <View style={styles.titleRow}>
        <View style={styles.titleTextGroup}>
          <Text style={styles.captionText}>Dashboard</Text>
          <Text style={styles.headingText}>Business Insights</Text>
        </View>

        <TouchableOpacity
          style={styles.periodPill}
          onPress={onPressPeriod}
          activeOpacity={0.8}
          accessibilityLabel={`Period filter: ${selectedPeriodLabel}`}
          accessibilityRole="button"
        >
          <Text style={styles.periodPillText}>{selectedPeriodLabel}</Text>
          <Feather name="chevron-down" size={15} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Shapes.verticalGap,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 16,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    height: 44,
    width: 140,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.circleBtn,
  },
  dangerDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dangerDot,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.circleBtn,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleTextGroup: {
    flex: 1,
  },
  captionText: {
    ...Typography.statLabel,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  headingText: {
    ...Typography.pageTitle,
    color: Colors.text,
  },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    minHeight: 40,
    ...Shadows.circleBtn,
  },
  periodPillText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 13,
    color: Colors.text,
  },
});
