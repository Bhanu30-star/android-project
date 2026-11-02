import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PresetKey } from '@/utils/dateUtils';
import { BthawkLogo } from '@/components/BthawkLogo';

export interface DashboardTopBarProps {
  onPressHamburger: () => void;
  onPressSettings: () => void;
}

export interface DashboardFilterHeaderProps {
  selectedPreset: PresetKey;
  onSelectPreset: (preset: PresetKey) => void;
}

export interface ScreenHeaderProps extends DashboardTopBarProps, DashboardFilterHeaderProps {}

const PRESET_PILLS: { key: PresetKey; label: string }[] = [
  { key: 'FTD', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: 'LAST_7', label: 'Last 7 Days' },
];

/**
 * Pinned Sticky Top Navigation Bar
 * Positioned fixed at the top so dashboard content scrolls smoothly UNDER it.
 */
export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  onPressHamburger,
  onPressSettings,
}) => {
  return (
    <View style={styles.topBarPinned}>
      {/* Left: Modern Squircle Hamburger Button */}
      <TouchableOpacity
        onPress={onPressHamburger}
        style={styles.iconButton}
        activeOpacity={0.7}
        accessibilityLabel="Open navigation drawer"
        accessibilityRole="button"
      >
        <Feather name="menu" size={20} color="#0A2558" />
      </TouchableOpacity>

      {/* Center: Brand Identity Logo */}
      <View style={styles.centerBrand}>
        <BthawkLogo size={34} showText={true} textSize={18} textColor="#0E204E" />
      </View>

      {/* Right: Modern Squircle Settings Button with Orange Accent Dot */}
      <TouchableOpacity
        onPress={onPressSettings}
        style={styles.iconButton}
        activeOpacity={0.7}
        accessibilityLabel="Open settings"
        accessibilityRole="button"
      >
        <Feather name="settings" size={19} color="#0A2558" />
        <View style={styles.notificationDot} />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Scrollable Header Content (Business Insights Heading + Date Filter Pills)
 * Resides inside ScrollView so it scrolls naturally with the dashboard metrics.
 */
export const DashboardFilterHeader: React.FC<DashboardFilterHeaderProps> = ({
  selectedPreset,
  onSelectPreset,
}) => {
  return (
    <View style={styles.filterContainer}>
      {/* 1. BUSINESS INSIGHTS HEADING WITH ORANGE ACCENT */}
      <View style={styles.headingRow}>
        <Text style={styles.pageHeading}>
          Business <Text style={styles.pageHeadingAccent}>Insights</Text>
        </Text>
      </View>

      {/* 2. TIME FILTER PILLS */}
      <View style={styles.pillsRow}>
        {PRESET_PILLS.map((pill) => {
          const isActive = selectedPreset === pill.key;
          return (
            <TouchableOpacity
              key={pill.key}
              onPress={() => onSelectPreset(pill.key)}
              style={[
                styles.pillButton,
                isActive ? styles.pillButtonActive : styles.pillButtonInactive,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  isActive ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {pill.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

/**
 * Combined ScreenHeader for backwards compatibility
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  onPressHamburger,
  onPressSettings,
  selectedPreset,
  onSelectPreset,
}) => {
  return (
    <View style={styles.container}>
      <DashboardTopBar
        onPressHamburger={onPressHamburger}
        onPressSettings={onPressSettings}
      />
      <DashboardFilterHeader
        selectedPreset={selectedPreset}
        onSelectPreset={onSelectPreset}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 4,
  },
  topBarPinned: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 20,
    elevation: 4,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF6E00',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  centerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingRow: {
    marginBottom: 12,
  },
  pageHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.5,
  },
  pageHeadingAccent: {
    color: '#FF6E00',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  pillButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillButtonActive: {
    backgroundColor: '#0A2558',
    borderWidth: 1,
    borderColor: '#0A2558',
    shadowColor: '#0A2558',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  pillButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: '#5A6B87',
  },
});
