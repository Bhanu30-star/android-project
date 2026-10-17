import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Typography } from '@/theme';
import { SubMenuItemConfig } from '@/navigation/menu';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MenuGroupProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  subItems: SubMenuItemConfig[];
  isExpanded: boolean;
  activeRoute?: string;
  onToggle: () => void;
  onSelectSubItem: (item: SubMenuItemConfig) => void;
}

export const MenuGroup: React.FC<MenuGroupProps> = ({
  label,
  icon,
  subItems,
  isExpanded,
  activeRoute,
  onToggle,
  onSelectSubItem,
}) => {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View style={[styles.container, isExpanded && styles.containerExpanded]}>
      {/* Header Row */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label} menu group`}
        accessibilityState={{ expanded: isExpanded }}
      >
        <Feather
          name={icon}
          size={20}
          color={isExpanded ? '#2A2470' : '#4F46E5'}
        />
        <Text style={[styles.headerLabel, isExpanded && styles.headerLabelExpanded]}>
          {label}
        </Text>
        <Feather
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={isExpanded ? '#2A2470' : '#5E5B85'}
        />
      </TouchableOpacity>

      {/* Expanded Submenu */}
      {isExpanded && (
        <View style={styles.submenuWrapper}>
          {/* 2px vertical guide line on left */}
          <View style={styles.guideLine} />

          <View style={styles.subItemsList}>
            {subItems.map((sub) => {
              const isSubActive = activeRoute === sub.route;
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.subItemRow}
                  onPress={() => onSelectSubItem(sub)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={sub.label}
                >
                  <Text
                    style={[
                      styles.subItemLabel,
                      isSubActive && styles.subItemLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    marginVertical: 1,
  },
  containerExpanded: {
    backgroundColor: '#EEEDFF',
    borderRadius: 16,
    paddingBottom: 8,
  },
  headerRow: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#1B1840',
    flex: 1,
  },
  headerLabelExpanded: {
    color: '#2A2470',
  },
  submenuWrapper: {
    flexDirection: 'row',
    paddingLeft: 22,
    paddingRight: 12,
    marginTop: 2,
  },
  guideLine: {
    width: 2,
    backgroundColor: '#C9C6F5',
    marginRight: 14,
    borderRadius: 1,
  },
  subItemsList: {
    flex: 1,
  },
  subItemRow: {
    height: 44,
    justifyContent: 'center',
  },
  subItemLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 13,
    color: '#3A376A',
  },
  subItemLabelActive: {
    fontFamily: Typography.fontFamily.bold,
    color: '#2A2470',
  },
});
