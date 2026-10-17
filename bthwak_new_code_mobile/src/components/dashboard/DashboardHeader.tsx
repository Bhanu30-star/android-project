import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';

interface DashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onLogout: () => void;
  onPressProfile?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefresh,
  isRefreshing,
  onLogout,
  onPressProfile,
}) => {
  const { user } = useAuth();

  const displayName =
    user?.distributor_name || user?.distributor_firm_name || 'Business Partner';
  const firmName = user?.distributor_firm_name || 'BTHAWK Enterprise';
  const userRole = user?.user_role || 'Distributor Admin';

  return (
    <View style={styles.container}>
      {/* BRAND BAR */}
      <View style={styles.topBar}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.actionsGroup}>
          <TouchableOpacity
            onPress={onRefresh}
            style={styles.actionBtn}
            disabled={isRefreshing}
            accessibilityLabel="Refresh Dashboard"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            ) : (
              <Feather name="refresh-cw" size={17} color={Theme.colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPressProfile}
            style={styles.profileBtn}
            accessibilityLabel="View Profile"
          >
            <Feather name="user" size={16} color={Theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLogout}
            style={styles.logoutBtn}
            accessibilityLabel="Log out"
          >
            <Feather name="log-out" size={16} color={Theme.colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* USER HERO BANNER */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPressProfile}
        accessibilityLabel="Open Business Profile"
      >
        <LinearGradient
          colors={Theme.colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
        <View style={styles.heroRow}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.firmName} numberOfLines={1}>
              {firmName}
            </Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Feather name="shield" size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>Role: {userRole}</Text>
          </View>
          {user?.distributor_id && (
            <View style={styles.idBadge}>
              <Text style={styles.badgeText}>ID: #{user.distributor_id}</Text>
            </View>
          )}
          <View style={styles.liveBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  logo: {
    width: 140,
    height: 36,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.error,
  },
  heroCard: {
    borderRadius: Theme.borderRadius.card,
    padding: Theme.spacing.md + 2,
    ...Theme.shadows.card,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Theme.spacing.sm + 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroText: {
    flex: 1,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: Theme.typography.sizes.lg,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  firmName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  idBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    marginLeft: 'auto',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  liveText: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '700',
  },
});
