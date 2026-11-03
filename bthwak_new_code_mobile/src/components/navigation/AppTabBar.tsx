import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
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
        onPress={() => {
          router.push('/generate-invoice' as any);
        }}
        activeOpacity={0.75}
        accessibilityLabel="Sale tab"
        accessibilityRole="button"
      >
        <View style={[styles.iconCapsule, isSalesActive && styles.iconCapsuleActive]}>
          <Ionicons
            name={isSalesActive ? 'receipt' : 'receipt-outline'}
            size={20}
            color={isSalesActive ? '#0047AB' : '#64748B'}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            isSalesActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Sale
        </Text>
        {isSalesActive ? (
          <View style={styles.activeDot} />
        ) : (
          <View style={styles.dotPlaceholder} />
        )}
      </TouchableOpacity>

      {/* 2. PURCHASE TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('parties')}
        activeOpacity={0.75}
        accessibilityLabel="Purchase tab"
        accessibilityRole="button"
      >
        <View style={[styles.iconCapsule, isPurchaseActive && styles.iconCapsuleActive]}>
          <Feather
            name="shopping-cart"
            size={20}
            color={isPurchaseActive ? '#0047AB' : '#64748B'}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            isPurchaseActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Purchase
        </Text>
        {isPurchaseActive ? (
          <View style={styles.activeDot} />
        ) : (
          <View style={styles.dotPlaceholder} />
        )}
      </TouchableOpacity>

      {/* 3. HOME TAB (FLAGSHIP CENTER TAB) */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('dashboard')}
        activeOpacity={0.75}
        accessibilityLabel="Home tab"
        accessibilityRole="button"
      >
        <View
          style={[
            styles.homeButtonWrapper,
            isHomeActive ? styles.homeButtonActive : styles.homeButtonInactive,
          ]}
        >
          <Ionicons
            name={isHomeActive ? 'home' : 'home-outline'}
            size={20}
            color={isHomeActive ? '#FFFFFF' : '#64748B'}
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
        {isHomeActive ? (
          <View style={styles.activeDot} />
        ) : (
          <View style={styles.dotPlaceholder} />
        )}
      </TouchableOpacity>

      {/* 4. REPORTS TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('reports')}
        activeOpacity={0.75}
        accessibilityLabel="Reports tab"
        accessibilityRole="button"
      >
        <View style={[styles.iconCapsule, isReportsActive && styles.iconCapsuleActive]}>
          <Feather
            name="bar-chart-2"
            size={20}
            color={isReportsActive ? '#0047AB' : '#64748B'}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            isReportsActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Reports
        </Text>
        {isReportsActive ? (
          <View style={styles.activeDot} />
        ) : (
          <View style={styles.dotPlaceholder} />
        )}
      </TouchableOpacity>

      {/* 5. CHAT TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('chat')}
        activeOpacity={0.75}
        accessibilityLabel="Chat tab"
        accessibilityRole="button"
      >
        <View style={[styles.iconCapsule, isChatActive && styles.iconCapsuleActive]}>
          <Ionicons
            name={isChatActive ? 'chatbubbles' : 'chatbubbles-outline'}
            size={20}
            color={isChatActive ? '#0047AB' : '#64748B'}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            isChatActive ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Chat
        </Text>
        {isChatActive ? (
          <View style={styles.activeDot} />
        ) : (
          <View style={styles.dotPlaceholder} />
        )}
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 12,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconCapsule: {
    width: 40,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconCapsuleActive: {
    backgroundColor: '#E8F1FC',
  },
  homeButtonWrapper: {
    width: 40,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonActive: {
    backgroundColor: '#0A2558',
    shadowColor: '#0A2558',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  homeButtonInactive: {
    backgroundColor: '#F1F5F9',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#0A2558',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#64748B',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF6E00',
    marginTop: 3,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 3,
  },
});
