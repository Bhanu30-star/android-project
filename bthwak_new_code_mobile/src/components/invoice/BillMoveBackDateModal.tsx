import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  fetchMoveBackDateDetailApi,
  updateBillMoveBackDateApi,
  MoveBackDateDetail,
} from '@/api/invoiceList';
import { CalendarPickerModal } from '@/components/common/CalendarPickerModal';

interface BillMoveBackDateModalProps {
  visible: boolean;
  transactionId: number | string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const BillMoveBackDateModal: React.FC<BillMoveBackDateModalProps> = ({
  visible,
  transactionId,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<MoveBackDateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [billDate, setBillDate] = useState<string>('');
  const [billNo, setBillNo] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Helper to generate bill number based on selected date
  const generateBillNo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      return `AA${yyyy}${mm}${dd}${hh}${min}${ss}`;
    } catch {
      return `AA${Date.now()}`;
    }
  };

  // Load details when modal opens
  useEffect(() => {
    if (!visible || !transactionId) {
      setDetail(null);
      setBillDate('');
      setBillNo('');
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const data = await fetchMoveBackDateDetailApi(transactionId);
        if (isMounted && data) {
          setDetail(data);
          setBillNo(data.bill_no || '');
          const today = new Date().toISOString().split('T')[0];
          setBillDate(today);
        }
      } catch (err: any) {
        Alert.alert('Load Failed', err?.message || 'Failed to load bill details.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [visible, transactionId]);

  // Submit Handler
  const handleSubmit = async () => {
    if (!transactionId) return;

    if (!billDate) {
      Alert.alert('Required', 'Please select a bill date.');
      return;
    }
    if (!billNo.trim()) {
      Alert.alert('Required', 'Bill number cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      await updateBillMoveBackDateApi({
        transaction_id: transactionId,
        bill_no: billNo.trim(),
        bill_date: billDate,
      });

      Alert.alert('Success', 'Bill date moved successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to update bill date.';
      Alert.alert('Update Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDateDisplay = billDate
    ? new Date(billDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Select Date';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Bill Move To Back Date</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loadingText}>Fetching bill move details...</Text>
            </View>
          ) : !detail ? (
            <View style={styles.centerBox}>
              <Feather name="alert-circle" size={32} color="#EF4444" />
              <Text style={styles.emptyText}>Bill details could not be retrieved.</Text>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* 1. Main Bill Metadata Card */}
                <View style={styles.infoCard}>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Bill No</Text>
                      <Text style={styles.infoValue}>{detail.bill_no || '-'}</Text>
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>FOS Name</Text>
                      <Text style={styles.infoValue}>{detail.fos_name || 'Self'}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRowSingle}>
                    <Text style={styles.infoLabel}>Party Name</Text>
                    <Text style={styles.infoValue}>{detail.retailer_name || '-'}</Text>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Date-Time</Text>
                      <Text style={styles.infoValue}>{detail.bill_date_time || '-'}</Text>
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Net Amt</Text>
                      <Text style={[styles.infoValue, styles.amountHighlight]}>
                        ₹{Number(detail.net_amount || 0).toFixed(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Mode</Text>
                      <Text style={styles.infoValue}>{detail.payment_mode || 'Cash'}</Text>
                    </View>

                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>Source</Text>
                      <Text style={styles.infoValue}>{detail.source || 'app'}</Text>
                    </View>
                  </View>
                </View>

                {/* 2. Product Details Card */}
                {detail.product_detail && detail.product_detail.length > 0 && (
                  <View style={styles.productCard}>
                    <Text style={styles.cardSectionTitle}>Product Details</Text>

                    {detail.product_detail.map((prod, pIdx) => (
                      <View key={`prod-${pIdx}`} style={styles.productItem}>
                        <View style={styles.productIndexBadge}>
                          <Text style={styles.productIndexText}>{pIdx + 1}</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={styles.productTopRow}>
                            <Text style={styles.productName} numberOfLines={2}>
                              {prod.product_name}
                            </Text>
                            <Text style={styles.productPrice}>
                              ₹{Number(prod.price || prod.net_amt || 0).toFixed(1)}
                            </Text>
                          </View>

                          <Text style={styles.productMeta}>
                            Qty {prod.quantity || 1} • GST {prod.tax_rate || 0}%{' '}
                            {prod.tax_amt ? `+${prod.tax_amt}` : ''}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* 3. Update Bill Form */}
                <Text style={styles.updateSectionTitle}>Update Bill</Text>
                <View style={styles.updateFormRow}>
                  {/* Bill Date Picker Pill */}
                  <TouchableOpacity
                    style={styles.datePickerBtn}
                    onPress={() => setIsCalendarOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.datePickerText}>{formattedDateDisplay}</Text>
                    <Feather name="calendar" size={16} color="#94A3B8" />
                  </TouchableOpacity>

                  {/* Bill No Input */}
                  <View style={styles.billNoInputBox}>
                    <TextInput
                      style={styles.billNoInput}
                      value={billNo}
                      onChangeText={setBillNo}
                      placeholder="Bill No"
                      placeholderTextColor="#64748B"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* 4. Red Warning Note Box */}
                <View style={styles.noteBox}>
                  <Text style={styles.noteTitle}>Note:</Text>
                  <Text style={styles.noteItem}>
                    1. Bill cannot be moved before last 3 months or future.
                  </Text>
                  <Text style={styles.noteItem}>
                    2. Stock may go negative if moved to earlier date.
                  </Text>
                  <Text style={styles.noteItem}>
                    3. Collection not affected for FOS bills.
                  </Text>
                </View>
              </ScrollView>

              {/* 5. Sticky Bottom Action Footer (ALWAYS VISIBLE & ACCESSIBLE) */}
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={styles.closeFooterBtn}
                  onPress={onClose}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeFooterBtnText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitFooterBtn, isSubmitting && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitFooterBtnText}>Submit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Date Picker Modal */}
          <CalendarPickerModal
            visible={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
            onSelectDate={(d: string) => {
              const str = d.includes('T') ? d.split('T')[0] : d;
              setBillDate(str);
              setBillNo(generateBillNo(str));
              setIsCalendarOpen(false);
            }}
            selectedDate={billDate}
            title="Select Bill Date"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '60%',
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    padding: 36,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  infoCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  infoRowSingle: {
    width: '100%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#5A6B87',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E204E',
  },
  amountHighlight: {
    color: '#0047AB',
    fontWeight: '800',
  },
  productCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0047AB',
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
  },
  productIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8F1FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E204E',
    marginLeft: 8,
  },
  productMeta: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
  },
  updateSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
    marginBottom: 10,
  },
  updateFormRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  datePickerBtn: {
    flex: 1.1,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  datePickerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  billNoInputBox: {
    flex: 1.1,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  billNoInput: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
    padding: 0,
  },
  noteBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    gap: 4,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 2,
  },
  noteItem: {
    fontSize: 12,
    color: '#B91C1C',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
    backgroundColor: '#FFFFFF',
  },
  closeFooterBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeFooterBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
  submitFooterBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  submitFooterBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
