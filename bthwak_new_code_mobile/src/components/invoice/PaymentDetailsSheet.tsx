/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import {
  invoiceService,
  RetailerParty,
  DistributorBank,
} from '@/api/invoiceService';
import { formatIndianCurrency } from '@/features/invoice/calc';
import { Colors, Shadows } from '@/theme/tokens';

export interface PaymentDetailsData {
  paymentType: string;
  bankName: string;
  txnNo: string;
  chequeDate: string;
  depositBank: string;
  chequeAmt: number;
  creditDays: number;
}

interface PaymentDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
  mode: 'Cash' | 'Credit' | 'Online' | 'Cheque' | 'Both';
  party: RetailerParty | null;
  creditOverdues: number;
  advanceAmt: number;
  netAmount: number;
  initialData: PaymentDetailsData;
  onSave: (data: PaymentDetailsData) => void;
}

export const PaymentDetailsSheet: React.FC<PaymentDetailsSheetProps> = ({
  visible,
  onClose,
  mode,
  party,
  creditOverdues,
  netAmount,
  initialData,
  onSave,
}) => {
  const [paymentType, setPaymentType] = useState(initialData.paymentType || 'UPI');
  const [bankName, setBankName] = useState(initialData.bankName || '');
  const [txnNo, setTxnNo] = useState(initialData.txnNo || '');
  const [chequeDate, setChequeDate] = useState(
    initialData.chequeDate || new Date().toISOString().slice(0, 10)
  );
  const [depositBank, setDepositBank] = useState(initialData.depositBank || '');
  const [chequeAmt, setChequeAmt] = useState(
    initialData.chequeAmt > 0 ? String(initialData.chequeAmt) : String(netAmount)
  );
  const [creditDays, setCreditDays] = useState(
    initialData.creditDays > 0 ? String(initialData.creditDays) : '30'
  );

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form when visible or mode changes
  useEffect(() => {
    if (visible) {
      setPaymentType(initialData.paymentType || (mode === 'Online' ? 'UPI' : ''));
      setBankName(initialData.bankName || '');
      setTxnNo(initialData.txnNo || '');
      setChequeDate(initialData.chequeDate || new Date().toISOString().slice(0, 10));
      setDepositBank(initialData.depositBank || '');
      setChequeAmt(
        initialData.chequeAmt > 0 ? String(initialData.chequeAmt) : String(netAmount)
      );
      setCreditDays(
        initialData.creditDays > 0 ? String(initialData.creditDays) : '30'
      );
      setErrors({});
    }
  }, [visible, mode, initialData, netAmount]);

  // Distributor Banks query for deposit bank dropdown
  const { data: banks = [] } = useQuery<DistributorBank[]>({
    queryKey: ['distributor-banks'],
    queryFn: () => invoiceService.fetchDistributorBanks(),
    enabled: visible && (mode === 'Online' || mode === 'Cheque'),
  });

  // Profile query for bank QR code
  const { data: profile } = useQuery({
    queryKey: ['distributor-profile'],
    queryFn: () => invoiceService.fetchProfileDetails(),
    enabled: visible && mode === 'Online',
  });

  // Calculate Due Date for Credit
  const parsedCreditDays = parseInt(creditDays, 10) || 0;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + parsedCreditDays);
  const formattedDueDate = dueDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (mode === 'Cheque') {
      if (!txnNo.trim()) {
        errs.txnNo = 'Cheque number is required';
      }
      if (!chequeDate.trim()) {
        errs.chequeDate = 'Cheque date is required';
      }
      if (!bankName.trim()) {
        errs.bankName = 'Bank name is required';
      }
    }

    if (mode === 'Credit') {
      if (!parsedCreditDays || parsedCreditDays <= 0) {
        errs.creditDays = 'Valid credit days required (minimum 1)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      paymentType,
      bankName: bankName.trim(),
      txnNo: txnNo.trim(),
      chequeDate: chequeDate.trim(),
      depositBank,
      chequeAmt: parseFloat(chequeAmt) || netAmount,
      creditDays: parsedCreditDays,
    });
    onClose();
  };

  if (mode === 'Cash') {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{mode} Payment Details</Text>
              <Text style={styles.subtitle}>
                {mode === 'Credit' && 'Credit days and balance verification'}
                {mode === 'Online' && 'UPI, Bank Transfer, or QR payment'}
                {mode === 'Cheque' && 'Cheque number and clearing bank details'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* ================= CREDIT FIELDS ================= */}
            {mode === 'Credit' && (
              <View style={styles.section}>
                {/* Credit Overdue Warning Banner */}
                {creditOverdues > 0 && (
                  <View style={styles.warningBox}>
                    <Feather name="alert-triangle" size={18} color="#B45309" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.warningTitle}>Outstanding Overdue Warning</Text>
                      <Text style={styles.warningDesc}>
                        {party?.partyName || 'Party'} currently has{' '}
                        <Text style={{ fontWeight: '700' }}>{formatIndianCurrency(creditOverdues)}</Text> in
                        overdue credit. This invoice of{' '}
                        <Text style={{ fontWeight: '700' }}>{formatIndianCurrency(netAmount)}</Text> will increase
                        the total outstanding to{' '}
                        <Text style={{ fontWeight: '700' }}>
                          {formatIndianCurrency(creditOverdues + netAmount)}
                        </Text>.
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Credit Days <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.creditDays && styles.inputError]}
                    keyboardType="numeric"
                    placeholder="e.g. 30"
                    placeholderTextColor={Colors.textSecondary}
                    value={creditDays}
                    onChangeText={(val) => {
                      setCreditDays(val.replace(/[^0-9]/g, ''));
                      if (errors.creditDays) setErrors((e) => ({ ...e, creditDays: '' }));
                    }}
                  />
                  {errors.creditDays ? (
                    <Text style={styles.errorText}>{errors.creditDays}</Text>
                  ) : null}

                  {parsedCreditDays > 0 && (
                    <View style={styles.dueNotice}>
                      <Feather name="calendar" size={14} color={Colors.primary} />
                      <Text style={styles.dueNoticeText}>
                        Payment due on: <Text style={{ fontWeight: '700' }}>{formattedDueDate}</Text>
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* ================= ONLINE FIELDS ================= */}
            {mode === 'Online' && (
              <View style={styles.section}>
                {/* Payment Type Selector */}
                <Text style={styles.label}>Online Payment Method</Text>
                <View style={styles.typeSelectorRow}>
                  {(['UPI', 'IMPS', 'NEFT', 'RTGS', 'WALLET'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeChip, paymentType === t && styles.typeChipActive]}
                      onPress={() => setPaymentType(t)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          paymentType === t && styles.typeChipTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Profile Bank QR Code */}
                {profile?.bank_qr_code ? (
                  <View style={styles.qrContainer}>
                    <Text style={styles.qrTitle}>Bank QR Code (Scan to Pay)</Text>
                    <Image
                      source={{ uri: profile.bank_qr_code }}
                      style={styles.qrImage}
                      contentFit="contain"
                    />
                    <Text style={styles.qrSubtitle}>
                      Retailer can scan above QR to pay {formatIndianCurrency(netAmount)}
                    </Text>
                  </View>
                ) : null}

                {/* Txn / Ref No */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Transaction / Reference No</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter UPI ref or UTR number (optional)"
                    placeholderTextColor={Colors.textSecondary}
                    value={txnNo}
                    onChangeText={(val) => setTxnNo(val.replace(/[^a-zA-Z0-9]/g, ''))}
                  />
                </View>

                {/* Txn Date */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Transaction Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textSecondary}
                    value={chequeDate}
                    onChangeText={setChequeDate}
                  />
                </View>

                {/* Deposit Bank */}
                {banks.length > 0 && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Deposit Bank (Optional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                      {banks.map((b) => {
                        const isSelected = String(b.bankMasterId) === String(depositBank);
                        return (
                          <TouchableOpacity
                            key={String(b.bankMasterId)}
                            style={[styles.bankChip, isSelected && styles.bankChipActive]}
                            onPress={() =>
                              setDepositBank(isSelected ? '' : String(b.bankMasterId))
                            }
                          >
                            <Text
                              style={[
                                styles.bankChipText,
                                isSelected && styles.bankChipTextActive,
                              ]}
                            >
                              {b.bankName} - {b.accountNo}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Bank Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Bank Name (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. HDFC Bank"
                    placeholderTextColor={Colors.textSecondary}
                    value={bankName}
                    onChangeText={setBankName}
                  />
                </View>
              </View>
            )}

            {/* ================= CHEQUE FIELDS ================= */}
            {mode === 'Cheque' && (
              <View style={styles.section}>
                {/* Cheque No */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Cheque Number <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.txnNo && styles.inputError]}
                    keyboardType="numeric"
                    placeholder="e.g. 123456"
                    placeholderTextColor={Colors.textSecondary}
                    value={txnNo}
                    onChangeText={(val) => {
                      setTxnNo(val.replace(/[^a-zA-Z0-9]/g, ''));
                      if (errors.txnNo) setErrors((e) => ({ ...e, txnNo: '' }));
                    }}
                  />
                  {errors.txnNo ? <Text style={styles.errorText}>{errors.txnNo}</Text> : null}
                </View>

                {/* Cheque Date */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Cheque Date <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.chequeDate && styles.inputError]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.textSecondary}
                    value={chequeDate}
                    onChangeText={(val) => {
                      setChequeDate(val);
                      if (errors.chequeDate) setErrors((e) => ({ ...e, chequeDate: '' }));
                    }}
                  />
                  {errors.chequeDate ? (
                    <Text style={styles.errorText}>{errors.chequeDate}</Text>
                  ) : null}
                </View>

                {/* Bank Name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    Bank Name <Text style={styles.reqStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.bankName && styles.inputError]}
                    placeholder="e.g. State Bank of India"
                    placeholderTextColor={Colors.textSecondary}
                    value={bankName}
                    onChangeText={(val) => {
                      setBankName(val);
                      if (errors.bankName) setErrors((e) => ({ ...e, bankName: '' }));
                    }}
                  />
                  {errors.bankName ? (
                    <Text style={styles.errorText}>{errors.bankName}</Text>
                  ) : null}
                </View>

                {/* Cheque Amount */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Cheque Amount (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder={String(netAmount)}
                    placeholderTextColor={Colors.textSecondary}
                    value={chequeAmt}
                    onChangeText={setChequeAmt}
                  />
                </View>

                {/* Deposit Bank */}
                {banks.length > 0 && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Deposit Bank</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                      {banks.map((b) => {
                        const isSelected = String(b.bankMasterId) === String(depositBank);
                        return (
                          <TouchableOpacity
                            key={String(b.bankMasterId)}
                            style={[styles.bankChip, isSelected && styles.bankChipActive]}
                            onPress={() =>
                              setDepositBank(isSelected ? '' : String(b.bankMasterId))
                            }
                          >
                            <Text
                              style={[
                                styles.bankChipText,
                                isSelected && styles.bankChipTextActive,
                              ]}
                            >
                              {b.bankName} - {b.accountNo}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Sticky Bottom Actions */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Details</Text>
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
    maxHeight: '90%',
    ...Shadows.card,
  },
  handle: {
    width: 44,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    paddingBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  reqStar: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  inputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  warningDesc: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 4,
    lineHeight: 18,
  },
  dueNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  dueNoticeText: {
    fontSize: 12,
    color: Colors.primary,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  qrTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  qrImage: {
    width: 180,
    height: 180,
    borderRadius: 8,
  },
  qrSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    backgroundColor: Colors.card,
  },
  bankChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  bankChipText: {
    fontSize: 12,
    color: Colors.text,
  },
  bankChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
