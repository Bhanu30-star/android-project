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
import { PresetKey } from '@/utils/dateUtils';

interface PeriodOption {
  key: PresetKey;
  label: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: 'MTD', label: 'This month' },
  { key: 'FTD', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: 'LAST_7', label: 'Last 7 days' },
  { key: 'LAST_30', label: 'Last 30 days' },
  { key: 'LAST_MONTH', label: 'Last month' },
  { key: 'YTD', label: 'Year to date' },
];

interface PeriodSheetProps {
  visible: boolean;
  selectedPreset: PresetKey;
  onSelect: (preset: PresetKey) => void;
  onClose: () => void;
}

export const PeriodSheet: React.FC<PeriodSheetProps> = ({
  visible,
  selectedPreset,
  onSelect,
  onClose,
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
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.handle} />

              {/* Title & Close */}
              <View style={styles.header}>
                <Text style={styles.sheetTitle}>Select Period</Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Close period selector"
                >
                  <Feather name="x" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Options */}
              <View style={styles.optionsList}>
                {PERIOD_OPTIONS.map((item) => {
                  const isSelected = selectedPreset === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.optionRow,
                        isSelected && styles.optionRowSelected,
                      ]}
                      onPress={() => {
                        onSelect(item.key);
                        onClose();
                      }}
                      activeOpacity={0.7}
                      accessibilityLabel={item.label}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Feather name="check" size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
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
  sheetContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Shapes.cardRadius,
    borderTopRightRadius: Shapes.cardRadius,
    paddingHorizontal: Shapes.screenPadding,
    paddingTop: 12,
    paddingBottom: 32,
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
  sheetTitle: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  optionsList: {
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: Shapes.buttonMinHeight,
  },
  optionRowSelected: {
    backgroundColor: '#F5F4FF',
  },
  optionLabel: {
    ...Typography.bodySemiBold,
    color: Colors.textBody,
  },
  optionLabelSelected: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
});
