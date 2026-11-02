import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SalesExecutiveUser,
  fetchExecutiveDetailsApi,
  updateExecutiveProfileApi,
  updateExecutivePasswordApi,
} from '@/api/salesExecutive';

interface EditExecutiveModalProps {
  visible: boolean;
  user: SalesExecutiveUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditExecutiveModal: React.FC<EditExecutiveModalProps> = ({
  visible,
  user,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();

  // Profile Form State
  const [userName, setUserName] = useState('');
  const [invoiceType, setInvoiceType] = useState('Both');
  const [eRecharge, setERecharge] = useState('None');
  const [isInvoiceTypeSheetOpen, setIsInvoiceTypeSheetOpen] = useState(false);
  const [isERechargeSheetOpen, setIsERechargeSheetOpen] = useState(false);

  // Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading States
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!visible || !user) return;
    setUserName(user.user_name || user.name || '');
    setInvoiceType(user.invoiceType || 'Both');
    setERecharge(user.eRecharge || 'None');
    setNewPassword('');
    setConfirmPassword('');

    // Load full details
    loadDetails(user.user_id);
  }, [visible, user]);

  const loadDetails = async (saleId: string | number) => {
    try {
      setIsLoadingDetails(true);
      const res = await fetchExecutiveDetailsApi(saleId);
      if (res) {
        if (res.userName) setUserName(res.userName);
        if (res.invoiceType) setInvoiceType(res.invoiceType);
        if (res.eRechargeSetting) setERecharge(res.eRechargeSetting);
      }
    } catch (err) {
      // fallback to user prop values
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (!userName.trim()) {
      Alert.alert('Required', 'Sales Executive Name is required.');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      await updateExecutiveProfileApi({
        sale_id: user.user_id,
        user_name: userName.trim(),
        invoice_type: invoiceType,
        rechargetype: eRecharge,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;
    if (!newPassword.trim()) {
      Alert.alert('Required', 'Please enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await updateExecutivePasswordApi({
        sale_id: user.user_id,
        old_password: user.password || user.userPassword || '',
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      Alert.alert('Success', 'Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.7}>
            <Feather name="arrow-left" size={22} color="#0E204E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Sales Executive</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {isLoadingDetails && (
            <View style={styles.topLoadingBar}>
              <ActivityIndicator size="small" color="#0047AB" />
              <Text style={styles.topLoadingText}>Syncing latest details...</Text>
            </View>
          )}

          {/* CARD 1: Profile Settings */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>PROFILE SETTINGS</Text>

            {/* Sales Executive Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Sales Executive Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.standardInput}
                placeholder="Enter sales executive name"
                placeholderTextColor="#8E9CAE"
                value={userName}
                onChangeText={setUserName}
              />
            </View>

            {/* Invoice Type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Invoice Type <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setIsInvoiceTypeSheetOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownBtnText}>{invoiceType}</Text>
                <Feather name="chevron-down" size={18} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            {/* E-Recharge */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-Recharge Setting</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setIsERechargeSheetOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.dropdownBtnText}>{eRecharge}</Text>
                <Feather name="chevron-down" size={18} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            {/* Update Profile Button */}
            <TouchableOpacity
              style={[styles.actionBtn, isUpdatingProfile && styles.actionBtnDisabled]}
              onPress={handleUpdateProfile}
              disabled={isUpdatingProfile}
              activeOpacity={0.85}
            >
              {isUpdatingProfile ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnText}>Update Profile</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* CARD 2: Password Change */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>CHANGE PASSWORD</Text>

            {/* New Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>New Password</Text>
              <View style={styles.passwordInputBox}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password"
                  placeholderTextColor="#8E9CAE"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather
                    name={showNewPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color="#5A6B87"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={styles.passwordInputBox}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Retype new password"
                  placeholderTextColor="#8E9CAE"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color="#5A6B87"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Update Password Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.passwordBtn,
                isUpdatingPassword && styles.actionBtnDisabled,
              ]}
              onPress={handleUpdatePassword}
              disabled={isUpdatingPassword}
              activeOpacity={0.85}
            >
              {isUpdatingPassword ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* INVOICE TYPE SHEET */}
        <Modal
          visible={isInvoiceTypeSheetOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsInvoiceTypeSheetOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.overlayTouch}
              activeOpacity={1}
              onPress={() => setIsInvoiceTypeSheetOpen(false)}
            />
            <View style={styles.selectSheetCard}>
              <Text style={styles.sheetTitle}>Select Invoice Type</Text>
              {(['Both', 'Tax Invoice', 'Delivery Challan'] as const).map((t) => {
                const isSelected = invoiceType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.selectOption, isSelected && styles.selectOptionActive]}
                    onPress={() => {
                      setInvoiceType(t);
                      setIsInvoiceTypeSheetOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        isSelected && styles.selectOptionTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

        {/* E-RECHARGE SHEET */}
        <Modal
          visible={isERechargeSheetOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsERechargeSheetOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.overlayTouch}
              activeOpacity={1}
              onPress={() => setIsERechargeSheetOpen(false)}
            />
            <View style={styles.selectSheetCard}>
              <Text style={styles.sheetTitle}>Select E-Recharge Setting</Text>
              {(['None', 'Fixed', 'Dynamic'] as const).map((t) => {
                const isSelected = eRecharge === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.selectOption, isSelected && styles.selectOptionActive]}
                    onPress={() => {
                      setERecharge(t);
                      setIsERechargeSheetOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        isSelected && styles.selectOptionTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.3,
  },
  headerRightPlaceholder: {
    width: 38,
  },
  scrollFlex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  topLoadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  topLoadingText: {
    fontSize: 12,
    color: '#5A6B87',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
    gap: 14,
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#5A6B87',
    letterSpacing: 0.8,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  requiredStar: {
    color: '#DC2626',
  },
  standardInput: {
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#0E204E',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownBtnText: {
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '500',
  },
  passwordInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
    paddingVertical: 0,
  },
  actionBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  passwordBtn: {
    backgroundColor: '#0E204E',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  overlayTouch: {
    ...StyleSheet.absoluteFill,
  },
  selectSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 18,
    gap: 8,
    elevation: 12,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 6,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  selectOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0E204E',
  },
  selectOptionTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
});
