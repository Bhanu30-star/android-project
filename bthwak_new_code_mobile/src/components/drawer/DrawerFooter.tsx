import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Typography } from '@/theme';

interface DrawerFooterProps {
  onPressHelp: () => void;
  onPressLogout: () => void;
}

export const DrawerFooter: React.FC<DrawerFooterProps> = ({
  onPressHelp,
  onPressLogout,
}) => {
  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out from BTHAWK?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: onPressLogout,
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.footerContainer}>
      <View style={styles.divider} />

      {/* Help & Support */}
      <TouchableOpacity
        style={styles.row}
        onPress={onPressHelp}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Help and support"
      >
        <Feather name="help-circle" size={20} color="#4F46E5" />
        <Text style={styles.helpText}>Help & support</Text>
      </TouchableOpacity>

      {/* Log out */}
      <TouchableOpacity
        style={styles.row}
        onPress={handleLogoutPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <Feather name="log-out" size={20} color="#B01E25" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECEBFA',
    marginBottom: 8,
  },
  row: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  helpText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#1B1840',
  },
  logoutText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#B01E25',
  },
});
