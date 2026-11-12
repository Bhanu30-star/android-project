import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  DebitNoteDetailItem,
  adjustDebitNoteApi,
} from '@/api/debitNoteDetail';

interface AdjustDebitNoteModalProps {
  visible: boolean;
  onClose: () => void;
  item: DebitNoteDetailItem | null;
  onSuccess: () => void;
}

export const AdjustDebitNoteModal: React.FC<AdjustDebitNoteModalProps> = ({
  visible,
  onClose,
  item,
  onSuccess,
}) => {
  const [adjustType, setAdjustType] = useState<'Auto' | 'Manually'>('Auto');
  const [manualBillNo, setManualBillNo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && item) {
      setAdjustType('Auto');
      setManualBillNo('');
    }
  }, [visible, item]);

  const handleAdjustSubmit = async () => {
    if (!item) return;

    if (adjustType === 'Manually' && !manualBillNo.trim()) {
      Alert.alert('Validation Error', 'Please enter a Bill Number for manual adjustment.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await adjustDebitNoteApi({
        unique_bill: String(item.unique_bill),
        bill_no: String(item.bill_no),
        party_id: Number(item.party_id) || 0,
        type: item.type === 'Direct' ? 'Direct' : 'Return',
        adjust_type: adjustType,
        manual_bill_no: adjustType === 'Manually' ? manualBillNo.trim() : undefined,
      });

      Alert.alert(
        'Success',
        res?.message || 'Debit note adjustment applied successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              onSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        'Adjustment Failed',
        err?.message || 'Could not complete adjustment. Please check outstanding bills.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  const billAmt = parseFloat(String(item.final_bill_amt || 0)).toFixed(2);
  const pendingAmt = parseFloat(String(item.pending_amount || 0)).toFixed(2);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Adjust Debit Note</Text>
              <Text style={styles.subtitle}>DN: {item.bill_no}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#0E204E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Party Name:</Text>
                <Text style={styles.infoVal} numberOfLines={1}>
                  {item.party_name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Note Type:</Text>
                <Text style={styles.infoVal}>{item.type}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bill Amount:</Text>
                <Text style={styles.infoVal}>₹{billAmt}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pending Amount:</Text>
                <Text style={[styles.infoVal, { color: '#DC2626', fontWeight: '700' }]}>
                  ₹{pendingAmt}
                </Text>
              </View>
            </View>

            {/* Adjust Mode Selection */}
            <Text style={styles.sectionLabel}>Adjustment Mode</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  adjustType === 'Auto' && styles.modeBtnActive,
                ]}
                onPress={() => setAdjustType('Auto')}
                activeOpacity={0.7}
              >
                <Feather
                  name="zap"
                  size={16}
                  color={adjustType === 'Auto' ? '#0047AB' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    adjustType === 'Auto' && styles.modeBtnTextActive,
                  ]}
                >
                  Auto Adjust
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  adjustType === 'Manually' && styles.modeBtnActive,
                ]}
                onPress={() => setAdjustType('Manually')}
                activeOpacity={0.7}
              >
                <Feather
                  name="edit-3"
                  size={16}
                  color={adjustType === 'Manually' ? '#0047AB' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    adjustType === 'Manually' && styles.modeBtnTextActive,
                  ]}
                >
                  Manually
                </Text>
              </TouchableOpacity>
            </View>

            {/* Manual Bill Input */}
            {adjustType === 'Manually' && (
              <View style={styles.manualInputGroup}>
                <Text style={styles.inputLabel}>
                  Purchase Bill Number <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter purchase bill no to adjust against..."
                  placeholderTextColor="#94A3B8"
                  value={manualBillNo}
                  onChangeText={setManualBillNo}
                  autoCapitalize="characters"
                />
              </View>
            )}

            <Text style={styles.hintText}>
              {adjustType === 'Auto'
                ? 'System will automatically adjust this debit note against the oldest pending purchase bills for this vendor.'
                : 'Enter the exact purchase bill number that should be credited by this debit note.'}
            </Text>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleAdjustSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Confirm Adjust</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0E204E',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 18,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
    maxWidth: '65%',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
    marginBottom: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  modeBtnActive: {
    borderColor: '#0047AB',
    backgroundColor: '#EFF6FF',
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeBtnTextActive: {
    color: '#0047AB',
  },
  manualInputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0E204E',
    backgroundColor: '#FFFFFF',
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0047AB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
