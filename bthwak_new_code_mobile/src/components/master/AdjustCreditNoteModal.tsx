import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  CreditNoteDetailItem,
  CreditNoteBillOption,
  fetchCreditNoteBillnoListApi,
  creditNoteAdjustApi,
} from '@/api/creditNoteDetail';

interface AdjustCreditNoteModalProps {
  visible: boolean;
  onClose: () => void;
  item: CreditNoteDetailItem | null;
  onSuccess: () => void;
}

export const AdjustCreditNoteModal: React.FC<AdjustCreditNoteModalProps> = ({
  visible,
  onClose,
  item,
  onSuccess,
}) => {
  const [adjustType, setAdjustType] = useState<'Auto' | 'Manually'>('Auto');
  const [billOptions, setBillOptions] = useState<CreditNoteBillOption[]>([]);
  const [selectedBillNo, setSelectedBillNo] = useState<string>('');
  const [isLoadingBills, setIsLoadingBills] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sub-picker modals
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [billPickerOpen, setBillPickerOpen] = useState(false);

  useEffect(() => {
    if (visible && item) {
      setAdjustType('Auto');
      setSelectedBillNo('');
      setBillOptions([]);
    }
  }, [visible, item]);

  // When adjustType is Manually, load available bills
  useEffect(() => {
    if (visible && item && adjustType === 'Manually') {
      loadBillOptions();
    }
  }, [visible, item, adjustType]);

  const loadBillOptions = async () => {
    if (!item) return;
    try {
      setIsLoadingBills(true);
      const options = await fetchCreditNoteBillnoListApi({
        uid: item.unique_bill,
        bid: item.bill_no,
        pid: item.party_id,
      });
      setBillOptions(options);
      if (options.length > 0 && !selectedBillNo) {
        setSelectedBillNo(options[0].value);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not fetch bill numbers for manual adjustment.');
    } finally {
      setIsLoadingBills(false);
    }
  };

  const handleAdjustSubmit = async () => {
    if (!item) return;

    if (adjustType === 'Manually' && !selectedBillNo) {
      Alert.alert('Validation Error', 'Please select a Bill No for manual adjustment.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await creditNoteAdjustApi({
        unique_bill: item.unique_bill,
        bill_no: item.bill_no,
        party_id: item.party_id,
        adjust_type: adjustType,
        manual_bill_no: adjustType === 'Manually' ? selectedBillNo : undefined,
      });

      Alert.alert('Success', res?.message || 'Credit note adjustment applied successfully!', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess();
            onClose();
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('Adjustment Failed', err?.message || 'Could not adjust credit note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adjust Credit Note</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Adjusted Type Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Adjusted Type</Text>
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setTypePickerOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectBoxText}>{adjustType}</Text>
              <Feather name="chevron-down" size={16} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Manual Bill No Field */}
          <View style={[styles.fieldGroup, adjustType !== 'Manually' && { opacity: 0.45 }]}>
            <Text style={styles.fieldLabel}>Manual Bill No</Text>
            <TouchableOpacity
              style={styles.selectBox}
              disabled={adjustType !== 'Manually'}
              onPress={() => setBillPickerOpen(true)}
              activeOpacity={0.7}
            >
              {isLoadingBills ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color="#0047AB" />
                  <Text style={styles.placeholderText}>Loading bills...</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.selectBoxText,
                    !selectedBillNo && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedBillNo
                    ? billOptions.find((b) => b.value === selectedBillNo)?.label || selectedBillNo
                    : 'Select Bill No'}
                </Text>
              )}
              <Feather name="chevron-down" size={16} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Footer Action Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.adjustBtn, isSubmitting && styles.btnDisabled]}
              onPress={handleAdjustSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.adjustBtnText}>Adjust</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Adjust Type Sub-Picker Modal */}
      <Modal
        visible={typePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.subModalOverlay}
          activeOpacity={1}
          onPress={() => setTypePickerOpen(false)}
        >
          <View style={styles.subModalCard}>
            <Text style={styles.subModalTitle}>Select Adjusted Type</Text>
            {(['Auto', 'Manually'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionRow,
                  adjustType === type && styles.optionRowActive,
                ]}
                onPress={() => {
                  setAdjustType(type);
                  setTypePickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    adjustType === type && styles.optionTextActive,
                  ]}
                >
                  {type}
                </Text>
                {adjustType === type && (
                  <Feather name="check" size={16} color="#0047AB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bill Number Sub-Picker Modal */}
      <Modal
        visible={billPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBillPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.subModalOverlay}
          activeOpacity={1}
          onPress={() => setBillPickerOpen(false)}
        >
          <View style={styles.subModalCard}>
            <Text style={styles.subModalTitle}>Select Bill No</Text>
            {billOptions.length === 0 ? (
              <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#5A6B87' }}>No bills available for adjustment</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 260 }}>
                {billOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionRow,
                      selectedBillNo === opt.value && styles.optionRowActive,
                    ]}
                    onPress={() => {
                      setSelectedBillNo(opt.value);
                      setBillPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedBillNo === opt.value && styles.optionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {selectedBillNo === opt.value && (
                      <Feather name="check" size={16} color="#0047AB" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 20,
    gap: 16,
    elevation: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0E204E',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  selectBox: {
    height: 44,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  selectBoxText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
    flex: 1,
    marginRight: 8,
  },
  placeholderText: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  adjustBtn: {
    backgroundColor: '#0047AB',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  adjustBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  subModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 18,
    elevation: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  subModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionRowActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  optionText: {
    fontSize: 14,
    color: '#5A6B87',
  },
  optionTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
});
