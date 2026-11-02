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

const getSubItemIcon = (label: string): keyof typeof Feather.glyphMap => {
  const lower = label.toLowerCase();
  if (lower.includes('executive') || lower.includes('buyer') || lower.includes('seller') || lower.includes('customer')) {
    return 'users';
  }
  if (lower.includes('beat') || lower.includes('movement')) {
    return 'git-branch';
  }
  if (lower.includes('note') || lower.includes('invoice') || lower.includes('bill')) {
    return 'file-text';
  }
  if (lower.includes('stock') || lower.includes('transfer')) {
    return 'box';
  }
  return 'corner-down-right';
};

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
    <View style={styles.container}>
      {/* Header Row */}
      <TouchableOpacity
        style={[styles.headerRow, isExpanded && styles.headerRowExpanded]}
        onPress={handleToggle}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${label} menu group`}
        accessibilityState={{ expanded: isExpanded }}
      >
        <View style={styles.headerLeft}>
          <Feather
            name={icon}
            size={18}
            color={isExpanded ? '#FFFFFF' : '#0E204E'}
          />
          <Text style={[styles.headerLabel, isExpanded && styles.headerLabelExpanded]}>
            {label}
          </Text>
        </View>

        <Feather
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={isExpanded ? '#FFFFFF' : '#5A6B87'}
        />
      </TouchableOpacity>

      {/* Expanded Submenu */}
      {isExpanded && (
        <View style={styles.submenuWrapper}>
          {subItems.map((sub) => {
            const isSubActive = activeRoute === sub.route;
            const subIcon = getSubItemIcon(sub.label);
            return (
              <TouchableOpacity
                key={sub.id}
                style={[styles.subItemRow, isSubActive && styles.subItemRowActive]}
                onPress={() => onSelectSubItem(sub)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={sub.label}
              >
                <Feather
                  name={subIcon}
                  size={16}
                  color={isSubActive ? '#0047AB' : '#5A6B87'}
                  style={{ marginRight: 12 }}
                />
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  headerRowExpanded: {
    backgroundColor: '#0A2558',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  headerLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0E204E',
  },
  headerLabelExpanded: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submenuWrapper: {
    paddingTop: 6,
    paddingBottom: 8,
    paddingLeft: 22,
  },
  subItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  subItemRowActive: {
    backgroundColor: '#EFF6FF',
  },
  subItemLabel: {
    fontSize: 14,
    color: '#5A6B87',
    fontWeight: '500',
  },
  subItemLabelActive: {
    color: '#0047AB',
    fontWeight: '600',
  },
});
