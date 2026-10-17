import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Theme } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CHECK_POINTS = [
  'Simplified GST Filings',
  'Timely TDS Compliance',
  'Optimized Cash Flow',
  'On-Time Tax Returns',
];

export const PromoBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggleExpand}
        activeOpacity={0.8}
        style={styles.toggleHeader}
        accessibilityRole="button"
        accessibilityLabel="Toggle promo details"
      >
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>BTHAWK</Text>
          </View>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Business Nahi, Accounting Tool Badlo
          </Text>
        </View>
        <Feather
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Theme.colors.primary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.imageAndTitleRow}>
            <Image
              source={require('../../assets/images/promo-banner.png')}
              style={styles.promoImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.pointsGrid}>
            {CHECK_POINTS.map((point, index) => (
              <View key={index} style={styles.pointRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Theme.colors.success}
                  style={styles.checkIcon}
                />
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
    ...Theme.shadows.pill,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: '#F8FAFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  badge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.xs + 1,
    fontWeight: '700',
    color: '#1E1B4B',
    flexShrink: 1,
  },
  expandedContent: {
    padding: Theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF2FF',
  },
  imageAndTitleRow: {
    height: 120,
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: Theme.spacing.md,
    backgroundColor: '#1E293B',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  pointsGrid: {
    gap: 8,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  checkIcon: {
    marginRight: 8,
  },
  pointText: {
    fontSize: Theme.typography.sizes.xs + 1,
    fontWeight: '600',
    color: '#166534',
  },
});
