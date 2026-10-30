import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { AppTabType } from '@/context/AppContext';

interface AppTabBarProps {
  activeTab: AppTabType;
  onTabChange: (tab: AppTabType) => void;
  onPressPlus?: () => void;
}

export const AppTabBar: React.FC<AppTabBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  const isHomeActive = activeTab === 'dashboard';
  const isSalesActive = activeTab === 'sales';
  const isPurchaseActive = activeTab === 'parties';
  const isReportsActive = activeTab === 'reports';
  const isChatActive = activeTab === 'chat';

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {/* 1. SALE TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('sales')}
        activeOpacity={0.7}
        accessibilityLabel="Sale tab"
        accessibilityRole="button"
      >
        <Ionicons
          name="receipt-outline"
          size={20}
          color={isSalesActive ? '#6C7CFF' : '#8E95B3'}
        />
        <Text
          style={[
            styles.tabLabel,
            isSalesActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Sale
        </Text>
      </TouchableOpacity>

      {/* 2. PURCHASE TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('parties')}
        activeOpacity={0.7}
        accessibilityLabel="Purchase tab"
        accessibilityRole="button"
      >
        <Feather
          name="shopping-cart"
          size={20}
          color={isPurchaseActive ? '#6C7CFF' : '#8E95B3'}
        />
        <Text
          style={[
            styles.tabLabel,
            isPurchaseActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Purchase
        </Text>
      </TouchableOpacity>

      {/* 3. HOME TAB (ACTIVE PURPLE PILL) */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('dashboard')}
        activeOpacity={0.7}
        accessibilityLabel="Home tab"
        accessibilityRole="button"
      >
        <View style={[styles.homePillWrapper, isHomeActive && styles.homePillActive]}>
          <Ionicons
            name="home"
            size={20}
            color={isHomeActive ? '#FFFFFF' : '#8E95B3'}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            isHomeActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* 4. REPORTS TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('reports')}
        activeOpacity={0.7}
        accessibilityLabel="Reports tab"
        accessibilityRole="button"
      >
        <Feather
          name="alert-octagon"
          size={20}
          color={isReportsActive ? '#6C7CFF' : '#8E95B3'}
        />
        <Text
          style={[
            styles.tabLabel,
            isReportsActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Reports
        </Text>
      </TouchableOpacity>

      {/* 5. CHAT TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('chat')}
        activeOpacity={0.7}
        accessibilityLabel="Chat tab"
        accessibilityRole="button"
      >
        <Feather
          name="message-square"
          size={20}
          color={isChatActive ? '#6C7CFF' : '#8E95B3'}
        />
        <Text
          style={[
            styles.tabLabel,
            isChatActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Chat
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: '#111628',
    borderTopWidth: 1,
    borderTopColor: '#1E2540',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  homePillWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homePillActive: {
    backgroundColor: '#5B35C2',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#8B98F8',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#8E95B3',
  },
});
