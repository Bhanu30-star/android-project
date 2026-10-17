import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { ProfileScreen } from '../profile/ProfileScreen';

export interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
  onOpenQr?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ProfileScreen onGoBack={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F4FF',
  },
});
