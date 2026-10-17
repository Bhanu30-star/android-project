import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shapes } from '@/theme';

interface PlusActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction: (action: 'invoice' | 'receipt' | 'purchase') => void;
}

export const PlusActionSheet: React.FC<PlusActionSheetProps> = ({
  visible,
  onClose,
  onSelectAction,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              <View style={styles.header}>
                <Text style={styles.title}>Create New</Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close sheet"
                >
                  <Feather name="x" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionList}>
                {/* 1. New Invoice */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onSelectAction('invoice');
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="New invoice"
                  accessibilityRole="button"
                >
                  <View style={[styles.iconChip, { backgroundColor: '#E8E6FF' }]}>
                    <Feather name="file-text" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.textGroup}>
                    <Text style={styles.actionTitle}>New invoice</Text>
                    <Text style={styles.actionSub}>Create and share GST sales bill</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* 2. New Receipt */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onSelectAction('receipt');
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="New receipt"
                  accessibilityRole="button"
                >
                  <View style={[styles.iconChip, { backgroundColor: '#DDF5E9' }]}>
                    <Feather name="dollar-sign" size={20} color="#0B7A4D" />
                  </View>
                  <View style={styles.textGroup}>
                    <Text style={styles.actionTitle}>New receipt</Text>
                    <Text style={styles.actionSub}>Record incoming party payment</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* 3. New Purchase */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => {
                    onClose();
                    onSelectAction('purchase');
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="New purchase"
                  accessibilityRole="button"
                >
                  <View style={[styles.iconChip, { backgroundColor: '#FFE9DC' }]}>
                    <Feather name="shopping-cart" size={20} color="#B4400C" />
                  </View>
                  <View style={styles.textGroup}>
                    <Text style={styles.actionTitle}>New purchase</Text>
                    <Text style={styles.actionSub}>Log vendor order and stock bills</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Shapes.cardRadius,
    borderTopRightRadius: Shapes.cardRadius,
    paddingHorizontal: Shapes.screenPadding,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.divider,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  actionList: {
    gap: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  actionSub: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
});
