import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { fetchInvoiceDataApi, InvoiceRecord } from '@/api/invoiceList';

interface InvoiceReceiptModalProps {
  visible: boolean;
  invoice: InvoiceRecord | null;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  visible,
  invoice,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [lang, setLang] = useState<'Eng' | 'Hnd'>('Eng');
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible || !invoice) {
      setReceiptData(null);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const data = await fetchInvoiceDataApi(invoice.transaction_id, lang);
        if (isMounted) setReceiptData(data);
      } catch (err: any) {
        // Fallback to local invoice data
        if (isMounted) setReceiptData(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [visible, invoice, lang]);

  const handleShare = async () => {
    if (!invoice) return;
    try {
      const billNo = invoice.transaction_bill_number || `INV-${invoice.transaction_id}`;
      const amount = Number(invoice.final_amt || 0).toFixed(2);
      const party = invoice.party_name;
      const text = `Invoice Receipt: ${billNo}\nCustomer: ${party}\nAmount: ₹${amount}\nDate: ${invoice.bill_date_time || 'Recent'}\nPowered by BTHAWK`;
      await Share.share({ message: text, title: `Invoice ${billNo}` });
    } catch {
      // Ignored
    }
  };

  if (!invoice) return null;

  const billNo = invoice.transaction_bill_number || `INV-${invoice.transaction_id}`;
  const totalAmount = invoice.final_amt || invoice.total_amount || 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Invoice Receipt</Text>
              <Text style={styles.headerSubtitle}>{billNo}</Text>
            </View>

            {/* Language Switcher */}
            <View style={styles.langPills}>
              <TouchableOpacity
                style={[styles.langBtn, lang === 'Eng' && styles.langBtnActive]}
                onPress={() => setLang('Eng')}
              >
                <Text style={[styles.langBtnText, lang === 'Eng' && styles.langBtnTextActive]}>
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, lang === 'Hnd' && styles.langBtnActive]}
                onPress={() => setLang('Hnd')}
              >
                <Text style={[styles.langBtnText, lang === 'Hnd' && styles.langBtnTextActive]}>
                  हिंदी
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loadingText}>Loading invoice receipt...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Receipt Summary Card */}
              <View style={styles.receiptCard}>
                <View style={styles.receiptTop}>
                  <Text style={styles.partyName}>{invoice.party_name}</Text>
                  <Text style={styles.billAmount}>₹{Number(totalAmount).toFixed(1)}</Text>
                </View>

                {invoice.party_phone ? (
                  <Text style={styles.partyPhone}>Phone: {invoice.party_phone}</Text>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Invoice Type</Text>
                  <Text style={styles.metaValue}>{invoice.bill_type || 'Tax Invoice'}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Payment Mode</Text>
                  <Text style={styles.metaValue}>{invoice.payment_mode || 'Cash'}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Date & Time</Text>
                  <Text style={styles.metaValue}>
                    {invoice.bill_date_time || invoice.bill_date || 'Today'}
                  </Text>
                </View>

                {invoice.user_name ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Sales Executive</Text>
                    <Text style={styles.metaValue}>{invoice.user_name}</Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                {/* Payment Breakdown */}
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Cash</Text>
                    <Text style={styles.breakdownVal}>
                      ₹{Number(invoice.r_cash_amt ?? 0).toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Cheque</Text>
                    <Text style={styles.breakdownVal}>
                      ₹{Number(invoice.r_cheque_amt ?? 0).toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Adjust</Text>
                    <Text style={styles.breakdownVal}>
                      ₹{Number(invoice.r_adjust_amt ?? 0).toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Items from backend if available */}
              {receiptData?.product_detail && receiptData.product_detail.length > 0 && (
                <View style={styles.receiptCard}>
                  <Text style={styles.sectionHeading}>Items Breakdown</Text>
                  {receiptData.product_detail.map((p: any, idx: number) => (
                    <View key={`item-${idx}`} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{p.product_name}</Text>
                        <Text style={styles.itemMeta}>Qty: {p.quantity}</Text>
                      </View>
                      <Text style={styles.itemTotal}>
                        ₹{Number(p.price || p.net_amount || 0).toFixed(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Feather name="share-2" size={17} color="#FFFFFF" />
              <Text style={styles.shareBtnText}>Share Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Close</Text>
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
    maxHeight: '90%',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#0047AB',
    fontWeight: '700',
    marginTop: 2,
  },
  langPills: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFD',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: '#0047AB',
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBox: {
    padding: 36,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#5A6B87',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollArea: {
    maxHeight: 480,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  receiptCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
  },
  receiptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partyName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
    flex: 1,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0047AB',
  },
  partyPhone: {
    fontSize: 12,
    color: '#5A6B87',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#DFE7F2',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  metaLabel: {
    fontSize: 13,
    color: '#5A6B87',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#5A6B87',
    marginBottom: 2,
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0047AB',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  itemMeta: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
  },
  shareBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doneBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
});
