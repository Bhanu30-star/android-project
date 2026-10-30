import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface DrawerFooterProps {
  onPressHelp?: () => void;
  onPressLogout: () => void;
}

export const DrawerFooter: React.FC<DrawerFooterProps> = ({
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
      {/* Log out */}
      <TouchableOpacity
        style={styles.logoutRow}
        onPress={handleLogoutPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <Feather name="log-out" size={18} color="#FF5C6C" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.versionText}>Version 2.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5C6C',
  },
  versionText: {
    fontSize: 13,
    color: '#5B6084',
    fontWeight: '500',
    paddingLeft: 2,
  },
});
