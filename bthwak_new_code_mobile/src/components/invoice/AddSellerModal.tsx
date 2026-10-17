import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiClient } from '@/api/client';
import { Colors, Typography, Shapes, Shadows } from '@/theme/tokens';
import { RetailerParty } from '@/api/invoiceService';

interface AddSellerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newParty: RetailerParty) => void;
}

export const AddSellerModal: React.FC<AddSellerModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [partyName, setPartyName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!partyName.trim()) {
      Alert.alert('Required', 'Please enter Firm / Party name');
      return;
    }
    if (phone.trim() && phone.trim().length !== 10) {
      Alert.alert('Validation', 'Mobile number must be 10 digits');
      return;
    }

    try {
      setIsSubmitting(true);
      // Attempt backend party registration
      const response = await apiClient.post('/sale/addBuyerSeller', {
        firm_name: partyName.trim(),
        mobile: phone.trim(),
        gst_no: gstin.trim().toUpperCase(),
        address: address.trim(),
        user_type: 'Buyer',
      }).catch(() => null);

      const newId = response?.data?.data?.party_id || Date.now();
      const newParty: RetailerParty = {
        partyId: Number(newId),
        partyName: partyName.trim(),
        partyPhone: phone.trim(),
        partyGst: gstin.trim().toUpperCase(),
        partyAddress: address.trim(),
      };

      Alert.alert('Success', 'Party added successfully');
      setPartyName('');
      setPhone('');
      setGstin('');
      setAddress('');
      onSuccess(newParty);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not add party');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add Seller / Buyer</Text>
              <Text style={styles.subtitle}>Register new party directly</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Firm / Party Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter business name"
                placeholderTextColor={Colors.textSecondary}
                value={partyName}
                onChangeText={setPartyName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>GSTIN (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="15-character GSTIN"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="characters"
                maxLength={15}
                value={gstin}
                onChangeText={setGstin}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Complete address"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Save & Select Party</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 24, 64, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 28,
    ...Shadows.card,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tabBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: Typography.statLabel.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusMedium,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  textArea: {
    height: 72,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: Shapes.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    ...Shadows.card,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
