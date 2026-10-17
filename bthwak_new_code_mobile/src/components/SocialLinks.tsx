import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

interface SocialItem {
  id: string;
  type: 'ionicons' | 'fa';
  name: string;
  color: string;
  bgColor: string;
  url: string;
  label: string;
}

const SOCIAL_ITEMS: SocialItem[] = [
  {
    id: 'lock',
    type: 'ionicons',
    name: 'lock-closed',
    color: Theme.colors.social.lock,
    bgColor: Theme.colors.social.lockBg,
    url: 'https://www.bthawk.com',
    label: 'Security verified',
  },
  {
    id: 'facebook',
    type: 'fa',
    name: 'facebook-f',
    color: Theme.colors.social.facebook,
    bgColor: Theme.colors.social.facebookBg,
    url: 'https://www.facebook.com/Bell.BTHawk/',
    label: 'Facebook',
  },
  {
    id: 'instagram',
    type: 'fa',
    name: 'instagram',
    color: Theme.colors.social.instagram,
    bgColor: Theme.colors.social.instagramBg,
    url: 'https://www.instagram.com/bell.bthawk/?hl=en',
    label: 'Instagram',
  },
  {
    id: 'x',
    type: 'fa',
    name: 'x-twitter',
    color: Theme.colors.social.x,
    bgColor: Theme.colors.social.xBg,
    url: 'https://x.com/Bell_BTHawk',
    label: 'X (Twitter)',
  },
  {
    id: 'youtube',
    type: 'fa',
    name: 'youtube',
    color: Theme.colors.social.youtube,
    bgColor: Theme.colors.social.youtubeBg,
    url: 'https://www.youtube.com/channel/UCDNdYQlZ1A3SYItyfGKtCgA/videos',
    label: 'YouTube',
  },
];

export const SocialLinks: React.FC = () => {
  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.warn('Could not open URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Copyright text */}
      <View style={styles.textRow}>
        <Text style={styles.poweredText}>
          Powered by <Text style={styles.brandText}>BTHAWK</Text>
          <Text style={styles.supText}>®</Text> 2026 | Copyright ©
        </Text>
        <TouchableOpacity
          onPress={() => openLink('https://www.bthawk.com')}
          accessibilityRole="link"
          accessibilityLabel="Visit BTHAWK website"
        >
          <Text style={styles.websiteLink}> www.bthawk.com</Text>
        </TouchableOpacity>
      </View>

      {/* Social Icons */}
      <View style={styles.iconsRow}>
        {SOCIAL_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => openLink(item.url)}
            accessibilityRole="link"
            accessibilityLabel={item.label}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.bgColor }]}>
              {item.type === 'ionicons' ? (
                <Ionicons name={item.name as any} size={14} color={item.color} />
              ) : (
                <FontAwesome6 name={item.name as any} size={12} color={item.color} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  textRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  poweredText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.textMuted,
    fontWeight: '500',
  },
  brandText: {
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  supText: {
    fontSize: 8,
  },
  websiteLink: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 2,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
