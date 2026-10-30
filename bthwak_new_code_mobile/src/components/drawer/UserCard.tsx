import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DecodedAuthPayload } from '@/context/AuthContext';

interface UserCardProps {
  user: DecodedAuthPayload | null;
  isLoading?: boolean;
  onPressSettings?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, isLoading, onPressSettings }) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.avatarSkeleton} />
        <View style={{ flex: 1 }}>
          <View style={styles.skeletonName} />
          <View style={styles.skeletonPhone} />
        </View>
      </View>
    );
  }

  const displayName = user?.distributor_name || user?.distributor_firm_name || 'girraj';
  const initial = displayName.charAt(0).toUpperCase() || 'G';
  const phone = user?.distributor_mobile_no || '6789000098';
  const location = user?.place_of_supply || 'Rajasthan';

  return (
    <View style={styles.container}>
      {/* Lavender Avatar Box */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      {/* User Info */}
      <View style={styles.infoWrapper}>
        <Text style={styles.userName} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={styles.metaRow}>
          <Feather name="phone" size={11} color="#8E95B3" style={{ marginRight: 3 }} />
          <Text style={styles.metaText}>{phone}</Text>
          <Feather name="map-pin" size={11} color="#8E95B3" style={{ marginLeft: 8, marginRight: 3 }} />
          <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
        </View>
      </View>

      {/* Settings Gear Icon */}
      <TouchableOpacity
        onPress={onPressSettings}
        style={styles.settingsButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Settings"
      >
        <Feather name="settings" size={20} color="#8E95B3" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2540',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#8B98F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#100F1D',
  },
  infoWrapper: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F2F2FA',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#8E95B3',
    fontWeight: '500',
  },
  settingsButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1E2540',
  },
  skeletonName: {
    width: 120,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#1E2540',
    marginBottom: 6,
    marginLeft: 14,
  },
  skeletonPhone: {
    width: 160,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#1E2540',
    marginLeft: 14,
  },
});
