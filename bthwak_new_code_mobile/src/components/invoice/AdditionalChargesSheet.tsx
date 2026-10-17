import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AdditionalCharges } from '@/features/invoice/calc';
import { Colors, Typography, Shapes, Shadows } from '@/theme/tokens';

interface AdditionalChargesSheetProps {
  visible: boolean;
  onClose: () => void;
  charges: AdditionalCharges;
  onSave: (charges: AdditionalCharges) => void;
}

export const AdditionalChargesSheet: React.FC<AdditionalChargesSheetProps> = ({
  visible,
  onClose,
  charges,
  onSave,
}) => {
  const [labour, setLabour] = useState(charges.labour ? String(charges.labour) : '');
  const [freight, setFreight] = useState(charges.freight ? String(charges.freight) : '');
  const [other, setOther] = useState(charges.other ? String(charges.other) : '');
  const [tcsApplicable, setTcsApplicable] = useState(charges.tcsApplicable || false);
  const [tcsAmount, setTcsAmount] = useState(
    charges.tcsAmount ? String(charges.tcsAmount) : ''
  );
  const [overallDiscount, setOverallDiscount] = useState(
    charges.overallDiscount ? String(charges.overallDiscount) : ''
  );

  const handleSave = () => {
    onSave({
      labour: parseFloat(labour) || 0,
      freight: parseFloat(freight) || 0,
      other: parseFloat(other) || 0,
      tcsApplicable,
      tcsAmount: tcsApplicable ? parseFloat(tcsAmount) || 0 : 0,
      overallDiscount: parseFloat(overallDiscount) || 0,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Additional Charges & Discount</Text>
              <Text style={styles.subtitle}>Labour, freight, TCS, and bill discount</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Labour Charges (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  value={labour}
                  onChangeText={setLabour}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Freight / Shipping (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  value={freight}
                  onChangeText={setFreight}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Other Expenses (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  value={other}
                  onChangeText={setOther}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Overall Discount (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  value={overallDiscount}
                  onChangeText={setOverallDiscount}
                />
              </View>
            </View>

            <View style={styles.tcsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tcsTitle}>TCS Applicable</Text>
                <Text style={styles.tcsSubtitle}>Tax Collected at Source</Text>
              </View>
              <Switch
                value={tcsApplicable}
                onValueChange={setTcsApplicable}
                trackColor={{ false: Colors.tabBorder, true: Colors.primary }}
              />
            </View>

            {tcsApplicable && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.label}>TCS Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0.00"
                  value={tcsAmount}
                  onChangeText={setTcsAmount}
                />
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Apply Charges</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 24, 64, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 28,
    ...Shadows.card,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tabBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  halfCol: {
    flex: 1,
  },
  label: {
    fontFamily: Typography.statLabel.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusMedium,
    height: 46,
    paddingHorizontal: 12,
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  tcsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    marginBottom: 10,
  },
  tcsTitle: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  tcsSubtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: Shapes.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    ...Shadows.card,
  },
  saveBtnText: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
