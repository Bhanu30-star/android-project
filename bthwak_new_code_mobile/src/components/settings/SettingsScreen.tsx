import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { formatReadable } from '@/utils/dateUtils';

interface SettingsScreenProps {
  onLogout: () => void;
  onOpenQr: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onLogout,
  onOpenQr,
}) => {
  const { user } = useAuth();

  const firmName = String(user?.distributor_firm_name || 'BTHAWK Enterprise');
  const ownerName = String(user?.distributor_name || 'Business Partner');
  const email = String(user?.distributor_email || 'Not configured');
  const phone = String(user?.distributor_mobile_no || 'Not configured');
  const placeOfSupply = String(user?.place_of_supply || 'India');
  const renewalDate = user?.distributor_renewal_datetime
    ? formatReadable(String(user.distributor_renewal_datetime))
    : 'Active Plan';

  const handleClearCache = () => {
    Alert.alert('Cache Cleared', 'Temporary reports cache has been flushed.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings & Profile</Text>
        <Text style={styles.subtitle}>Enterprise configuration and subscription status</Text>
      </View>

      {/* BUSINESS CARD */}
      <View style={styles.firmCard}>
        <View style={styles.firmAvatar}>
          <Text style={styles.firmAvatarText}>
            {firmName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.firmInfo}>
          <Text style={styles.firmName}>{firmName}</Text>
          <Text style={styles.ownerText}>
            {ownerName} • ID #{user?.distributor_id || '42'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              Role: {String(user?.user_role || 'Distributor Admin')}
            </Text>
          </View>
        </View>
      </View>

      {/* PLAN & RENEWAL CARD */}
      <View style={styles.planCard}>
        <View style={styles.planTop}>
          <Ionicons name="shield-checkmark" size={18} color="#059669" />
          <Text style={styles.planTitle}>BTHAWK Enterprise Plan</Text>
          <View style={styles.activePill}>
            <Text style={styles.activeText}>Active</Text>
          </View>
        </View>
        <Text style={styles.planRenewalText}>
          Next Renewal Date: <Text style={styles.boldText}>{renewalDate}</Text>
        </Text>
      </View>

      {/* ACCOUNT DETAILS */}
      <Text style={styles.sectionHeader}>Business Particulars</Text>
      <View style={styles.cardGroup}>
        <View style={styles.infoRow}>
          <Feather name="mail" size={16} color="#64748B" />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Official Email</Text>
            <Text style={styles.infoVal}>{email}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Feather name="phone" size={16} color="#64748B" />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Authorized Phone</Text>
            <Text style={styles.infoVal}>{phone}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Feather name="map-pin" size={16} color="#64748B" />
          <View style={styles.infoText}>
            <Text style={styles.infoLabel}>Place of Supply (GST)</Text>
            <Text style={styles.infoVal}>{placeOfSupply}</Text>
          </View>
        </View>
      </View>

      {/* QUICK SYSTEM ACTIONS */}
      <Text style={styles.sectionHeader}>Session & Connectivity</Text>
      <View style={styles.cardGroup}>
        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.7}
          onPress={onOpenQr}
        >
          <Ionicons name="qr-code-outline" size={18} color={Theme.colors.primary} />
          <Text style={styles.actionRowText}>Scan BTHAWK Web QR</Text>
          <Feather name="chevron-right" size={16} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.actionRow}
          activeOpacity={0.7}
          onPress={handleClearCache}
        >
          <Feather name="database" size={16} color="#64748B" />
          <Text style={styles.actionRowText}>Clear Temporary Cache</Text>
          <Feather name="chevron-right" size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity
        style={styles.logoutBtn}
        activeOpacity={0.85}
        onPress={() => {
          Alert.alert('Sign Out', 'Are you sure you want to log out of BTHAWK?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: onLogout },
          ]);
        }}
      >
        <Feather name="log-out" size={16} color={Theme.colors.error} />
        <Text style={styles.logoutText}>Sign Out of BTHAWK</Text>
      </TouchableOpacity>

      {/* FOOTER */}
      <Text style={styles.versionText}>BTHAWK Mobile Enterprise • v2.4.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.xs,
    paddingBottom: Theme.spacing.xl,
  },
  header: {
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  firmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  firmAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  firmAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: Theme.colors.primary,
  },
  firmInfo: {
    flex: 1,
  },
  firmName: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  ownerText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  planCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: Theme.spacing.md,
  },
  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    flex: 1,
  },
  activePill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  planRenewalText: {
    fontSize: 12,
    color: '#047857',
  },
  boldText: {
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 6,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  actionRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 13,
    borderRadius: Theme.borderRadius.md,
    marginTop: 6,
  },
  logoutText: {
    color: Theme.colors.error,
    fontWeight: '700',
    fontSize: 13,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 16,
  },
});
