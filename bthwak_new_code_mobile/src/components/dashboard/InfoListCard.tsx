import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Shapes, Shadows } from '@/theme';

export interface InfoListRowItem {
  id: string;
  label: string;
  value: string;
  onPress?: () => void;
}

interface InfoListCardProps {
  title: string;
  badge?: string;
  items: InfoListRowItem[];
}

export const InfoListCard: React.FC<InfoListCardProps> = ({
  title,
  badge = 'MTD',
  items,
}) => {
  return (
    <View style={styles.card}>
      {/* HEADER ROW */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {badge && <Text style={styles.badgeText}>{badge}</Text>}
      </View>

      {/* ITEMS LIST */}
      <View style={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const RowComponent = item.onPress ? TouchableOpacity : View;

          return (
            <React.Fragment key={item.id}>
              <RowComponent
                style={styles.row}
                onPress={item.onPress}
                activeOpacity={0.7}
                accessibilityLabel={`${item.label}: ${item.value}`}
                accessibilityRole={item.onPress ? 'button' : 'text'}
              >
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </RowComponent>
              {!isLast && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.cardRadius,
    padding: Shapes.cardPadding,
    marginBottom: Shapes.verticalGap,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  badgeText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  list: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 44,
  },
  rowLabel: {
    ...Typography.bodySemiBold,
    color: Colors.textBody,
  },
  rowValue: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 15,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});
