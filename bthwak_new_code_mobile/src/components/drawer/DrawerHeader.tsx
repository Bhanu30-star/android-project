import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface DrawerHeaderProps {
  onClose: () => void;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({ onClose }) => {
  return (
    <View style={styles.header}>
      {/* Brand Logo Tile (48x48 radius 15, showing shield emblem without text) */}
      <View style={styles.logoTile}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel="BTHAWK Emblem"
        />
      </View>

      {/* 44px round close button */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        activeOpacity={0.8}
        accessibilityLabel="Close navigation drawer"
        accessibilityRole="button"
      >
        <Feather name="x" size={20} color="#2A2470" />
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
    backgroundColor: '#F1F0FF',
    overflow: 'hidden',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  logoImage: {
    width: 150,
    height: 38,
    marginLeft: -4,
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
