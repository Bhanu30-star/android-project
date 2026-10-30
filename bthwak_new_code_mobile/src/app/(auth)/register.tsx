import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import {
  getRegisterUniqueKeyApi,
  sendRegisterOtpApi,
  verifyRegisterOtpApi,
  fetchGstDetailsApi,
  fetchPincodeDetailsApi,
  fetchStateListApi,
  submitRegistrationApi,
  StateItem,
} from '@/api/register';
import { parseApiError } from '@/api/client';
import { BthawkLogo } from '@/components/BthawkLogo';

const SERVICES = [
  { id: 'Service+Service', name: 'Service' },
  { id: 'Telecom+Service', name: 'Telecom' },
  { id: 'Electronics+Serial No', name: 'Electronics' },
  { id: 'FMCG Goods+FMCG', name: 'FMCG' },
  { id: 'Ecommerce+Ecommerce', name: 'Ecommerce' },
  { id: 'Pharma+Batch No', name: 'Pharma' },
  { id: 'Agro+Batch No', name: 'Agro' },
];

const GROUP1 = ['Service+Service', 'Telecom+Service', 'Electronics+Serial No', 'FMCG Goods+FMCG'];
const GROUP2 = ['Ecommerce+Ecommerce'];
const GROUP3 = ['Pharma+Batch No', 'Agro+Batch No'];

export default function RegisterScreen() {
  const router = useRouter();
  const { loginWithToken } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [registerUniqueId, setRegisterUniqueId] = useState('');

  // Step 1: Verification
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Step 2: Business Details
  const [businessType, setBusinessType] = useState<'with-gst' | 'without-gst'>('with-gst');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [brandName, setBrandName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [isFetchingGst, setIsFetchingGst] = useState(false);

  // Step 3: Address Information
  const [ownerName, setOwnerName] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [isFetchingPin, setIsFetchingPin] = useState(false);
  const [statesList, setStatesList] = useState<StateItem[]>([]);
  const [showStateModal, setShowStateModal] = useState(false);

  // Step 4: Services
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'Service+Service',
    'Telecom+Service',
    'Electronics+Serial No',
    'FMCG Goods+FMCG',
  ]);

  // Step 5: Review & Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert/Toast banners
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const otpInputRefs = useRef<Array<any>>([]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch unique registration ID & states list on mount
  useEffect(() => {
    getRegisterUniqueKeyApi().then((uid) => setRegisterUniqueId(uid));
    fetchStateListApi('India')
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setStatesList(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatStateToBackendFormat = (rawState: string, list: StateItem[]) => {
    if (!rawState) return '';
    if (rawState.includes('&%#')) return rawState;
    const clean = rawState.trim().toLowerCase();
    const matched = list.find(
      (s) =>
        s.state_name.toLowerCase() === clean ||
        s.state_code.toLowerCase() === clean
    );
    if (matched) {
      return `${matched.state_code}&%#${matched.state_name}`;
    }
    return rawState;
  };

  // Handler: Send OTP
  const handleSendOtp = async () => {
    if (!/^[4-9]\d{9}$/.test(mobile)) {
      showToast('Mobile number must be 10 digits starting with 4-9', 'error');
      return;
    }
    setIsSendingOtp(true);
    try {
      await sendRegisterOtpApi(mobile, 'India');
      setOtpSent(true);
      setOtpTimer(60);
      showToast('OTP Sent Successfully', 'success');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch (err) {
      showToast(parseApiError(err), 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handler: Verify OTP
  const handleVerifyOtp = async () => {
    const otpValue = otpDigits.join('');
    if (otpValue.length !== 6) {
      showToast('Please enter complete 6-digit OTP', 'error');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      await verifyRegisterOtpApi(mobile, Number(otpValue), 'India');
      setOtpVerified(true);
      showToast('Mobile verified successfully', 'success');
      setCurrentStep(2);
    } catch (err) {
      const errStr = parseApiError(err);
      if (
        errStr.toLowerCase().includes('already') ||
        errStr.toLowerCase().includes('verified')
      ) {
        setOtpVerified(true);
        showToast('Mobile verified successfully', 'success');
        setCurrentStep(2);
      } else {
        showToast(errStr, 'error');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handler: GST Auto-fetch
  const handleGstChange = async (val: string) => {
    const clean = val.toUpperCase().trim();
    setGstNumber(clean);
    if (clean.length === 15 && businessType === 'with-gst') {
      setIsFetchingGst(true);
      try {
        const res = await fetchGstDetailsApi(clean);
        const data = res?.data || res;
        if (data) {
          if (data.businessName) setBrandName(data.businessName);
          if (data.tradeName || data.businessName) setTradeName(data.tradeName || data.businessName);
          if (data.panNumber) setPanNumber(data.panNumber);
          if (data.lgnm) setOwnerName(data.lgnm);
          if (data.pncd) setPincode(data.pncd);
          if (data.loc || data.dst) setCity(data.loc || data.dst);
          if (data.dst) setDistrict(data.dst);
          if (data.state || data.stcd) {
            const raw = data.state || data.stcd;
            const matched = statesList.find(
              (s) =>
                s.state_code.toLowerCase() === (data.stcd || '').toLowerCase() ||
                s.state_name.toLowerCase() === (data.state || '').toLowerCase()
            );
            if (matched) {
              setState(`${matched.state_code}&%#${matched.state_name}`);
            } else {
              setState(raw);
            }
          }
          const fullAddr = [data.flno, data.bno, data.st, data.loc].filter(Boolean).join(', ');
          if (fullAddr) setAddress(fullAddr);
          showToast('GST details verified & autofilled!', 'success');
        }
      } catch (err) {
        showToast(parseApiError(err), 'error');
      } finally {
        setIsFetchingGst(false);
      }
    }
  };

  // Handler: Pincode Auto-fetch
  const handlePincodeChange = async (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) {
      setIsFetchingPin(true);
      try {
        const res = await fetchPincodeDetailsApi(clean);
        const data = res?.data || res;
        if (data && data.city) {
          setCity(data.city);
          if (data.district) setDistrict(data.district);
          if (data.state) {
            const matched = statesList.find(
              (s) => s.state_name.toLowerCase() === data.state.toLowerCase()
            );
            if (matched) {
              setState(`${matched.state_code}&%#${matched.state_name}`);
            } else {
              setState(data.state);
            }
          }
        }
      } catch (err) {
        showToast(parseApiError(err), 'error');
      } finally {
        setIsFetchingPin(false);
      }
    }
  };

  // Service toggle & compatibility
  const handleToggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter((s) => s !== id));
    } else {
      if (id === 'Ecommerce+Ecommerce') {
        setSelectedServices([id]);
      } else if (GROUP1.includes(id)) {
        setSelectedServices([...selectedServices.filter((s) => !GROUP2.includes(s) && !GROUP3.includes(s)), id]);
      } else {
        setSelectedServices([...selectedServices.filter((s) => !GROUP1.includes(s) && !GROUP2.includes(s)), id]);
      }
    }
  };

  const isServiceDisabled = (id: string) => {
    if (selectedServices.length === 0) return false;
    if (GROUP1.includes(id)) {
      return selectedServices.some((s) => GROUP2.includes(s) || GROUP3.includes(s));
    }
    if (GROUP2.includes(id)) {
      return selectedServices.some((s) => GROUP1.includes(s) || GROUP3.includes(s));
    }
    if (GROUP3.includes(id)) {
      return selectedServices.some((s) => GROUP1.includes(s) || GROUP2.includes(s));
    }
    return false;
  };

  // Step 2 Validation & Next
  const handleStep2Next = () => {
    const cleanPan = (panNumber || '').trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      showToast('Enter valid 10-character PAN (e.g. ABCDE1234F)', 'error');
      return;
    }
    if (businessType === 'with-gst') {
      const cleanGst = (gstNumber || '').trim().toUpperCase();
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(cleanGst)) {
        showToast('Enter valid 15-digit GSTIN (e.g. 07AAAAA0000A1Z5)', 'error');
        return;
      }
    }
    if (!brandName.trim()) {
      showToast('Brand name is required', 'error');
      return;
    }
    if (tradeName.trim().length < 3) {
      showToast('Business/Trade name must be at least 3 characters', 'error');
      return;
    }
    setCurrentStep(3);
  };

  // Step 3 Validation & Next
  const handleStep3Next = () => {
    if (!ownerName.trim()) {
      showToast('Owner Legal Name is required', 'error');
      return;
    }
    if (!pincode || pincode.length !== 6) {
      showToast('Enter valid 6-digit pincode', 'error');
      return;
    }
    if (!city.trim() || !state.trim()) {
      showToast('City and State are required', 'error');
      return;
    }
    const formatted = formatStateToBackendFormat(state, statesList);
    if (formatted) {
      setState(formatted);
    }
    if (!address.trim()) {
      showToast('Complete address is required', 'error');
      return;
    }
    setCurrentStep(4);
  };

  // Final Registration Submission
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      let uid = registerUniqueId;
      if (!uid) {
        uid = await getRegisterUniqueKeyApi();
        if (uid) setRegisterUniqueId(uid);
      }

      let finalState = state;
      if (!finalState.includes('&%#') && statesList.length > 0) {
        finalState = formatStateToBackendFormat(finalState, statesList);
      }

      const payload = {
        step1: {
          country: 'India',
          mobile: mobile.trim(),
          email: email.trim(),
          regis_uniqueid: uid || '',
          dob: '0000-00-00',
        },
        step2: {
          businessType,
          gstNumber: businessType === 'with-gst' ? (gstNumber || '').trim().toUpperCase() : '',
          panNumber: (panNumber || '').trim().toUpperCase(),
          aadhaarNumber: (aadhaarNumber || '').trim(),
          brandName: (brandName || '').trim(),
          tradeName: (tradeName || '').trim(),
        },
        step3: {
          ownerName: (ownerName || '').trim(),
          pincode: (pincode || '').trim(),
          city: (city || '').trim(),
          state: finalState,
          district: (district || '').trim(),
          address: (address || '').trim(),
        },
        step4: {
          selectedServices,
        },
        source: 'app',
      };

      const response = await submitRegistrationApi(payload);
      setShowConfirmModal(false);

      const authToken =
        response?.data?.auth_token ??
        (response?.data as any)?.token ??
        (response as any)?.auth_token ??
        (response as any)?.token;

      if (authToken && typeof authToken === 'string') {
        showToast('Registration successful! Logging you in...', 'success');
        await loginWithToken(authToken);
        router.replace('/dashboard');
      } else {
        showToast('Registration successful! Please sign in with your credentials.', 'success');
        router.replace('/(auth)/login');
      }
    } catch (err) {
      showToast(parseApiError(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* TOP HEADER WITH BACK BUTTON & LOGO */}
          <View style={styles.topNav}>
            <TouchableOpacity
              onPress={() => {
                if (currentStep > 1) {
                  setCurrentStep((prev) => ((prev - 1) as any));
                } else {
                  router.back();
                }
              }}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="arrow-left" size={22} color="#F2F2FA" />
            </TouchableOpacity>

            <View style={styles.topLogoRow}>
              <BthawkLogo size={28} />
              <Text style={styles.topLogoText}>
                BTHAWK<Text style={styles.topLogoPlus}>+</Text>
              </Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* ============================================================== */}
          {/* STEP 1: MOBILE & EMAIL VERIFICATION (SCREENSHOT 1)             */}
          {/* ============================================================== */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Mobile &amp; Email Verification</Text>
              <Text style={styles.stepSubtitle}>Enter mobile number and verify OTP</Text>

              {/* Mobile Input */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={mobile}
                  onChangeText={(val) => {
                    setMobile(val.replace(/\D/g, '').slice(0, 10));
                    setOtpSent(false);
                    setOtpVerified(false);
                  }}
                  editable={!otpVerified}
                  keyboardType="number-pad"
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#5B6084"
                  style={[styles.textInput, otpVerified && { color: '#9AA0BF' }]}
                  maxLength={10}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  editable={!otpVerified}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Enter business email address"
                  placeholderTextColor="#5B6084"
                  style={[styles.textInput, otpVerified && { color: '#9AA0BF' }]}
                />
              </View>

              {otpVerified ? (
                <>
                  {/* Verified Banner */}
                  <View style={styles.verifiedSuccessBox}>
                    <View style={styles.verifiedSuccessLeft}>
                      <Ionicons name="checkmark-circle" size={22} color="#2DD4A8" />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.verifiedSuccessTitle}>Verified Contact</Text>
                        <Text style={styles.verifiedSuccessSubtitle} numberOfLines={1}>
                          +91 {mobile} • {email}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setOtpVerified(false);
                        setOtpSent(false);
                        setOtpDigits(['', '', '', '', '', '']);
                        setOtpTimer(0);
                      }}
                      style={styles.changeNumberButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.changeNumberText}>Change</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => setCurrentStep(2)}
                    style={[styles.primaryPillButton, { marginTop: 16 }]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pillButtonText}>Continue to Business Details</Text>
                    <Feather name="arrow-right" size={16} color="#F2F2FA" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </>
              ) : !otpSent ? (
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={isSendingOtp || !/^[4-9]\d{9}$/.test(mobile)}
                  style={[
                    styles.primaryPillButton,
                    (isSendingOtp || !/^[4-9]\d{9}$/.test(mobile)) && styles.disabledButton,
                    { marginTop: 12 },
                  ]}
                  activeOpacity={0.8}
                >
                  {isSendingOtp ? (
                    <ActivityIndicator color="#F2F2FA" size="small" />
                  ) : (
                    <Text style={styles.pillButtonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  {/* 6 OTP Boxes */}
                  <View style={styles.otpBoxesRow}>
                    {otpDigits.map((digit, idx) => (
                      <TextInput
                        key={idx}
                        ref={(ref) => {
                          otpInputRefs.current[idx] = ref;
                        }}
                        value={digit}
                        onChangeText={(char) => {
                          const clean = char.replace(/\D/g, '');
                          const newDigits = [...otpDigits];
                          newDigits[idx] = clean.slice(-1);
                          setOtpDigits(newDigits);
                          if (clean && idx < 5) {
                            otpInputRefs.current[idx + 1]?.focus();
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.nativeEvent.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                            otpInputRefs.current[idx - 1]?.focus();
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={1}
                        style={[
                          styles.otpBox,
                          digit ? styles.otpBoxFilled : null,
                          otpDigits.findIndex((d) => !d) === idx && styles.otpBoxActive,
                        ]}
                      />
                    ))}
                  </View>

                  {/* Resend Timer */}
                  <View style={styles.resendRow}>
                    {otpTimer > 0 ? (
                      <Text style={styles.resendTimerText}>Resend in {otpTimer}s</Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOtp}>
                        <Text style={styles.resendActiveText}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Verify OTP Button */}
                  <TouchableOpacity
                    onPress={handleVerifyOtp}
                    disabled={isVerifyingOtp || otpDigits.join('').length !== 6}
                    style={[
                      styles.primaryPillButton,
                      (isVerifyingOtp || otpDigits.join('').length !== 6) && styles.disabledButton,
                    ]}
                    activeOpacity={0.8}
                  >
                    {isVerifyingOtp ? (
                      <ActivityIndicator color="#F2F2FA" size="small" />
                    ) : (
                      <Text style={styles.pillButtonText}>Verify OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ============================================================== */}
          {/* STEP 2: BUSINESS DETAILS (SCREENSHOT 2)                        */}
          {/* ============================================================== */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Business Details</Text>

              {/* Segmented Toggle: With GST / Without GST */}
              <View style={styles.segmentRow}>
                <TouchableOpacity
                  onPress={() => setBusinessType('with-gst')}
                  style={[
                    styles.segmentButton,
                    businessType === 'with-gst' ? styles.segmentButtonActive : styles.segmentButtonInactive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      businessType === 'with-gst' ? styles.segmentTextActive : styles.segmentTextInactive,
                    ]}
                  >
                    With GST
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setBusinessType('without-gst')}
                  style={[
                    styles.segmentButton,
                    businessType === 'without-gst' ? styles.segmentButtonActive : styles.segmentButtonInactive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      businessType === 'without-gst' ? styles.segmentTextActive : styles.segmentTextInactive,
                    ]}
                  >
                    Without GST
                  </Text>
                </TouchableOpacity>
              </View>

              {/* PAN Number */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={panNumber}
                  onChangeText={(val) => setPanNumber(val.toUpperCase().slice(0, 10))}
                  placeholder="PAN Number*"
                  placeholderTextColor="#5B6084"
                  autoCapitalize="characters"
                  maxLength={10}
                  style={styles.textInput}
                />
              </View>

              {/* GST Number (If with GST) */}
              {businessType === 'with-gst' && (
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={gstNumber}
                    onChangeText={handleGstChange}
                    placeholder="Gst Number*"
                    placeholderTextColor="#5B6084"
                    autoCapitalize="characters"
                    maxLength={15}
                    style={styles.textInput}
                  />
                  {isFetchingGst && (
                    <ActivityIndicator size="small" color="#6C7CFF" style={styles.inputLoader} />
                  )}
                </View>
              )}

              {/* Aadhaar Number */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={aadhaarNumber}
                  onChangeText={(val) => setAadhaarNumber(val.replace(/\D/g, '').slice(0, 12))}
                  placeholder="Aadhaar Number"
                  placeholderTextColor="#5B6084"
                  keyboardType="number-pad"
                  maxLength={12}
                  style={styles.textInput}
                />
              </View>

              {/* Brand Name */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={brandName}
                  onChangeText={setBrandName}
                  placeholder="Brand Name*"
                  placeholderTextColor="#5B6084"
                  style={styles.textInput}
                />
              </View>

              {/* Business/Trade Name */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={tradeName}
                  onChangeText={setTradeName}
                  placeholder="Business/Trade Name*"
                  placeholderTextColor="#5B6084"
                  style={styles.textInput}
                />
              </View>

              {/* Business Email */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={businessEmail}
                  onChangeText={setBusinessEmail}
                  placeholder="Business Email (Optional)"
                  placeholderTextColor="#5B6084"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>

              {/* Bottom Buttons */}
              <View style={styles.bottomButtonsRow}>
                <TouchableOpacity
                  onPress={() => setCurrentStep(1)}
                  style={styles.outlinePillButton}
                  activeOpacity={0.8}
                >
                  <Feather name="arrow-left" size={16} color="#F2F2FA" />
                  <Text style={styles.outlinePillText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStep2Next}
                  style={styles.nextPillButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextPillText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* STEP 3: ADDRESS INFORMATION (SCREENSHOT 3)                     */}
          {/* ============================================================== */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Address Information</Text>

              {/* Owner Legal Name */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="Owner Legal Name *"
                  placeholderTextColor="#5B6084"
                  style={styles.textInput}
                />
              </View>

              {/* Pincode */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={pincode}
                  onChangeText={handlePincodeChange}
                  placeholder="Pincode *"
                  placeholderTextColor="#5B6084"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.textInput}
                />
                {isFetchingPin && (
                  <ActivityIndicator size="small" color="#6C7CFF" style={styles.inputLoader} />
                )}
              </View>

              {/* City and State */}
              <View style={styles.cityStateRow}>
                <View style={[styles.inputWrapper, { flex: 1, marginRight: 8 }]}>
                  <TextInput
                    value={city}
                    onChangeText={setCity}
                    placeholder="City *"
                    placeholderTextColor="#5B6084"
                    style={styles.textInput}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => setShowStateModal(true)}
                  style={[styles.inputWrapper, styles.statePickerButton, { flex: 1 }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statePickerText, !state && { color: '#5B6084' }]} numberOfLines={1}>
                    {state ? state.split('&%#')[1] || state : 'State *'}
                  </Text>
                  <Feather name="chevron-down" size={18} color="#9AA0BF" />
                </TouchableOpacity>
              </View>

              {/* District */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="District *"
                  placeholderTextColor="#5B6084"
                  style={styles.textInput}
                />
              </View>

              {/* Complete Address */}
              <View style={styles.inputWrapper}>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Complete Address *"
                  placeholderTextColor="#5B6084"
                  multiline
                  style={[styles.textInput, styles.multilineInput]}
                />
              </View>

              {/* Bottom Buttons */}
              <View style={styles.bottomButtonsRow}>
                <TouchableOpacity
                  onPress={() => setCurrentStep(2)}
                  style={styles.outlinePillButton}
                  activeOpacity={0.8}
                >
                  <Feather name="arrow-left" size={16} color="#F2F2FA" />
                  <Text style={styles.outlinePillText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStep3Next}
                  style={styles.nextPillButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextPillText}>Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ============================================================== */}
          {/* STEP 4: SELECT SERVICES (SCREENSHOT 4)                         */}
          {/* ============================================================== */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Select Services</Text>

              <View style={styles.servicesGrid}>
                {SERVICES.map((serv) => {
                  const isChecked = selectedServices.includes(serv.id);
                  const disabled = isServiceDisabled(serv.id);

                  return (
                    <TouchableOpacity
                      key={serv.id}
                      onPress={() => !disabled && handleToggleService(serv.id)}
                      disabled={disabled}
                      style={[
                        styles.serviceCard,
                        isChecked && styles.serviceCardChecked,
                        disabled && styles.serviceCardDisabled,
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.serviceHeaderRow}>
                        <Text
                          style={[
                            styles.serviceName,
                            isChecked && styles.serviceNameChecked,
                            disabled && styles.serviceNameDisabled,
                          ]}
                        >
                          {serv.name}
                        </Text>
                        {isChecked && (
                          <View style={styles.checkCircle}>
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      {disabled && (
                        <Text style={styles.serviceDisabledReason}>
                          Not compatible with selected services
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Bottom Buttons */}
              <View style={styles.bottomButtonsRow}>
                <TouchableOpacity
                  onPress={() => setCurrentStep(3)}
                  style={styles.outlinePillButton}
                  activeOpacity={0.8}
                >
                  <Feather name="arrow-left" size={16} color="#F2F2FA" />
                  <Text style={styles.outlinePillText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    if (selectedServices.length === 0) {
                      showToast('Please select at least one service', 'error');
                      return;
                    }
                    setShowConfirmModal(true);
                  }}
                  style={styles.nextPillButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextPillText}>Complete Signup</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Toast / Alert Feedback Display */}
          {toastMessage && (
            <View
              style={[
                styles.toastContainer,
                toastMessage.type === 'error' ? styles.toastError : styles.toastSuccess,
              ]}
            >
              <Ionicons
                name={toastMessage.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                size={18}
                color={toastMessage.type === 'error' ? '#FF5C6C' : '#2DD4A8'}
              />
              <Text style={styles.toastText}>{toastMessage.text}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ============================================================== */}
      {/* STEP 5: CONFIRM YOUR DETAILS MODAL (SCREENSHOT 5)             */}
      {/* ============================================================== */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBadge}>
                <Ionicons name="checkmark-circle" size={32} color="#6C7CFF" />
              </View>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={20} color="#9AA0BF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Confirm Your Details</Text>
            <Text style={styles.modalSubtitle}>Review before submitting</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 420 }}
              contentContainerStyle={{ paddingBottom: 6 }}
            >
              {/* Basic Info Box */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="user" size={15} color="#6C7CFF" />
                  <Text style={styles.sectionHeading}>Basic Info</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Country</Text>
                  <Text style={styles.detailValue}>India</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mobile</Text>
                  <Text style={styles.detailValue}>{mobile}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>
                    {email || '-'}
                  </Text>
                </View>
              </View>

              {/* Business Details Box */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="briefcase" size={15} color="#6C7CFF" />
                  <Text style={styles.sectionHeading}>Business Details</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Business Type</Text>
                  <Text style={styles.detailValue}>
                    {businessType === 'with-gst' ? 'WITH_GST' : 'WITHOUT_GST'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>GST No</Text>
                  <Text style={styles.detailValue}>
                    {businessType === 'with-gst' ? (gstNumber || '-') : '-'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>PAN No</Text>
                  <Text style={styles.detailValue}>{panNumber || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Aadhaar No</Text>
                  <Text style={styles.detailValue}>{aadhaarNumber || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Brand Name</Text>
                  <Text style={styles.detailValue}>{brandName || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trade Name</Text>
                  <Text style={styles.detailValue}>{tradeName || '-'}</Text>
                </View>
              </View>

              {/* Owner & Address Box */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="map-pin" size={15} color="#6C7CFF" />
                  <Text style={styles.sectionHeading}>Owner &amp; Address</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Owner Name</Text>
                  <Text style={styles.detailValue}>{ownerName || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pincode</Text>
                  <Text style={styles.detailValue}>{pincode || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City</Text>
                  <Text style={styles.detailValue}>{city || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>State</Text>
                  <Text style={styles.detailValue}>
                    {state ? (state.includes('&%#') ? state.split('&%#')[1] : state) : '-'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>District</Text>
                  <Text style={styles.detailValue}>{district || '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {address || '-'}
                  </Text>
                </View>
              </View>

              {/* Services Box */}
              <View style={styles.detailSection}>
                <View style={styles.sectionHeaderRow}>
                  <Feather name="layers" size={15} color="#6C7CFF" />
                  <Text style={styles.sectionHeading}>Services</Text>
                </View>
                <View style={styles.servicesPillWrap}>
                  {selectedServices.length > 0 ? (
                    selectedServices.map((id) => (
                      <View key={id} style={styles.serviceConfirmedPill}>
                        <Text style={styles.serviceConfirmedText}>
                          {id.split('+')[0]}
                        </Text>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#2DD4A8"
                          style={{ marginLeft: 4 }}
                        />
                      </View>
                    ))
                  ) : (
                    <Text style={{ fontSize: 13, color: '#9AA0BF' }}>No services selected</Text>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Modal Actions */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                style={styles.modalEditButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalEditText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFinalSubmit}
                disabled={isSubmitting}
                style={styles.modalSubmitButton}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#F2F2FA" size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Confirm &amp; Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* State Selection Dropdown Modal */}
      <Modal visible={showStateModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '75%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <Feather name="x" size={20} color="#9AA0BF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 12 }}>
              {statesList.map((st) => (
                <TouchableOpacity
                  key={st.state_code}
                  onPress={() => {
                    setState(`${st.state_code}&%#${st.state_name}`);
                    setShowStateModal(false);
                  }}
                  style={styles.stateItemRow}
                >
                  <Text style={styles.stateItemText}>{st.state_name}</Text>
                  {state.includes(st.state_name) && (
                    <Ionicons name="checkmark" size={18} color="#6C7CFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#100F1D',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  topNav: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topLogoText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F2F2FA',
    letterSpacing: 0.5,
  },
  topLogoPlus: {
    color: '#E8552D',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  stepContainer: {
    marginTop: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F2F2FA',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#9AA0BF',
    marginBottom: 24,
  },
  inputWrapper: {
    backgroundColor: '#17162A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2D4A',
    marginBottom: 16,
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    color: '#F2F2FA',
    fontWeight: '500',
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  inputLoader: {
    position: 'absolute',
    right: 16,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#17162A',
    borderWidth: 1,
    borderColor: '#2A2D4A',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#F2F2FA',
  },
  otpBoxFilled: {
    backgroundColor: '#F2F2FA',
    color: '#100F1D',
  },
  otpBoxActive: {
    borderColor: '#6C7CFF',
    shadowColor: '#6C7CFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  resendRow: {
    marginBottom: 18,
  },
  resendTimerText: {
    fontSize: 13,
    color: '#9AA0BF',
  },
  resendActiveText: {
    fontSize: 13,
    color: '#6C7CFF',
    fontWeight: '700',
  },
  primaryPillButton: {
    height: 50,
    borderRadius: 9999,
    backgroundColor: '#2A3D6E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#1E2540',
    opacity: 0.6,
  },
  pillButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F2F2FA',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  segmentButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#2A3D6E',
    borderWidth: 1.5,
    borderColor: '#6C7CFF',
  },
  segmentButtonInactive: {
    backgroundColor: '#17162A',
    borderWidth: 1,
    borderColor: '#2A2D4A',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#F2F2FA',
  },
  segmentTextInactive: {
    color: '#9AA0BF',
  },
  cityStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statePickerText: {
    fontSize: 15,
    color: '#F2F2FA',
    flex: 1,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 20,
    paddingTop: 8,
  },
  outlinePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    height: 50,
    borderRadius: 9999,
    backgroundColor: '#17162A',
    borderWidth: 1,
    borderColor: '#2A2D4A',
  },
  outlinePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F2F2FA',
  },
  nextPillButton: {
    flex: 1,
    height: 50,
    borderRadius: 9999,
    backgroundColor: '#2A3D6E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F2F2FA',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  serviceCard: {
    width: '48%',
    minHeight: 64,
    backgroundColor: '#17162A',
    borderWidth: 1,
    borderColor: '#2A2D4A',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'center',
  },
  serviceCardChecked: {
    backgroundColor: '#1E1D36',
    borderColor: '#6C7CFF',
  },
  serviceCardDisabled: {
    opacity: 0.45,
    borderColor: '#2A2D4A',
  },
  serviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9AA0BF',
  },
  serviceNameChecked: {
    color: '#F2F2FA',
    fontWeight: '700',
  },
  serviceNameDisabled: {
    color: '#5B6084',
  },
  serviceDisabledReason: {
    fontSize: 10,
    color: '#5B6084',
    marginTop: 4,
    lineHeight: 14,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6C7CFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toastSuccess: {
    backgroundColor: '#162828',
    borderWidth: 1,
    borderColor: '#1B4D3E',
  },
  toastError: {
    backgroundColor: '#26131D',
    borderWidth: 1,
    borderColor: '#5C1D24',
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F2F2FA',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E1D36',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2D4A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2D4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F2F2FA',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#9AA0BF',
    marginBottom: 16,
  },
  detailSection: {
    backgroundColor: '#17162A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2D4A',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D4A',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F2F2FA',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#9AA0BF',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F2F2FA',
    maxWidth: '60%',
    textAlign: 'right',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalEditButton: {
    paddingHorizontal: 24,
    height: 46,
    borderRadius: 9999,
    backgroundColor: '#17162A',
    borderWidth: 1,
    borderColor: '#2A2D4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEditText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F2F2FA',
  },
  modalSubmitButton: {
    flex: 1,
    height: 46,
    borderRadius: 9999,
    backgroundColor: '#7A8CFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#100F1D',
  },
  stateItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D4A',
  },
  stateItemText: {
    fontSize: 15,
    color: '#F2F2FA',
  },
  verifiedSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(45, 212, 168, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 168, 0.3)',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },
  verifiedSuccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  verifiedSuccessTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2DD4A8',
  },
  verifiedSuccessSubtitle: {
    fontSize: 12,
    color: '#9AA0BF',
    marginTop: 2,
  },
  changeNumberButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#1E2038',
    borderWidth: 1,
    borderColor: '#2A2D4A',
  },
  changeNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C7CFF',
  },
  servicesPillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  serviceConfirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 124, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(108, 124, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  serviceConfirmedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F2F2FA',
  },
});
