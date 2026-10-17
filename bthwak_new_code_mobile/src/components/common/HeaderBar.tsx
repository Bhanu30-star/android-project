import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';

interface HeaderBarProps {
  onPressProfile: () => void;
  onPressNotifications?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onPressProfile,
  onPressNotifications,
}) => {
  const { user } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = useApp();

  const firmName = String(user?.distributor_firm_name || 'BTHAWK Enterprise');
  const ownerName = String(user?.distributor_name || 'Partner');

  return (
    <View style={styles.container}>
      {/* LEFT: BRAND LOGO & FIRM NAME */}
      <View style={styles.leftGroup}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.firmPill}>
          <View style={styles.liveDot} />
          <Text style={styles.firmText} numberOfLines={1}>
            {firmName}
          </Text>
        </View>
      </View>

      {/* RIGHT: PRIVACY TOGGLE + NOTIFICATION + PROFILE */}
      <View style={styles.rightGroup}>
        {/* Privacy eye toggle */}
        <TouchableOpacity
          style={[styles.iconButton, isPrivacyMode && styles.iconButtonActive]}
          onPress={togglePrivacyMode}
          activeOpacity={0.7}
          accessibilityLabel="Toggle balance privacy"
        >
          <Feather
            name={isPrivacyMode ? 'eye-off' : 'eye'}
            size={17}
            color={isPrivacyMode ? Theme.colors.primary : '#64748B'}
          />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPressNotifications}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <Feather name="bell" size={17} color="#64748B" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>

        {/* User avatar chip */}
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={onPressProfile}
          activeOpacity={0.8}
          accessibilityLabel="User profile"
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {ownerName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logo: {
    width: 120,
    height: 32,
  },
  firmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    maxWidth: 140,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  firmText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Theme.shadows.card,
  },
  iconButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  notifBadge: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  avatarButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.button,
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
