import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/theme';

interface InvoiceCreateSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InvoiceCreateSheet: React.FC<InvoiceCreateSheetProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [partyName, setPartyName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billType, setBillType] = useState<'Tax Invoice' | 'Delivery Challan' | 'Payout'>('Tax Invoice');
  const [paymentMode, setPaymentMode] = useState<'Credit' | 'Cash' | 'Online'>('Credit');
  const [gstRate, setGstRate] = useState<number>(18);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numAmount = parseFloat(billAmount) || 0;
  const gstAmount = Math.round((numAmount * gstRate) / 100);
  const totalAmount = numAmount + gstAmount;

  const handleSubmit = () => {
    if (!partyName.trim()) {
      Alert.alert('Required', 'Please enter customer / party name');
      return;
    }
    if (numAmount <= 0) {
      Alert.alert('Required', 'Please enter a valid bill amount');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Invoice Created',
        `${billType} for ₹${totalAmount.toLocaleString('en-IN')} created successfully for ${partyName}.`,
        [
          {
            text: 'Done',
            onPress: () => {
              setPartyName('');
              setBillAmount('');
              onClose();
              onSuccess?.();
            },
          },
        ]
      );
    }, 600);
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

          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>New Invoice</Text>
              <Text style={styles.subtitle}>Generate GST invoice or delivery note</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* INVOICE TYPE SELECTOR */}
            <Text style={styles.label}>Invoice Type</Text>
            <View style={styles.tabRow}>
              {(['Tax Invoice', 'Delivery Challan', 'Payout'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typePill, billType === type && styles.typePillActive]}
                  onPress={() => setBillType(type)}
                >
                  <Text style={[styles.typeText, billType === type && styles.typeTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* CUSTOMER NAME */}
            <Text style={styles.label}>Customer / Party Name</Text>
            <View style={styles.inputBox}>
              <Feather name="user" size={17} color="#64748B" />
              <TextInput
                value={partyName}
                onChangeText={setPartyName}
                placeholder="Enter party or shop name..."
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* BILL AMOUNT */}
            <Text style={styles.label}>Base Amount (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                value={billAmount}
                onChangeText={setBillAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* GST RATE PILLS */}
            <Text style={styles.label}>GST Tax Slab</Text>
            <View style={styles.gstRow}>
              {[0, 5, 12, 18, 28].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.gstPill, gstRate === rate && styles.gstPillActive]}
                  onPress={() => setGstRate(rate)}
                >
                  <Text style={[styles.gstText, gstRate === rate && styles.gstTextActive]}>
                    {rate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* PAYMENT MODE */}
            <Text style={styles.label}>Payment Terms</Text>
            <View style={styles.tabRow}>
              {(['Credit', 'Cash', 'Online'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.typePill, paymentMode === mode && styles.typePillActive]}
                  onPress={() => setPaymentMode(mode)}
                >
                  <Text style={[styles.typeText, paymentMode === mode && styles.typeTextActive]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* TOTAL CALCULATION PREVIEW */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.sumLabel}>Subtotal</Text>
                <Text style={styles.sumVal}>₹ {numAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.sumLabel}>GST ({gstRate}%)</Text>
                <Text style={styles.sumVal}>+ ₹ {gstAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Invoice Value</Text>
                <Text style={styles.totalVal}>₹ {totalAmount.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </ScrollView>

          {/* GENERATE BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            disabled={isSubmitting}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Generating...' : `Create ${billType}`}
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
    maxHeight: '88%',
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
  body: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  typePillActive: {
    backgroundColor: Theme.colors.primary,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  typeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  gstRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gstPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gstPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: Theme.colors.primary,
  },
  gstText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  gstTextActive: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sumLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
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
