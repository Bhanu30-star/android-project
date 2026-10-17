import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { formatCurrency } from '@/utils/dateUtils';

export interface MetricDetailItem {
  label: string;
  value: string | number;
  highlightColor?: string;
  subtext?: string;
}

export interface MetricDetailConfig {
  title: string;
  iconName: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  subtitle: string;
  items: MetricDetailItem[];
  tips?: string;
}

interface MetricDetailModalProps {
  visible: boolean;
  onClose: () => void;
  config: MetricDetailConfig | null;
  currency?: string;
}

export const MetricDetailModal: React.FC<MetricDetailModalProps> = ({
  visible,
  onClose,
  config,
  currency = '₹',
}) => {
  if (!config) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          {/* DRAG HANDLE */}
          <View style={styles.dragHandle} />

          {/* HEADER */}
          <View style={styles.header}>
            <View style={[styles.iconWrapper, { backgroundColor: config.iconBg }]}>
              <Feather name={config.iconName} size={22} color={config.iconColor} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.subtitle}>{config.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ITEMS BREAKDOWN */}
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.itemsBox}>
              {config.items.map((item, idx) => {
                const formattedVal =
                  typeof item.value === 'number'
                    ? formatCurrency(item.value, currency)
                    : item.value;

                return (
                  <View
                    key={idx}
                    style={[
                      styles.itemRow,
                      idx < config.items.length - 1 && styles.itemBorder,
                    ]}
                  >
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      {item.subtext && (
                        <Text style={styles.itemSubtext}>{item.subtext}</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.itemValue,
                        item.highlightColor ? { color: item.highlightColor } : null,
                      ]}
                    >
                      {formattedVal}
                    </Text>
                  </View>
                );
              })}
            </View>

            {config.tips && (
              <View style={styles.tipBox}>
                <Feather name="info" size={15} color="#2563EB" />
                <Text style={styles.tipText}>{config.tips}</Text>
              </View>
            )}
          </ScrollView>

          {/* ACTION BUTTON */}
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.xl,
    maxHeight: '80%',
    ...Theme.shadows.card,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Theme.spacing.md,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: Theme.typography.sizes.base,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    marginBottom: Theme.spacing.md,
  },
  itemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemLeft: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  itemSubtext: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  itemValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  doneBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
