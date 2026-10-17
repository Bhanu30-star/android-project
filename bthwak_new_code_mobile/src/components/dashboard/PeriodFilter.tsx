import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { PresetKey, DateRange, formatReadable } from '@/utils/dateUtils';

interface PeriodFilterProps {
  selectedPreset: PresetKey;
  onSelectPreset: (preset: PresetKey) => void;
  activeRange: DateRange;
}

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'FTD', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: 'LAST_7', label: 'Last 7 Days' },
  { key: 'MTD', label: 'This Month' },
  { key: 'LAST_30', label: 'Last 30 Days' },
  { key: 'LAST_MONTH', label: 'Last Month' },
  { key: 'YTD', label: 'Year to Date' },
];

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  selectedPreset,
  onSelectPreset,
  activeRange,
}) => {
  const dateSubLabel =
    activeRange.startDate === activeRange.endDate
      ? formatReadable(activeRange.startDate)
      : `${formatReadable(activeRange.startDate)} – ${formatReadable(activeRange.endDate)}`;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleWithIcon}>
          <Feather name="bar-chart-2" size={17} color={Theme.colors.primary} />
          <Text style={styles.title}>Business Insights</Text>
        </View>
        <View style={styles.dateBadge}>
          <Feather name="calendar" size={12} color={Theme.colors.textSecondary} />
          <Text style={styles.dateText}>{dateSubLabel}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {PRESETS.map((preset) => {
          const isActive = selectedPreset === preset.key;
          return (
            <TouchableOpacity
              key={preset.key}
              onPress={() => onSelectPreset(preset.key)}
              style={[styles.pill, isActive && styles.pillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
    paddingHorizontal: 2,
    flexWrap: 'wrap',
    gap: 6,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    fontSize: Theme.typography.sizes.base + 1,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  scrollList: {
    paddingVertical: 2,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  pillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
