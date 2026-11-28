import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { formatYmd } from '@/utils/dateUtils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateView';
import {
  getCollectionDsrApi,
  dayOpenDsrApi,
  dayEndDsrApi,
  CollectionDsrHeader,
} from '@/api/dsr';

export const CollectionDsrScreen: React.FC = () => {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [selectedDate, setSelectedDate] = useState(formatYmd(new Date()));
  const [search, setSearch] = useState('');
  const [headers, setHeaders] = useState<CollectionDsrHeader[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [isDayEnded, setIsDayEnded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(
    async (isPull = false) => {
      if (isPull) setRefreshing(true);
      else setLoading(true);
      setErrorMsg(null);
      try {
        const res = await getCollectionDsrApi(selectedDate);
        setHeaders(res.headers);
        setRows(res.rows);
        setIsDayEnded(res.flagDayEnd === 1);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to load Collection DSR. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDayAction = (action: 'open' | 'end') => {
    const isOpening = action === 'open';
    Alert.alert(
      isOpening ? 'Confirm Day Open' : 'Confirm Day Close',
      `Are you sure you want to ${isOpening ? 'OPEN' : 'CLOSE'} the day (${selectedDate})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isOpening ? 'Open Day' : 'Close Day',
          style: isOpening ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const msg = isOpening
                ? await dayOpenDsrApi(selectedDate)
                : await dayEndDsrApi(selectedDate);
              Alert.alert('Success', msg);
              setIsDayEnded(!isOpening);
              loadData(true);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to update day status');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      String(r.sales_exec || r.sales_executive || r.user_name || '')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        today: acc.today + Number(r.today_amt || 0),
        cash: acc.cash + Number(r.cash || 0),
        online: acc.online + Number(r.cheque_online || 0),
        credit: acc.credit + Number(r.credit || 0),
      }),
      { today: 0, cash: 0, online: 0, credit: 0 }
    );
  }, [filteredRows]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Collection DSR</Text>
          <Text style={styles.headerSub}>Daily Sales & Collection Sheet</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.dayBtn,
            { backgroundColor: isDayEnded ? '#16A34A' : '#DC2626' },
            actionLoading && { opacity: 0.6 },
          ]}
          disabled={actionLoading}
          onPress={() => handleDayAction(isDayEnded ? 'open' : 'end')}
        >
          <Feather name={isDayEnded ? 'unlock' : 'lock'} size={14} color="#FFFFFF" />
          <Text style={styles.dayBtnText}>{isDayEnded ? 'Day Open' : 'Day End'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <TextInput
          style={[styles.input, { flex: 0.9 }]}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
        />
        <TextInput
          style={[styles.input, { flex: 1.3 }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search Executive..."
        />
        <TouchableOpacity style={styles.goBtn} onPress={() => loadData(true)}>
          <Feather name="refresh-cw" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Today Amt</Text>
          <Text style={styles.kpiVal}>₹{totals.today.toFixed(2)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Cash</Text>
          <Text style={[styles.kpiVal, { color: '#16A34A' }]}>₹{totals.cash.toFixed(2)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Online/Chq</Text>
          <Text style={[styles.kpiVal, { color: '#0047AB' }]}>₹{totals.online.toFixed(2)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Credit</Text>
          <Text style={[styles.kpiVal, { color: '#D97706' }]}>₹{totals.credit.toFixed(2)}</Text>
        </View>
      </View>

      <OfflineBanner isOffline={!isOnline} />

      {loading ? (
        <LoadingState message="Loading Collection DSR..." />
      ) : errorMsg ? (
        <ErrorState message={errorMsg} onRetry={() => loadData(false)} />
      ) : (
        <FlatList
          data={filteredRows}
          keyExtractor={(_, idx) => String(idx)}
          contentContainerStyle={{ padding: 14, paddingBottom: 40, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
          ListEmptyComponent={
            <EmptyState
              iconName="receipt-outline"
              title={`No Collection DSR for ${selectedDate}`}
              subtitle="Pull down to refresh or choose another date."
              actionLabel="Refresh"
              onAction={() => loadData(true)}
            />
          }
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.execName}>
                  #{index + 1} {item.sales_exec || item.sales_executive || item.user_name || 'Executive'}
                </Text>
                <Text style={styles.todayAmt}>₹{Number(item.today_amt || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.gridRow}>
                <Text style={styles.gridCell}>Prev: ₹{Number(item.prev_amt || 0).toFixed(2)}</Text>
                <Text style={styles.gridCell}>Cash: ₹{Number(item.cash || 0).toFixed(2)}</Text>
                <Text style={styles.gridCell}>Online: ₹{Number(item.cheque_online || 0).toFixed(2)}</Text>
                <Text style={styles.gridCell}>Credit: ₹{Number(item.credit || 0).toFixed(2)}</Text>
              </View>
              {headers.some((h) => h.key.startsWith('denom_')) && (
                <View style={styles.denomWrap}>
                  {headers
                    .filter((h) => h.key.startsWith('denom_') && Number(item[h.key] || 0) > 0)
                    .map((h) => (
                      <View key={h.key} style={styles.denomChip}>
                        <Text style={styles.denomText}>
                          {h.label}: {item[h.key]}
                        </Text>
                      </View>
                    ))}
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E204E',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: { padding: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#CBD5E1', fontSize: 11, marginTop: 1 },
  dayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dayBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0E204E',
    backgroundColor: '#F8FAFC',
  },
  goBtn: {
    backgroundColor: '#0047AB',
    paddingHorizontal: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: { fontSize: 10, color: '#64748B' },
  kpiVal: { fontSize: 12, fontWeight: '800', color: '#0E204E', marginTop: 2 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 30 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  execName: { fontSize: 14, fontWeight: '700', color: '#0E204E', flex: 1 },
  todayAmt: { fontSize: 15, fontWeight: '800', color: '#0047AB' },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  gridCell: { fontSize: 12, color: '#475569', fontWeight: '600' },
  denomWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  denomChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  denomText: { fontSize: 11, color: '#334155' },
});
