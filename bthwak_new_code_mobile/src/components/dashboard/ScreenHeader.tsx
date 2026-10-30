import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PresetKey } from '@/utils/dateUtils';

interface ScreenHeaderProps {
  onPressHamburger: () => void;
  onPressSettings: () => void;
  selectedPreset: PresetKey;
  onSelectPreset: (preset: PresetKey) => void;
}

const PRESET_PILLS: { key: PresetKey; label: string }[] = [
  { key: 'FTD', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: 'LAST_7', label: 'Last 7 Days' },
];

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  onPressHamburger,
  onPressSettings,
  selectedPreset,
  onSelectPreset,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. TOP APP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={onPressHamburger}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityLabel="Open navigation drawer"
          accessibilityRole="button"
        >
          <Feather name="menu" size={24} color="#F2F2FA" />
        </TouchableOpacity>

        <View style={styles.centerBrand}>
          <Text style={styles.brandText}>
            BTHAWK <Text style={styles.brandPlus}>+</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={onPressSettings}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        >
          <Feather name="settings" size={22} color="#F2F2FA" />
        </TouchableOpacity>
      </View>

      {/* 2. BUSINESS INSIGHTS HEADING */}
      <Text style={styles.pageHeading}>Business Insights</Text>

      {/* 3. TIME FILTER PILLS */}
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F2F2FA',
    letterSpacing: 1.5,
  },
  brandPlus: {
    color: '#E8552D',
    fontWeight: '800',
  },
  pageHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F2F2FA',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  pillButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillButtonActive: {
    backgroundColor: '#1E2548',
    borderWidth: 1,
    borderColor: '#303B75',
  },
  pillButtonInactive: {
    backgroundColor: '#131627',
    borderWidth: 1,
    borderColor: '#1F253E',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#8B98F8',
  },
  pillTextInactive: {
    color: '#8E95B3',
  },
});
