import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { DashboardData } from '@/api/dashboard';
import { fetchPartiesApi, PartyItem } from '@/api/parties';
import { useApp } from '@/context/AppContext';

interface PartiesViewProps {
  data: DashboardData | null;
  onAddParty: () => void;
}

export const PartiesView: React.FC<PartiesViewProps> = ({
  data,
  onAddParty,
}) => {
  const { formatAmount } = useApp();
  const [parties, setParties] = useState<PartyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Buyer' | 'Seller'>('All');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const recordType = selectedFilter === 'All' ? '' : selectedFilter;
      const realParties = await fetchPartiesApi(searchQuery, 1, 50, recordType);
      setParties(realParties);
    } catch {
      setParties([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    async function fetchList() {
      try {
        const recordType = selectedFilter === 'All' ? '' : selectedFilter;
        const realParties = await fetchPartiesApi(searchQuery, 1, 50, recordType);
        if (!isCancelled) {
          setParties(realParties);
        }
      } catch {
        if (!isCancelled) {
          setParties([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchList();

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, selectedFilter]);

  const handleCall = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const handleWhatsApp = (phone: string, name: string, dueAmount: number) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = dueAmount > 0
      ? `Dear ${name}, this is a gentle payment reminder for the outstanding balance of ₹${dueAmount.toLocaleString('en-IN')} with BTHAWK.`
      : `Hello ${name}, greeting from BTHAWK.`;
    Linking.openURL(
      `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(msg)}`
    ).catch(() => {});
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[Theme.colors.primary]}
          tintColor={Theme.colors.primary}
        />
      }
    >
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Parties & Customers</Text>
          <Text style={styles.pageSubtitle}>Real-time buyers, sellers, and retail network</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={onAddParty} activeOpacity={0.8}>
          <Feather name="user-plus" size={15} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Party</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY BANNER */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Total Receivables</Text>
          <Text style={[styles.summaryVal, { color: '#EA580C' }]}>
            {formatAmount(data?.outstandingCollected ?? 0)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Active FSEs</Text>
          <Text style={styles.summaryVal}>
            {(data?.totalFSE ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={Theme.colors.textSecondary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search party by name, phone, or GSTIN..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={16} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER PILLS */}
      <View style={styles.filterRow}>
        {(['All', 'Buyer', 'Seller'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterPill, selectedFilter === filter && styles.filterPillActive]}
            onPress={() => setSelectedFilter(filter)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter === 'All' ? 'All Parties' : `${filter}s`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* PARTIES LIST */}
      <Text style={styles.sectionTitle}>
        Registered Parties ({parties.length})
      </Text>

      {isLoading && !isRefreshing ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="small" color={Theme.colors.primary} />
          <Text style={styles.loaderText}>Loading live parties from server...</Text>
        </View>
      ) : parties.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="users" size={32} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Parties Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No parties match "${searchQuery}"`
              : 'Add your first customer, retailer, or vendor using the button above.'}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {parties.map((party) => {
            const dueAmt = Number(party.pending_amt ?? party.outstanding_amount ?? 0);
            const isBuyer = party.party_type !== 'Seller';

            return (
              <View key={party.party_id} style={styles.partyCard}>
                <View style={styles.partyHeader}>
                  <View style={styles.partyAvatar}>
                    <Text style={styles.avatarLetter}>
                      {(party.party_name || 'P').charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.partyInfo}>
                    <Text style={styles.partyName} numberOfLines={1}>
                      {party.party_name}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeText}>{party.party_type || 'Buyer'}</Text>
                      </View>
                      {party.place_of_supply ? (
                        <Text style={styles.stateText}>{party.place_of_supply}</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.balanceGroup}>
                    <Text
                      style={[
                        styles.balanceVal,
                        { color: dueAmt > 0 ? (isBuyer ? '#EA580C' : '#2563EB') : '#10B981' },
                      ]}
                    >
                      {formatAmount(dueAmt)}
                    </Text>
                    <Text style={styles.balanceStatus}>
                      {dueAmt > 0
                        ? isBuyer
                          ? 'To Collect'
                          : 'To Pay'
                        : 'Settled'}
                    </Text>
                  </View>
                </View>

                {/* PHONE & ACTIONS */}
                <View style={styles.partyActions}>
                  {party.party_phone ? (
                    <>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleCall(party.party_phone)}
                        activeOpacity={0.7}
                      >
                        <Feather name="phone" size={13} color="#2563EB" />
                        <Text style={styles.actionBtnText}>Call</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#ECFDF5' }]}
                        onPress={() =>
                          handleWhatsApp(party.party_phone, party.party_name, dueAmt)
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons name="logo-whatsapp" size={14} color="#10B981" />
                        <Text style={[styles.actionBtnText, { color: '#047857' }]}>
                          WhatsApp
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.noPhoneText}>No phone recorded</Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.collectPill,
                      dueAmt === 0 && { backgroundColor: '#F1F5F9' },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.collectText,
                        dueAmt === 0 && { color: Theme.colors.textSecondary },
                      ]}
                    >
                      {isBuyer ? 'Collect' : 'Pay'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.xs,
    paddingBottom: Theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  pageTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.borderRadius.md,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },
  divider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Theme.spacing.md,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loaderText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    gap: 10,
  },
  partyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  partyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  partyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  partyInfo: {
    flex: 1,
  },
  partyName: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  stateText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  balanceGroup: {
    alignItems: 'flex-end',
  },
  balanceVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  balanceStatus: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  partyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.sm,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  noPhoneText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  collectPill: {
    marginLeft: 'auto',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Theme.borderRadius.sm,
  },
  collectText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
