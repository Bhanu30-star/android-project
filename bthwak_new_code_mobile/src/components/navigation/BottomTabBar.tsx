import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/theme';
import { AppTabType } from '@/context/AppContext';

interface BottomTabBarProps {
  activeTab: AppTabType;
  onTabChange: (tab: AppTabType) => void;
  onPressPlus: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  onPressPlus,
}) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {/* 1. DASHBOARD */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('dashboard')}
          activeOpacity={0.7}
        >
          <Feather
            name="grid"
            size={19}
            color={activeTab === 'dashboard' ? Theme.colors.primary : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'dashboard' && styles.tabTextActive,
            ]}
          >
            Insights
          </Text>
        </TouchableOpacity>

        {/* 2. SALES */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('sales')}
          activeOpacity={0.7}
        >
          <Feather
            name="file-text"
            size={19}
            color={activeTab === 'sales' ? Theme.colors.primary : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'sales' && styles.tabTextActive,
            ]}
          >
            Sales
          </Text>
        </TouchableOpacity>

        {/* CENTER FLOATING PLUS BUTTON */}
        <View style={styles.centerFabContainer}>
          <TouchableOpacity
            style={styles.fabTouch}
            onPress={onPressPlus}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={Theme.colors.primaryGradient}
              style={styles.fabGradient}
            >
              <Feather name="plus" size={26} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 3. PARTIES */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('parties')}
          activeOpacity={0.7}
        >
          <Feather
            name="users"
            size={19}
            color={activeTab === 'parties' ? Theme.colors.primary : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'parties' && styles.tabTextActive,
            ]}
          >
            Parties
          </Text>
        </TouchableOpacity>

        {/* 4. REPORTS / SETTINGS */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('reports')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="pie-chart-outline"
            size={19}
            color={activeTab === 'reports' ? Theme.colors.primary : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'reports' && styles.tabTextActive,
            ]}
          >
            Reports
          </Text>
        </TouchableOpacity>

        {/* 5. MORE / SETTINGS */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange('settings')}
          activeOpacity={0.7}
        >
          <Feather
            name="settings"
            size={19}
            color={activeTab === 'settings' ? Theme.colors.primary : '#94A3B8'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'settings' && styles.tabTextActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 52,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },
  centerFabContainer: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
  },
  fabTouch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    ...Theme.shadows.button,
  },
  fabGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
