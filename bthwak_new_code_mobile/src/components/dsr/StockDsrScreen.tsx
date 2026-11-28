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
import { getStockDsrApi, dayOpenDsrApi, dayEndDsrApi } from '@/api/dsr';

export const StockDsrScreen: React.FC = () => {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [selectedDate, setSelectedDate] = useState(formatYmd(new Date()));
  const [search, setSearch] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [dayOpen, setDayOpen] = useState(false);
  const [dayEnd, setDayEnd] = useState(false);
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
        const res = await getStockDsrApi(selectedDate);
        setHeaders(res.headers);
        setRows(res.data);
        setDayOpen(res.day_open);
        setDayEnd(res.day_end);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to load Stock DSR. Please try again.');
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
      `Are you sure you want to ${isOpening ? 'OPEN' : 'CLOSE'} Stock DSR for ${selectedDate}?`,
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
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Stock DSR</Text>
          <Text style={styles.headerSub}>Daily Stock Opening & Closing Report</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {!dayOpen && (
            <TouchableOpacity
              style={[styles.dayBtn, { backgroundColor: '#16A34A' }]}
              disabled={actionLoading}
              onPress={() => handleDayAction('open')}
            >
              <Feather name="unlock" size={13} color="#FFFFFF" />
              <Text style={styles.dayBtnText}>Open</Text>
            </TouchableOpacity>
          )}
          {dayOpen && !dayEnd && (
            <TouchableOpacity
              style={[styles.dayBtn, { backgroundColor: '#DC2626' }]}
              disabled={actionLoading}
              onPress={() => handleDayAction('end')}
            >
              <Feather name="lock" size={13} color="#FFFFFF" />
              <Text style={styles.dayBtnText}>End</Text>
            </TouchableOpacity>
          )}
        </View>
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
          placeholder="Search product / executive..."
        />
        <TouchableOpacity style={styles.goBtn} onPress={() => loadData(true)}>
          <Feather name="refresh-cw" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statusStrip}>
        <Text style={styles.statusChip}>
          Day Open: <Text style={{ fontWeight: '800' }}>{dayOpen ? 'YES' : 'NO'}</Text>
        </Text>
        <Text style={styles.statusChip}>
          Day End: <Text style={{ fontWeight: '800' }}>{dayEnd ? 'YES' : 'NO'}</Text>
        </Text>
        <Text style={styles.statusChip}>
          Rows: <Text style={{ fontWeight: '800' }}>{filteredRows.length}</Text>
        </Text>
      </View>

      <OfflineBanner isOffline={!isOnline} />

      {loading ? (
        <LoadingState message="Loading Stock DSR..." />
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
              iconName="cube-outline"
              title={`No Stock DSR for ${selectedDate}`}
              subtitle="Pull down to refresh or select another date."
              actionLabel="Refresh"
              onAction={() => loadData(true)}
            />
          }
          renderItem={({ item, index }) => {
            const keys = headers.length ? headers : Object.keys(item);
            const titleKey = keys[0];
            const restKeys = keys.slice(1);
            return (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  #{index + 1} {String(item[titleKey] ?? item.product_name ?? item.sales_executive ?? 'Row')}
                </Text>
                <View style={styles.kvWrap}>
                  {restKeys.map((k) => (
                    <View key={k} style={styles.kvChip}>
                      <Text style={styles.kvLabel}>{k.replace(/_/g, ' ')}: </Text>
                      <Text style={styles.kvVal}>{String(item[k] ?? 0)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          }}
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
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  statusChip: { fontSize: 12, color: '#0E204E' },
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
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0E204E', marginBottom: 8 },
  kvWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kvChip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  kvLabel: { fontSize: 11, color: '#64748B', textTransform: 'capitalize' },
  kvVal: { fontSize: 11, fontWeight: '700', color: '#0E204E' },
});
