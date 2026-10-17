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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/theme';

import { addBuyerPartyApi } from '@/api/parties';

interface AddPartySheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddPartySheet: React.FC<AddPartySheetProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partyType, setPartyType] = useState<'Retailer' | 'Wholesaler' | 'Vendor'>('Retailer');
  const [gstin, setGstin] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceType, setBalanceType] = useState<'To Collect' | 'To Pay'>('To Collect');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter customer / party name');
      return;
    }
    if (phone.length < 10) {
      Alert.alert('Required', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSubmitting(true);
    try {
      await addBuyerPartyApi({
        name: name.trim(),
        phone: phone.trim(),
        gst_no: gstin.trim().toUpperCase(),
        party_outstanding: parseFloat(openingBalance) || 0,
        outstanding_type: balanceType,
      });

      Alert.alert(
        'Party Registered',
        `${name} (${partyType}) has been added to your business directory.`,
        [
          {
            text: 'Done',
            onPress: () => {
              setName('');
              setPhone('');
              setGstin('');
              setOpeningBalance('');
              onClose();
              onSuccess?.();
            },
          },
        ]
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register party on server.';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add New Party</Text>
              <Text style={styles.subtitle}>Register buyer, retailer, or vendor</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* PARTY TYPE */}
            <Text style={styles.label}>Party Category</Text>
            <View style={styles.tabRow}>
              {(['Retailer', 'Wholesaler', 'Vendor'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typePill, partyType === type && styles.typePillActive]}
                  onPress={() => setPartyType(type)}
                >
                  <Text style={[styles.typeText, partyType === type && styles.typeTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* NAME */}
            <Text style={styles.label}>Party / Enterprise Name</Text>
            <View style={styles.inputBox}>
              <Feather name="briefcase" size={16} color="#64748B" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Rajasthan Traders"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* PHONE */}
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputBox}>
              <Feather name="phone" size={16} color="#64748B" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* GSTIN */}
            <Text style={styles.label}>GSTIN (Optional)</Text>
            <View style={styles.inputBox}>
              <Feather name="file-text" size={16} color="#64748B" />
              <TextInput
                value={gstin}
                onChangeText={setGstin}
                placeholder="15-digit GSTIN"
                autoCapitalize="characters"
                maxLength={15}
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* OPENING BALANCE */}
            <Text style={styles.label}>Opening Balance (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                value={openingBalance}
                onChangeText={setOpeningBalance}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* BALANCE TYPE */}
            <View style={[styles.tabRow, { marginTop: 10 }]}>
              {(['To Collect', 'To Pay'] as const).map((bType) => (
                <TouchableOpacity
                  key={bType}
                  style={[
                    styles.typePill,
                    balanceType === bType && {
                      backgroundColor: bType === 'To Collect' ? '#EA580C' : '#2563EB',
                    },
                  ]}
                  onPress={() => setBalanceType(bType)}
                >
                  <Text
                    style={[
                      styles.typeText,
                      balanceType === bType && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    {bType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
            disabled={isSubmitting}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'Saving...' : 'Register Party'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.xl,
    maxHeight: '85%',
    ...Theme.shadows.card,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  body: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  typePillActive: {
    backgroundColor: Theme.colors.primary,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  typeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
