import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatReadable } from '@/utils/dateUtils';
import {
  DebitNoteHistoryItem,
  fetchDebitNoteDetailHistoryListApi,
} from '@/api/debitNoteDetail';

interface DebitNoteHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  partyName?: string;
}

export const DebitNoteHistoryModal: React.FC<DebitNoteHistoryModalProps> = ({
  visible,
  onClose,
  startDate,
  endDate,
  partyName,
}) => {
  const insets = useSafeAreaInsets();
  const [historyList, setHistoryList] = useState<DebitNoteHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible, startDate, endDate, partyName]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const data = await fetchDebitNoteDetailHistoryListApi({
        start_date: startDate,
        end_date: endDate,
        party_name: partyName || '',
      });
      setHistoryList(data);
    } catch (err: any) {
      console.warn('Debit note history fetch error:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    if (!search.trim()) return historyList;
    const q = search.trim().toLowerCase();
    return historyList.filter(
      (it) =>
        (it.party_name || '').toLowerCase().includes(q) ||
        (it.bill_no || '').toLowerCase().includes(q) ||
        (it.debit_note_bill_no || '').toLowerCase().includes(q) ||
        (it.type || '').toLowerCase().includes(q)
    );
  }, [historyList, search]);

  const totalAdjusted = useMemo(() => {
    return historyList.reduce(
      (acc, it) => acc + (parseFloat(String(it.adjust_amount || 0)) || 0),
      0
    );
  }, [historyList]);

  const renderHistoryItem = ({ item }: { item: DebitNoteHistoryItem }) => {
    const totalAmt = parseFloat(String(item.total_amt || 0)) || 0;
    const adjustAmt = parseFloat(String(item.adjust_amount || 0)) || 0;
    const pendingAmt = parseFloat(String(item.pending_amt || 0)) || 0;
    const initial = (item.party_name || 'D').trim().charAt(0).toUpperCase();

    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.partyRow}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>{initial}</Text>
            </View>
            <Text style={styles.partyNameText} numberOfLines={1}>
              {item.party_name || 'Party'}
            </Text>
          </View>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{item.txn_date || item.date || ''}</Text>
          </View>
        </View>

        <View style={styles.billRow}>
          <Feather name="file-text" size={13} color="#0047AB" />
          <Text style={styles.billText}>
            Bill: {item.bill_no || item.debit_note_bill_no || 'N/A'}
          </Text>
          {item.type ? (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{item.type}</Text>
            </View>
          ) : null}
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
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Pending</Text>
            <Text style={[styles.metricVal, { color: '#F59E0B' }]}>
              ₹{pendingAmt.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingTop: Math.max(insets.top, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Debit Note History</Text>
              <Text style={styles.headerSubtitle}>
                {formatReadable(startDate)} — {formatReadable(endDate)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color="#0E204E" />
            </TouchableOpacity>
          </View>

          {/* Quick Summary Pill Bar */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Records</Text>
              <Text style={styles.summaryValue}>{historyList.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Adjusted</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                ₹{totalAdjusted.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Feather name="search" size={15} color="#5A6B87" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search history by party or bill no..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x" size={14} color="#5A6B87" />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : filteredHistory.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="time-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No history records</Text>
              <Text style={styles.emptySubtitle}>
                There are no debit note history records for this period.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredHistory}
              keyExtractor={(item, index) =>
                `${item.bill_no || item.unique_bill || index}_${index}`
              }
              renderItem={renderHistoryItem}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: Math.max(insets.bottom, 16) + 16 },
              ]}
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginTop: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E204E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E204E',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  partyNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
    flex: 1,
  },
  dateBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  billText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  typeBadge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3730A3',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  metricCol: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E204E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
