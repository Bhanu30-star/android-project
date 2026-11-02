import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatReadable } from '@/utils/dateUtils';
import {
  CreditNoteHistoryItem,
  fetchCreditNoteDetailHistoryListApi,
} from '@/api/creditNoteDetail';

interface CreditNoteHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  partyName?: string;
}

export const CreditNoteHistoryModal: React.FC<CreditNoteHistoryModalProps> = ({
  visible,
  onClose,
  startDate,
  endDate,
  partyName,
}) => {
  const insets = useSafeAreaInsets();
  const [historyList, setHistoryList] = useState<CreditNoteHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible, startDate, endDate, partyName]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await fetchCreditNoteDetailHistoryListApi({
        start_date: startDate,
        end_date: endDate,
        party_name: partyName || '',
      });
      setHistoryList(data);
    } catch (err: any) {
      console.warn('History fetch error:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHistoryItem = ({ item }: { item: CreditNoteHistoryItem }) => {
    const totalAmt = parseFloat(String(item.total_amt || 0)) || 0;
    const adjustAmt = parseFloat(String(item.adjust_amount || item.final_adjust_amt || 0)) || 0;

    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.partyNameText} numberOfLines={1}>
            {item.party_name || 'Party'}
          </Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{item.txn_date || item.date || ''}</Text>
          </View>
        </View>

        <View style={styles.billRow}>
          <Feather name="file-text" size={13} color="#818EF8" />
          <Text style={styles.billText}>
            Bill: {item.bill_no || item.credit_note_bill_no || 'N/A'}
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Total Amt</Text>
            <Text style={styles.metricVal}>₹{totalAmt.toFixed(1)}</Text>
          </View>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Adjusted</Text>
            <Text style={[styles.metricVal, { color: '#10B981' }]}>
              ₹{adjustAmt.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="clock" size={18} color="#0047AB" />
              <Text style={styles.sheetTitle}>Adjusted History</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateFilterInfo}>
            <Text style={styles.dateFilterText}>
              Range: {formatReadable(startDate)} — {formatReadable(endDate)}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loadingText}>Fetching history...</Text>
            </View>
          ) : historyList.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="documents-outline" size={44} color="#5A6B87" />
              <Text style={styles.emptyText}>No adjustment history found</Text>
            </View>
          ) : (
            <FlatList
              data={historyList}
              keyExtractor={(_, index) => String(index)}
              renderItem={renderHistoryItem}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#DFE7F2',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0E204E',
  },
  dateFilterInfo: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  dateFilterText: {
    fontSize: 12,
    color: '#5A6B87',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#F8FAFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
    flex: 1,
  },
  dateBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dateBadgeText: {
    fontSize: 11,
    color: '#0047AB',
    fontWeight: '600',
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billText: {
    fontSize: 13,
    color: '#0047AB',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#5A6B87',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
    marginTop: 2,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#5A6B87',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B87',
  },
});
