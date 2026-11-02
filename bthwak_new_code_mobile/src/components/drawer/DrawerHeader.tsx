import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BthawkLogo } from '@/components/BthawkLogo';

interface DrawerHeaderProps {
  onClose: () => void;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({ onClose }) => {
  return (
    <View style={styles.header}>
      {/* Brand Logo Tile showing new emblem */}
      <View style={styles.logoTile}>
        <BthawkLogo size={36} showText={false} />
      </View>

      {/* 44px round close button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        activeOpacity={0.8}
        accessibilityLabel="Close navigation drawer"
        accessibilityRole="button"
      >
        <Feather name="x" size={20} color="#0E204E" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  logoTile: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#F0F5FC',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
