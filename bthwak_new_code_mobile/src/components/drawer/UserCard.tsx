import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/theme';
import { DecodedAuthPayload } from '@/context/AuthContext';

interface UserCardProps {
  user: DecodedAuthPayload | null;
  isLoading?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({ user, isLoading }) => {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.skeletonName} />
        <View style={styles.skeletonPhone} />
      </View>
    );
  }

  const businessName = user?.distributor_firm_name || user?.distributor_name || 'BTHAWK Enterprise';
  const mobileNumber = user?.distributor_mobile_no || '+91 98765 43210';

  return (
    <View style={styles.card}>
      <Text style={styles.businessName} numberOfLines={1}>
        {businessName}
      </Text>
      <Text style={styles.mobileNumber} numberOfLines={1}>
        {mobileNumber}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F5F4FF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  businessName: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 16,
    lineHeight: 20,
    color: '#1B1840',
    marginBottom: 3,
  },
  mobileNumber: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: '#5E5B85',
  },
  skeletonName: {
    width: 140,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#ECEBFA',
    marginBottom: 6,
  },
  skeletonPhone: {
    width: 90,
    height: 13,
    borderRadius: 4,
    backgroundColor: '#ECEBFA',
  },
});
