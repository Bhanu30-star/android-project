import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shapes, Shadows } from '@/theme';
import { AppTabType } from '@/context/AppContext';

interface AppTabBarProps {
  activeTab: AppTabType;
  onTabChange: (tab: AppTabType) => void;
  onPressPlus: () => void;
}

export const AppTabBar: React.FC<AppTabBarProps> = ({
  activeTab,
  onTabChange,
  onPressPlus,
}) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);

  const isHomeActive = activeTab === 'dashboard';
  const isSalesActive = activeTab === 'sales';
  const isPurchaseActive = (activeTab as string) === 'purchase';
  const isReportsActive = activeTab === 'reports';

  return (
    <View style={[styles.container, { paddingBottom: bottomPadding }]}>
      {/* 1. HOME TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('dashboard')}
        activeOpacity={0.7}
        accessibilityLabel="Home tab"
        accessibilityRole="button"
      >
        <Feather
          name="home"
          size={20}
          color={isHomeActive ? Colors.primary : Colors.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isHomeActive ? Colors.primary : Colors.textSecondary },
            isHomeActive && styles.tabLabelActive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* 2. SALES TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('sales')}
        activeOpacity={0.7}
        accessibilityLabel="Sales tab"
        accessibilityRole="button"
      >
        <Feather
          name="file-text"
          size={20}
          color={isSalesActive ? Colors.primary : Colors.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isSalesActive ? Colors.primary : Colors.textSecondary },
            isSalesActive && styles.tabLabelActive,
          ]}
        >
          Sales
        </Text>
      </TouchableOpacity>

      {/* 3. CENTER RAISED PLUS BUTTON */}
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={onPressPlus}
          activeOpacity={0.85}
          accessibilityLabel="Create new transaction"
          accessibilityRole="button"
        >
          <Feather name="plus" size={26} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* 4. PURCHASE TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('parties')} // maps to purchase/parties view
        activeOpacity={0.7}
        accessibilityLabel="Purchase tab"
        accessibilityRole="button"
      >
        <Feather
          name="shopping-cart"
          size={20}
          color={isPurchaseActive ? Colors.primary : Colors.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isPurchaseActive ? Colors.primary : Colors.textSecondary },
            isPurchaseActive && styles.tabLabelActive,
          ]}
        >
          Purchase
        </Text>
      </TouchableOpacity>

      {/* 5. REPORTS TAB */}
      <TouchableOpacity
        style={styles.tabBtn}
        onPress={() => onTabChange('reports')}
        activeOpacity={0.7}
        accessibilityLabel="Reports tab"
        accessibilityRole="button"
      >
        <Feather
          name="bar-chart-2"
          size={20}
          color={isReportsActive ? Colors.primary : Colors.textSecondary}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isReportsActive ? Colors.primary : Colors.textSecondary },
            isReportsActive && styles.tabLabelActive,
          ]}
        >
          Reports
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
    height: Shapes.tabBarHeight,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 10,
    ...Shadows.card,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: Shapes.buttonMinHeight,
  },
  tabLabel: {
    ...Typography.small,
    marginTop: 4,
    fontSize: 11,
  },
  tabLabelActive: {
    fontFamily: Typography.fontFamily.bold,
  },
  fabWrapper: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBtn: {
    position: 'absolute',
    top: -Shapes.centerFabElevated,
    width: Shapes.centerFabSize,
    height: Shapes.centerFabSize,
    borderRadius: Shapes.centerFabSize / 2,
    backgroundColor: Colors.primary,
    borderWidth: 4,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.fab,
  },
});
