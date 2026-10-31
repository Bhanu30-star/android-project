import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export type AuthTabType = 'password' | 'otp' | 'qr';

interface AuthTabsProps {
  activeTab: AuthTabType;
  onTabChange: (tab: AuthTabType) => void;
}

const TABS: { id: AuthTabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'password', label: 'Password', icon: 'lock-closed' },
  { id: 'otp', label: 'OTP', icon: 'shield-checkmark-sharp' },
  { id: 'qr', label: 'QR', icon: 'scan-sharp' },
];

export const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container} accessibilityRole="tablist">
      {TABS.map((tab, index) => {
        const isActive = tab.id === activeTab;
        const showDivider = !isActive && index > 0 && TABS[index - 1].id !== activeTab;

        return (
          <React.Fragment key={tab.id}>
            {showDivider && <View style={styles.verticalDivider} />}

            <TouchableOpacity
              onPress={() => onTabChange(tab.id)}
              style={styles.tabTouch}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
              activeOpacity={0.8}
            >
              {isActive ? (
                <View style={styles.activeWrapper}>
                  <LinearGradient
                    colors={['#072863', '#0A3684', '#0F449E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activeTabPill}
                  >
                    <Ionicons name={tab.icon} size={17} color="#FFFFFF" style={styles.tabIcon} />
                    <Text style={styles.activeTabText}>{tab.label}</Text>
                  </LinearGradient>
                  {/* Subtle warm amber/orange bottom glow accent */}
                  <View style={styles.activeUnderglow} />
                </View>
              ) : (
                <View style={styles.inactiveTabContent}>
                  <Ionicons name={tab.icon} size={17} color="#0E204E" style={styles.tabIcon} />
                  <Text style={styles.inactiveTabText}>{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    height: 52,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 12,
  },
  tabTouch: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabPill: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#0A2558',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  activeUnderglow: {
    position: 'absolute',
    bottom: -2,
    width: '60%',
    height: 3,
    backgroundColor: '#FF8800',
    borderRadius: 2,
    opacity: 0.8,
  },
  inactiveTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  tabIcon: {
    marginRight: 6,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inactiveTabText: {
    color: '#0E204E',
    fontSize: 14,
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#DCE6F2',
  },
});
