import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Shapes, Shadows } from '@/theme';
import {
  useProfileQuery,
  useUpdateProfileMutation,
  ProfileDetails,
  FALLBACK_PROFILE,
} from '@/api/profile';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { FormInput } from '../common/FormInput';
import { ImageUploadTile } from '../common/ImageUploadTile';
import { OfflineBanner } from '../common/OfflineBanner';
import { Toast } from '../common/Toast';
import { ChangePasswordSheet } from './ChangePasswordSheet';

interface ProfileFormInnerProps {
  initialProfile: ProfileDetails;
  onGoBack: () => void;
}

const ProfileFormInner: React.FC<ProfileFormInnerProps> = ({
  initialProfile,
  onGoBack,
}) => {
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStatus();
  const updateProfileMutation = useUpdateProfileMutation();

  // Active section tab
  const [activeTab, setActiveTab] = useState<'personal' | 'subscription' | 'account'>('personal');

  // Change password modal
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Toast state
  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'success',
  });

  // Form Fields State initialized directly from initialProfile (no cascading useEffect)
  const [firmName, setFirmName] = useState(initialProfile.distributor_name || '');
  const [firmNameHindi, setFirmNameHindi] = useState(initialProfile.distributor_name_in_hindi || '');
  const [mobileNumber, setMobileNumber] = useState(initialProfile.mobile_no || initialProfile.primary_no || '');
  const [address, setAddress] = useState(initialProfile.distributor_address || '');
  const [addressHindi, setAddressHindi] = useState(initialProfile.distributor_address_in_hindi || '');
  const [businessDescription, setBusinessDescription] = useState(
    initialProfile.business_description || initialProfile.description || ''
  );

  // Tax & Registration
  const [gstin, setGstin] = useState(initialProfile.gstin || initialProfile.gstin_no || '');
  const [panNumber, setPanNumber] = useState(initialProfile.pan_no || '');
  const [country, setCountry] = useState(initialProfile.country || 'India');
  const [dlnNo, setDlnNo] = useState(initialProfile.dln_no || '');
  const [foodLicenseNo, setFoodLicenseNo] = useState(initialProfile.food_license || '');
  const [udyamRegNo, setUdyamRegNo] = useState(initialProfile.udyam_no || '');
  const [tcsApplicable, setTcsApplicable] = useState<'Yes' | 'No'>(initialProfile.tcs_applicable || 'No');

  // Portal Logins (passwords never logged/cached)
  const [gstUsername, setGstUsername] = useState(initialProfile.gst_username || '');
  const [gstPassword, setGstPassword] = useState(initialProfile.gst_password || '');
  const [itrUsername, setItrUsername] = useState(initialProfile.itr_username || '');
  const [itrPassword, setItrPassword] = useState(initialProfile.itr_password || '');

  // Uploads
  const [bankQrUri, setBankQrUri] = useState<string | null>(initialProfile.bank_qr_code || null);
  const [companyLogoUri, setCompanyLogoUri] = useState<string | null>(initialProfile.company_logo || null);
  const [profileAvatarUri, setProfileAvatarUri] = useState<string | null>(initialProfile.profile_image || null);

  // Dirty State Calculation against initial values
  const isDirty = useMemo(() => {
    return (
      firmName !== (initialProfile.distributor_name ?? '') ||
      firmNameHindi !== (initialProfile.distributor_name_in_hindi ?? '') ||
      mobileNumber !== (initialProfile.mobile_no || initialProfile.primary_no || '') ||
      address !== (initialProfile.distributor_address ?? '') ||
      addressHindi !== (initialProfile.distributor_address_in_hindi ?? '') ||
      businessDescription !== (initialProfile.business_description || initialProfile.description || '') ||
      gstin !== (initialProfile.gstin || initialProfile.gstin_no || '') ||
      panNumber !== (initialProfile.pan_no ?? '') ||
      country !== (initialProfile.country || 'India') ||
      dlnNo !== (initialProfile.dln_no ?? '') ||
      foodLicenseNo !== (initialProfile.food_license ?? '') ||
      udyamRegNo !== (initialProfile.udyam_no ?? '') ||
      tcsApplicable !== (initialProfile.tcs_applicable || 'No') ||
      gstUsername !== (initialProfile.gst_username ?? '') ||
      gstPassword !== (initialProfile.gst_password ?? '') ||
      itrUsername !== (initialProfile.itr_username ?? '') ||
      itrPassword !== (initialProfile.itr_password ?? '') ||
      bankQrUri !== (initialProfile.bank_qr_code || null) ||
      companyLogoUri !== (initialProfile.company_logo || null) ||
      profileAvatarUri !== (initialProfile.profile_image || null)
    );
  }, [
    initialProfile,
    firmName,
    firmNameHindi,
    mobileNumber,
    address,
    addressHindi,
    businessDescription,
    gstin,
    panNumber,
    country,
    dlnNo,
    foodLicenseNo,
    udyamRegNo,
    tcsApplicable,
    gstUsername,
    gstPassword,
    itrUsername,
    itrPassword,
    bankQrUri,
    companyLogoUri,
    profileAvatarUri,
  ]);

  // Validation Rules
  const validateFirmName = (val: string): string | null => {
    if (!val || val.trim().length < 2) return 'Firm name required';
    return null;
  };

  const validateMobile = (val: string): string | null => {
    if (!val) return '10-digit mobile required';
    const cleaned = val.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      return 'Enter valid 10-digit mobile number';
    }
    return null;
  };

  const validateGstin = (val: string): string | null => {
    if (!val || val.trim() === '') return null; // optional
    if (val.trim().length !== 15) {
      return 'GSTIN must be 15 characters';
    }
    const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[A-Z0-9]{1}[0-9A-Z]{1}$/;
    if (!gstinPattern.test(val.trim().toUpperCase())) {
      return 'Invalid GSTIN format';
    }
    return null;
  };

  const validatePan = (val: string): string | null => {
    if (!val || val.trim() === '') return null; // optional
    if (val.trim().length !== 10) {
      return 'PAN must be 10 characters';
    }
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panPattern.test(val.trim().toUpperCase())) {
      return 'Invalid PAN format (e.g. ABCDE1234F)';
    }
    return null;
  };

  // Overall Form Validity
  const isValid = useMemo(() => {
    if (validateFirmName(firmName)) return false;
    if (validateMobile(mobileNumber)) return false;
    if (validateGstin(gstin)) return false;
    if (validatePan(panNumber)) return false;
    return true;
  }, [firmName, mobileNumber, gstin, panNumber]);

  // Handle Back Button with Unsaved Changes check
  const handleBack = () => {
    if (isDirty) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes that will be lost.',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: onGoBack,
          },
        ]
      );
    } else {
      onGoBack();
    }
  };

  // Change Profile Avatar (Pick square image)
  const handleChangeAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera roll access needed.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileAvatarUri(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to select image');
    }
  };

  // Save changes handler
  const handleSave = async () => {
    if (!isDirty || !isValid || !isOnline || updateProfileMutation.isPending) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('distributor_name', firmName.trim());
      formData.append('distributor_name_in_hindi', firmNameHindi.trim());
      formData.append('mobile_no', mobileNumber.trim());
      formData.append('distributor_email', initialProfile.distributor_email || 'bhanu.appyzio30@gmail.com');
      formData.append('distributor_address', address.trim());
      formData.append('distributor_address_in_hindi', addressHindi.trim());
      formData.append('description', businessDescription.trim());
      formData.append('gstin', gstin.trim().toUpperCase());
      formData.append('pan_no', panNumber.trim().toUpperCase());
      formData.append('country', country);
      formData.append('dln_no', dlnNo.trim());
      formData.append('food_license', foodLicenseNo.trim());
      formData.append('udyam_no', udyamRegNo.trim());
      formData.append('tcs_applicable', tcsApplicable);
      formData.append('gst_username', gstUsername.trim());
      formData.append('gst_password', gstPassword);
      formData.append('itr_username', itrUsername.trim());
      formData.append('itr_password', itrPassword);

      if (companyLogoUri) {
        formData.append('company_logo', {
          uri: companyLogoUri,
          name: 'company_logo.jpg',
          type: 'image/jpeg',
        } as any);
      } else {
        formData.append('company_logo', '');
      }

      if (bankQrUri) {
        formData.append('bank_qr_code', {
          uri: bankQrUri,
          name: 'bank_qr.jpg',
          type: 'image/jpeg',
        } as any);
      } else {
        formData.append('bank_qr_code', '');
      }

      const res = await updateProfileMutation.mutateAsync(formData);

      setToastConfig({
        visible: true,
        message: res.message || 'Profile updated successfully!',
        type: 'success',
      });

      // After short feedback toast, go back
      setTimeout(() => {
        onGoBack();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server error while saving';
      setToastConfig({
        visible: true,
        message: msg,
        type: 'error',
      });
    }
  };

  const isSaving = updateProfileMutation.isPending;
  const isSaveDisabled = !isDirty || !isValid || !isOnline || isSaving;

  return (
    <View style={styles.screen}>
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onDismiss={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* TOP NAVIGATION BAR */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          style={styles.backCircleBtn}
          onPress={handleBack}
          activeOpacity={0.8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Feather name="chevron-left" size={24} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Profile</Text>

        <View style={styles.topBarRight}>
          {isDirty && (
            <View style={styles.unsavedBadge}>
              <Text style={styles.unsavedText}>Unsaved changes</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* OFFLINE BANNER */}
        <OfflineBanner isOffline={!isOnline} />

        {/* 1. TOP PROFILE CARD */}
        <View style={styles.profileCard}>
          {/* Avatar with Camera Badge */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              {profileAvatarUri ? (
                <Image source={{ uri: profileAvatarUri }} style={styles.avatarImg} />
              ) : (
                <Feather name="user" size={38} color={Colors.primary} />
              )}
            </View>
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handleChangeAvatar}
              disabled={isSaving}
              activeOpacity={0.8}
              accessibilityLabel="Change profile picture"
              accessibilityRole="button"
            >
              <Feather name="camera" size={13} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* User Name & Location */}
          <Text style={styles.profileName}>{firmName || initialProfile.user_name || 'Bhanu'}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.locationText}>{initialProfile.place_of_supply || 'Rajasthan'}</Text>
          </View>

          {/* 3 Info Boxes */}
          <View style={styles.infoBoxesContainer}>
            <View style={styles.infoBox}>
              <View style={styles.infoIconChip}>
                <Feather name="smartphone" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.infoBoxValue} numberOfLines={1}>
                {mobileNumber || '7726990856'}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoIconChip}>
                <Feather name="mail" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.infoBoxValue} numberOfLines={1}>
                {initialProfile.distributor_email || 'bhanu.appyzio30@gmail.com'}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoIconChip}>
                <Feather name="alert-circle" size={16} color={Colors.primary} />
              </View>
              <Text style={styles.infoBoxLabel}>App version</Text>
              <Text style={styles.infoBoxVersion}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* 2. MENU ACTIONS CARD */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setShowChangePassword(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconChip}>
              <Feather name="lock" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuRowText}>Change password</Text>
            <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Settings', 'App configuration settings.')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconChip}>
              <Feather name="sliders" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuRowText}>Settings</Text>
            <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('System Updates', 'Your BTHAWK client is on version 1.0.0 (Latest).')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconChip}>
              <Feather name="download" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuRowText}>System updates</Text>
            <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => Alert.alert('Help & Support', 'Reach out to support@bthawk.com or WhatsApp +91 98765 43210.')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconChip}>
              <Feather name="help-circle" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.menuRowText}>Help</Text>
            <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 3. SECTION TABS */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'personal' && styles.tabPillActive]}
            onPress={() => setActiveTab('personal')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'personal' && styles.tabPillTextActive,
              ]}
            >
              Personal info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'subscription' && styles.tabPillActive]}
            onPress={() => setActiveTab('subscription')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'subscription' && styles.tabPillTextActive,
              ]}
            >
              Subscription
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'account' && styles.tabPillActive]}
            onPress={() => setActiveTab('account')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'account' && styles.tabPillTextActive,
              ]}
            >
              Account info
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: PERSONAL INFO */}
        {activeTab === 'personal' && (
          <>
            {/* CARD A: BUSINESS DETAILS */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>Business details</Text>

              <FormInput
                label="Firm name"
                required
                placeholder="Enter firm name"
                value={firmName}
                onChangeText={setFirmName}
                onValidate={validateFirmName}
                disabled={isSaving}
              />

              <FormInput
                label="Firm name (Hindi)"
                placeholder="नाम"
                value={firmNameHindi}
                onChangeText={setFirmNameHindi}
                disabled={isSaving}
              />

              <FormInput
                label="Mobile number"
                placeholder="Enter 10-digit mobile number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                onValidate={validateMobile}
                keyboardType="phone-pad"
                maxLength={10}
                disabled={isSaving}
              />

              <FormInput
                label="Address"
                placeholder="Enter complete office address"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                disabled={isSaving}
              />

              <FormInput
                label="Address (Hindi)"
                placeholder="पता"
                value={addressHindi}
                onChangeText={setAddressHindi}
                multiline
                numberOfLines={3}
                disabled={isSaving}
              />

              <FormInput
                label="Business description"
                placeholder="Tell customers about your business"
                value={businessDescription}
                onChangeText={setBusinessDescription}
                multiline
                numberOfLines={3}
                disabled={isSaving}
              />
            </View>

            {/* CARD B: REGISTRATION & TAX */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>Registration & tax</Text>

              {/* 2-column: GSTIN & PAN */}
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <FormInput
                    label="GSTIN no"
                    placeholder="Enter GSTIN"
                    value={gstin}
                    onChangeText={(t) => setGstin(t.toUpperCase())}
                    onValidate={validateGstin}
                    autoCapitalize="characters"
                    maxLength={15}
                    disabled={isSaving}
                  />
                </View>
                <View style={styles.gridCol}>
                  <FormInput
                    label="PAN number"
                    placeholder="Enter PAN"
                    value={panNumber}
                    onChangeText={(t) => setPanNumber(t.toUpperCase())}
                    onValidate={validatePan}
                    autoCapitalize="characters"
                    maxLength={10}
                    disabled={isSaving}
                  />
                </View>
              </View>

              {/* 2-column: Country & DLN */}
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <FormInput
                    label="Country"
                    placeholder="Country"
                    value={country}
                    onChangeText={setCountry}
                    disabled={isSaving}
                  />
                </View>
                <View style={styles.gridCol}>
                  <FormInput
                    label="DLN no"
                    placeholder="Enter DLN no"
                    value={dlnNo}
                    onChangeText={setDlnNo}
                    disabled={isSaving}
                  />
                </View>
              </View>

              {/* 2-column: Food license & Udyam */}
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <FormInput
                    label="Food license no"
                    placeholder="Enter number"
                    value={foodLicenseNo}
                    onChangeText={setFoodLicenseNo}
                    disabled={isSaving}
                  />
                </View>
                <View style={styles.gridCol}>
                  <FormInput
                    label="Udyam registration no"
                    placeholder="Enter number"
                    value={udyamRegNo}
                    onChangeText={setUdyamRegNo}
                    disabled={isSaving}
                  />
                </View>
              </View>

              {/* TCS applicable segmented button */}
              <View style={styles.tcsContainer}>
                <Text style={styles.tcsLabel}>TCS applicable</Text>
                <View style={styles.segmentWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      tcsApplicable === 'Yes' && styles.segmentBtnActive,
                    ]}
                    onPress={() => setTcsApplicable('Yes')}
                    disabled={isSaving}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        tcsApplicable === 'Yes' && styles.segmentBtnTextActive,
                      ]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.segmentBtn,
                      tcsApplicable === 'No' && styles.segmentBtnActive,
                    ]}
                    onPress={() => setTcsApplicable('No')}
                    disabled={isSaving}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        tcsApplicable === 'No' && styles.segmentBtnTextActive,
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* CARD C: PORTAL LOGINS */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>Portal logins</Text>

              {/* GST Username & Password */}
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <FormInput
                    label="GST username"
                    placeholder="Username"
                    value={gstUsername}
                    onChangeText={setGstUsername}
                    disabled={isSaving}
                  />
                </View>
                <View style={styles.gridCol}>
                  <FormInput
                    label="GST password"
                    placeholder="Password"
                    value={gstPassword}
                    onChangeText={setGstPassword}
                    isPassword
                    disabled={isSaving}
                  />
                </View>
              </View>

              {/* ITR Username & Password */}
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <FormInput
                    label="ITR username"
                    placeholder="Username"
                    value={itrUsername}
                    onChangeText={setItrUsername}
                    disabled={isSaving}
                  />
                </View>
                <View style={styles.gridCol}>
                  <FormInput
                    label="ITR password"
                    placeholder="Password"
                    value={itrPassword}
                    onChangeText={setItrPassword}
                    isPassword
                    disabled={isSaving}
                  />
                </View>
              </View>
            </View>

            {/* CARD D: UPLOADS */}
            <View style={styles.formCard}>
              <Text style={styles.cardHeaderTitle}>Uploads</Text>

              <View style={styles.uploadGridRow}>
                <ImageUploadTile
                  label="Bank QR code"
                  dimensions="150 × 150 px"
                  iconName="grid"
                  imageUri={bankQrUri}
                  onImageSelected={setBankQrUri}
                  disabled={isSaving}
                />

                <ImageUploadTile
                  label="Company logo"
                  dimensions="150 × 150 px"
                  iconName="camera"
                  imageUri={companyLogoUri}
                  onImageSelected={setCompanyLogoUri}
                  disabled={isSaving}
                />
              </View>
            </View>
          </>
        )}

        {/* TAB 2: SUBSCRIPTION */}
        {activeTab === 'subscription' && (
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Subscription Details</Text>
            <View style={styles.subStatusCard}>
              <Ionicons name="shield-checkmark" size={24} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={styles.subPlanTitle}>BTHAWK Enterprise Annual</Text>
                <Text style={styles.subPlanExpiry}>
                  Renewal Date:{' '}
                  <Text style={styles.boldText}>
                    {initialProfile.renew_date || 'Active Plan (31 Dec 2026)'}
                  </Text>
                </Text>
              </View>
              <View style={styles.subActiveBadge}>
                <Text style={styles.subActiveText}>Active</Text>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionSubTitle}>Plan Features</Text>
              <Text style={styles.featureItem}>• Unlimited Invoices & Credit Notes</Text>
              <Text style={styles.featureItem}>• Real-time DSR & Field Executive Tracking</Text>
              <Text style={styles.featureItem}>• Direct GST Portal e-Way Integration</Text>
              <Text style={styles.featureItem}>• Automated Ledger Reconciliation</Text>
            </View>
          </View>
        )}

        {/* TAB 3: ACCOUNT INFO */}
        {activeTab === 'account' && (
          <View style={styles.formCard}>
            <Text style={styles.cardHeaderTitle}>Bank & Settlement Details</Text>
            <View style={styles.accountDetailItem}>
              <Text style={styles.accountLabel}>Account Name</Text>
              <Text style={styles.accountVal}>{firmName || 'Bhanu Enterprise'}</Text>
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.accountDetailItem}>
              <Text style={styles.accountLabel}>Primary UPI ID</Text>
              <Text style={styles.accountVal}>bhanu@okhdfcbank</Text>
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.accountDetailItem}>
              <Text style={styles.accountLabel}>Settlement Cycle</Text>
              <Text style={styles.accountVal}>T+0 Instant IMPS</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FLOATING BOTTOM SAVE BAR */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            isSaveDisabled && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaveDisabled}
          activeOpacity={0.85}
          accessibilityLabel="Save profile changes"
          accessibilityRole="button"
        >
          {isSaving ? (
            <View style={styles.savingRow}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Saving changes...</Text>
            </View>
          ) : (
            <View style={styles.saveRow}>
              <Feather name="save" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save changes</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordSheet
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={() => {
          setShowChangePassword(false);
          setToastConfig({
            visible: true,
            message: 'Password changed successfully',
            type: 'success',
          });
        }}
      />
    </View>
  );
};

export const ProfileScreen: React.FC<{ onGoBack: () => void }> = ({ onGoBack }) => {
  const { data: profile } = useProfileQuery();
  const currentProfile = profile || FALLBACK_PROFILE;

  return (
    <ProfileFormInner
      key={currentProfile.distributor_id ? String(currentProfile.distributor_id) : 'profile-form'}
      initialProfile={currentProfile}
      onGoBack={onGoBack}
    />
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  backCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  topBarTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 20,
    color: Colors.text,
    marginLeft: 14,
  },
  topBarRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  unsavedBadge: {
    backgroundColor: Colors.unsavedTagBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  unsavedText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
    color: Colors.unsavedTagText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.card.radius,
    padding: Shapes.card.padding,
    alignItems: 'center',
    marginBottom: 16,
    ...Shadows.card,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.text,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  locationText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoBoxesContainer: {
    width: '100%',
    gap: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  infoIconChip: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEEDFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBoxValue: {
    flex: 1,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 13,
    color: Colors.text,
  },
  infoBoxLabel: {
    flex: 1,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoBoxVersion: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 13,
    color: Colors.text,
  },

  // Menu Links Card
  menuCard: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.card.radius,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
    ...Shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: 12,
  },
  menuIconChip: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEEDFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuRowText: {
    flex: 1,
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.divider,
  },

  // Section Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabPillText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },

  // Form Cards
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.card.radius,
    padding: Shapes.card.padding,
    marginBottom: 16,
    ...Shadows.card,
  },
  cardHeaderTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCol: {
    flex: 1,
  },

  // TCS Segment
  tcsContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  tcsLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  segmentWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentBtn: {
    flex: 1,
    minHeight: Shapes.buttons.minHeight,
    borderRadius: 14,
    backgroundColor: '#F5F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
  },
  segmentBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.text,
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },

  // Upload Grid
  uploadGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },

  // Subscription & Account styles
  subStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  subPlanTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.text,
  },
  subPlanExpiry: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  boldText: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text,
  },
  subActiveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subActiveText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
    color: '#15803D',
  },
  sectionSubTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  featureItem: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    lineHeight: 22,
    color: Colors.textBody,
  },
  accountDetailItem: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  accountVal: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.text,
  },

  // Floating Save Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(245, 244, 255, 0.95)',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.tabBorder,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    minHeight: Shapes.buttons.minHeight,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  saveButtonDisabled: {
    backgroundColor: '#8E89DF',
    opacity: 0.65,
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
