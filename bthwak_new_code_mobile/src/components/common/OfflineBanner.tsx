import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography } from '@/theme';

export interface OfflineBannerProps {
  isOffline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Feather name="wifi-off" size={16} color={Colors.chips.toCollect.icon} />
      <Text style={styles.text}>
        You are offline. Changes cannot be saved until connection is restored.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chips.toCollect.bg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE3A8',
  },
  text: {
    flex: 1,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.chips.toCollect.value,
  },
});
