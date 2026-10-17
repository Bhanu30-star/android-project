import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/theme';

interface PaymentReceiptSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentReceiptSheet: React.FC<PaymentReceiptSheetProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Online' | 'Cheque'>('Cash');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount) || 0;
    if (!customerName.trim()) {
      Alert.alert('Required', 'Please enter customer / party name');
      return;
    }
    if (numAmount <= 0) {
      Alert.alert('Required', 'Please enter payment amount collected');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Payment Recorded',
        `₹${numAmount.toLocaleString('en-IN')} received from ${customerName} via ${paymentMode}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCustomerName('');
              setAmount('');
              setRemarks('');
              onClose();
              onSuccess?.();
            },
          },
        ]
      );
    }, 500);
  };

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
              <Text style={styles.title}>Record Collection</Text>
              <Text style={styles.subtitle}>Log cash, UPI, or cheque payment received</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* CUSTOMER NAME */}
          <Text style={styles.label}>Customer / Retailer Name</Text>
          <View style={styles.inputBox}>
            <Feather name="user" size={17} color="#64748B" />
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="e.g. Sharma General Store"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>

          {/* AMOUNT */}
          <Text style={styles.label}>Amount Collected (₹)</Text>
          <View style={styles.inputBox}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>

          {/* PAYMENT MODE */}
          <Text style={styles.label}>Received Via</Text>
          <View style={styles.tabRow}>
            {(['Cash', 'Online', 'Cheque'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modePill, paymentMode === mode && styles.modePillActive]}
                onPress={() => setPaymentMode(mode)}
              >
                <Text style={[styles.modeText, paymentMode === mode && styles.modeTextActive]}>
                  {mode === 'Online' ? 'UPI / Online' : mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* REMARKS */}
          <Text style={styles.label}>Note / Reference ID (Optional)</Text>
          <View style={styles.inputBox}>
            <Feather name="edit-3" size={16} color="#64748B" />
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder="UTR number, cheque no, or note..."
              placeholderTextColor="#94A3B8"
              style={styles.textInput}
            />
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            disabled={isSubmitting}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Saving...' : 'Confirm Receipt'}
            </Text>
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
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modePillActive: {
    backgroundColor: '#10B981',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  modeTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
