import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { cancelBillApi, InvoiceRecord } from '@/api/invoiceList';

interface CancelBillModalProps {
  visible: boolean;
  invoice: InvoiceRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelBillModal: React.FC<CancelBillModalProps> = ({
  visible,
  invoice,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!invoice) return null;

  const billNo = invoice.transaction_bill_number || `INV-${invoice.transaction_id}`;
  const cancelType = invoice.check_product_type === 'FMCG' ? 'fmcg' : '';

  const handleConfirmCancel = async () => {
    try {
      setIsSubmitting(true);
      await cancelBillApi({
        transaction_id: invoice.transaction_id,
        cancel_type: cancelType,
      });

      Alert.alert('Success', 'Bill cancelled successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to cancel bill.';
      Alert.alert('Cancel Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Feather name="trash-2" size={24} color="#EF4444" />
            </View>
            <Text style={styles.title}>Cancel Bill</Text>
            <Text style={styles.subtitle}>
              Are you sure you want to cancel bill{' '}
              <Text style={styles.boldText}>{billNo}</Text>?
            </Text>
          </View>

          {/* Warning Notes Box */}
          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>⚠️ Note:</Text>
            <Text style={styles.noteText}>
              1. Once cancelled, GST Report is affected.
            </Text>
            <Text style={styles.noteText}>
              2. Stock is affected from invoice date to till date.
            </Text>
            <Text style={styles.noteText}>
              3. You can delete only within 3 months of invoice date.
            </Text>
            <Text style={styles.noteText}>
              4. If credit invoice, first delete receipt then allow to delete invoice.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.noBtn}
              onPress={onClose}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.noBtnText}>No, Keep</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.yesBtn, isSubmitting && styles.btnDisabled]}
              onPress={handleConfirmCancel}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.yesBtnText}>Yes, Cancel</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#DC2626',
  },
  subtitle: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
    marginTop: 4,
  },
  boldText: {
    color: '#0E204E',
    fontWeight: '700',
  },
  noteBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    gap: 4,
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 11,
    color: '#B91C1C',
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  noBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
  yesBtn: {
    flex: 1.3,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yesBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
