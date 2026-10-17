import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';

interface QuickActionItem {
  id: string;
  title: string;
  desc: string;
  iconName: keyof typeof Feather.glyphMap;
  color: string;
  bgColor: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'invoice',
    title: 'Create New Invoice',
    desc: 'Generate GST tax invoice or delivery challan',
    iconName: 'file-plus',
    color: '#2563EB',
    bgColor: '#EFF6FF',
  },
  {
    id: 'payment',
    title: 'Record Payment Receipt',
    desc: 'Log cash, bank, or online payment received',
    iconName: 'credit-card',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    id: 'purchase',
    title: 'Add Purchase Bill',
    desc: 'Record incoming vendor invoice & update stock',
    iconName: 'shopping-bag',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    id: 'party',
    title: 'Add New Party / Customer',
    desc: 'Register buyer, seller, retailer, or vendor',
    iconName: 'user-plus',
    color: '#9333EA',
    bgColor: '#FAF5FF',
  },
  {
    id: 'qr',
    title: 'Scan Desktop Web QR',
    desc: 'Instant sign-in to BTHAWK web app on computer',
    iconName: 'camera',
    color: Theme.colors.primary,
    bgColor: '#EEF2FF',
  },
];

interface QuickCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction: (id: string) => void;
}

export const QuickCreateModal: React.FC<QuickCreateModalProps> = ({
  visible,
  onClose,
  onSelectAction,
}) => {
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
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Quick Actions</Text>
              <Text style={styles.subtitle}>Select an action to proceed</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionList}>
            {QUICK_ACTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.actionCard}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onSelectAction(item.id);
                }}
              >
                <View
                  style={[styles.iconBox, { backgroundColor: item.bgColor }]}
                >
                  <Feather
                    name={item.iconName}
                    size={20}
                    color={item.color}
                  />
                </View>

                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionDesc}>{item.desc}</Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Theme.colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.sizes.base + 2,
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
  actionList: {
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Theme.spacing.md,
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  actionDesc: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
});
