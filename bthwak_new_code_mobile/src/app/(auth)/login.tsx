import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AuthTabs, AuthTabType } from '@/components/AuthTabs';
import { AppInput } from '@/components/AppInput';
import { PasswordInput } from '@/components/PasswordInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { OtpInput } from '@/components/OtpInput';
import { QrInstructionCard } from '@/components/QrInstructionCard';
import { BthawkLogo } from '@/components/BthawkLogo';
import { AuthBackgroundDecorations } from '@/components/AuthBackgroundDecorations';

import {
  loginSchema,
  LoginFormData,
  otpRequestSchema,
  OtpRequestFormData,
  forgotPasswordSchema,
  ForgotPasswordFormData,
} from '@/utils/validation';
import { loginApi, sendOtpForLoginApi, forgotPasswordApi } from '@/api/auth';
import { parseApiError } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { loginWithToken, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTabType>('password');
  const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Password Login State
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // OTP Login State
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [targetContact, setTargetContact] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isOtpRequestSubmitting, setIsOtpRequestSubmitting] = useState(false);
  const [isOtpVerifySubmitting, setIsOtpVerifySubmitting] = useState(false);

  // Forgot Password State
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // Global inline feedback banners
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [apiSuccessMessage, setApiSuccessMessage] = useState('');

  // Refs for moving focus
  const passwordInputRef = useRef<any>(null);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  // OTP Timer countdown
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Forms
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isValid: isPasswordValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const {
    control: otpControl,
    handleSubmit: handleOtpRequestSubmit,
    getValues: getOtpValues,
    setValue: setOtpValueField,
    formState: { errors: otpErrors, isValid: isOtpValid },
  } = useForm<OtpRequestFormData>({
    resolver: zodResolver(otpRequestSchema),
    mode: 'onChange',
    defaultValues: { contact: '' },
  });

  const {
    control: forgotControl,
    handleSubmit: handleForgotSubmit,
    reset: resetForgotForm,
    formState: { errors: forgotErrors, isValid: isForgotValid },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    defaultValues: { user: '' },
  });

  // Handler: Password Login
  const onPasswordLogin = async (data: LoginFormData) => {
    setApiErrorMessage('');
    setApiSuccessMessage('');

    setIsPasswordSubmitting(true);
    try {
      const response = await loginApi({
        emailOrMobile: data.email.trim(),
        password: data.password.trim(),
        loginType: 'with-pass',
        trustDevice: rememberMe,
        recaptchaKey: 'app_mobile_client',
      });

      const authToken =
        response?.data?.auth_token ??
        (response?.data as any)?.token ??
        (response as any)?.auth_token ??
        (response as any)?.token;

      if (authToken && typeof authToken === 'string') {
        await loginWithToken(authToken);
        router.replace('/dashboard');
      } else {
        setApiErrorMessage(response?.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      const parsedError = parseApiError(error);
      setApiErrorMessage(parsedError);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // Handler: Request OTP
  const onRequestOtp = async (data: OtpRequestFormData) => {
    setApiErrorMessage('');
    setApiSuccessMessage('');

    const trimmed = data.contact.trim();
    if (!trimmed) {
      setApiErrorMessage('Please enter a valid email or mobile number.');
      return;
    }

    setIsOtpRequestSubmitting(true);
    try {
      const response = await sendOtpForLoginApi(trimmed, 'app_mobile_client');
      setTargetContact(trimmed);
      setOtpSent(true);
      setOtpTimer(30);
      setOtpValue('');
      setApiSuccessMessage(response?.message || 'OTP sent successfully! Please check your mobile or email.');
    } catch (error) {
      const parsed = parseApiError(error);
      setApiErrorMessage(parsed);
    } finally {
      setIsOtpRequestSubmitting(false);
    }
  };

  // Handler: Verify OTP & Login
  const onVerifyOtp = useCallback(
    async (codeToVerify?: string) => {
      if (isOtpVerifySubmitting) return;

      const code = (codeToVerify || otpValue).trim();
      setApiErrorMessage('');
      setApiSuccessMessage('');

      if (code.length !== 6) {
        setApiErrorMessage('Please enter the complete 6-digit OTP');
        return;
      }

      const activeContact = (targetContact || getOtpValues('contact') || '').trim();
      if (!activeContact) {
        setApiErrorMessage('Contact information is missing. Please go back and re-enter your contact.');
        return;
      }

      setIsOtpVerifySubmitting(true);
      try {
        const response = await loginApi({
          emailOrMobile: activeContact,
          otp: code,
          loginType: 'with-otp',
          trustDevice: rememberMe,
          recaptchaKey: 'app_mobile_client',
        });

        const authToken =
          response?.data?.auth_token ??
          (response?.data as any)?.token ??
          (response as any)?.auth_token ??
          (response as any)?.token;

        if (authToken && typeof authToken === 'string') {
          await loginWithToken(authToken);
          router.replace('/dashboard');
        } else {
          setApiErrorMessage(response?.message || 'Invalid OTP. Please check and try again.');
        }
      } catch (error) {
        const parsed = parseApiError(error);
        setApiErrorMessage(parsed);
      } finally {
        setIsOtpVerifySubmitting(false);
      }
    },
    [isOtpVerifySubmitting, otpValue, targetContact, getOtpValues, loginWithToken, router, rememberMe]
  );

  // Handler: Resend OTP
  const onResendOtp = async () => {
    const contact = (targetContact || getOtpValues('contact') || '').trim();
    if (!contact) return;
    setApiErrorMessage('');
    setApiSuccessMessage('');
    setIsOtpRequestSubmitting(true);
    try {
      const response = await sendOtpForLoginApi(contact, 'app_mobile_client');
      setOtpTimer(30);
      setOtpValue('');
      setApiSuccessMessage(response?.message || 'OTP resent successfully!');
    } catch (error) {
      setApiErrorMessage(parseApiError(error));
    } finally {
      setIsOtpRequestSubmitting(false);
    }
  };

  // Handler: Forgot Password
  const onForgotPassword = async (data: ForgotPasswordFormData) => {
    setApiErrorMessage('');
    setApiSuccessMessage('');
    setIsForgotSubmitting(true);
    try {
      const response = await forgotPasswordApi(data.user);
      setApiSuccessMessage(
        response?.message ||
          'If an account exists, a password reset link has been sent to your registered address.'
      );
      resetForgotForm();
    } catch (error) {
      setApiErrorMessage(parseApiError(error));
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const handleOpenRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <View style={styles.container}>
      {/* BACKGROUND GRAPHICS: WAVES, SKYLINE, GROWTH CHART */}
      <AuthBackgroundDecorations />

      <SafeAreaView style={styles.safeArea}>
        {/* TOP STATUS BAR ROW: LANGUAGE DROPDOWN PILL */}
        <View style={styles.topHeaderBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.languagePill}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Select Language, currently ${selectedLanguage}`}
          >
            <Ionicons name="globe-outline" size={16} color="#0E204E" style={{ marginRight: 6 }} />
            <Text style={styles.languageText}>{selectedLanguage}</Text>
            <Feather name="chevron-down" size={15} color="#0E204E" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* BRAND HERO LOGO & TITLE SECTION */}
            <View style={styles.heroSection}>
              <View style={styles.logoWrapper}>
                <BthawkLogo size={82} />
              </View>

              <Text style={styles.heroTitle}>
                Welcome <Text style={styles.heroTitleHighlight}>Back!</Text>
              </Text>

              <Text style={styles.heroSubtitle}>
                Sign in to continue your business journey
              </Text>

              {/* Decorative two-tone gradient wave under subtitle */}
              <View style={styles.titleDividerAccent}>
                <LinearGradient
                  colors={['#FF7A00', '#0047AB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.accentLine}
                />
              </View>
            </View>

            {/* FORGOT PASSWORD VIEW OR MAIN AUTH */}
            {isForgotPasswordView ? (
              <View style={styles.formContainer}>
                <View style={styles.forgotHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setIsForgotPasswordView(false);
                      setApiErrorMessage('');
                      setApiSuccessMessage('');
                    }}
                    style={styles.backRow}
                    activeOpacity={0.7}
                  >
                    <Feather name="arrow-left" size={18} color="#0047AB" />
                    <Text style={styles.backText}>Back to Login</Text>
                  </TouchableOpacity>
                  <Text style={styles.forgotTitle}>Reset Password</Text>
                  <Text style={styles.forgotSubtitle}>
                    Enter your registered email or 10-digit mobile number to receive a secure password reset link.
                  </Text>
                </View>

                {/* API BANNERS */}
                {!!apiErrorMessage && (
                  <View style={styles.errorBanner} accessibilityRole="alert">
                    <Feather name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.bannerTextError}>{apiErrorMessage}</Text>
                  </View>
                )}
                {!!apiSuccessMessage && (
                  <View style={styles.successBanner} accessibilityRole="alert">
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                    <Text style={styles.bannerTextSuccess}>{apiSuccessMessage}</Text>
                  </View>
                )}

                <Controller
                  control={forgotControl}
                  name="user"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AppInput
                      iconName="mail"
                      placeholder="Registered Email or Mobile"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        void handleForgotSubmit(onForgotPassword)();
                      }}
                      error={forgotErrors.user?.message}
                    />
                  )}
                />

                <PrimaryButton
                  title="Send Reset Link"
                  onPress={handleForgotSubmit(onForgotPassword)}
                  disabled={!isForgotValid}
                  isLoading={isForgotSubmitting}
                  style={styles.actionBtn}
                />
              </View>
            ) : (
              <View style={styles.formContainer}>
                {/* 3-SEGMENTED AUTH TABS (PASSWORD / OTP / QR) */}
                <AuthTabs
                  activeTab={activeTab}
                  onTabChange={(tab) => {
                    setActiveTab(tab);
                    setApiErrorMessage('');
                    setApiSuccessMessage('');
                  }}
                />

                {/* API ERROR BANNER */}
                {!!apiErrorMessage && (
                  <View style={styles.errorBanner} accessibilityRole="alert">
                    <Feather name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.bannerTextError}>{apiErrorMessage}</Text>
                  </View>
                )}

                {/* API SUCCESS BANNER */}
                {!!apiSuccessMessage && (
                  <View style={styles.successBanner} accessibilityRole="alert">
                    <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                    <Text style={styles.bannerTextSuccess}>{apiSuccessMessage}</Text>
                  </View>
                )}

                {/* ============================================================== */}
                {/* 1. PASSWORD TAB                                                */}
                {/* ============================================================== */}
                {activeTab === 'password' && (
                  <View style={styles.tabBody}>
                    <Controller
                      control={passwordControl}
                      name="email"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <AppInput
                          iconName="mail"
                          placeholder="Email / Mobile"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => passwordInputRef.current?.focus()}
                          error={passwordErrors.email?.message}
                        />
                      )}
                    />

                    <Controller
                      control={passwordControl}
                      name="password"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <PasswordInput
                          ref={passwordInputRef}
                          placeholder="Password"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          returnKeyType="done"
                          onSubmitEditing={() => {
                            void handlePasswordSubmit(onPasswordLogin)();
                          }}
                          error={passwordErrors.password?.message}
                        />
                      )}
                    />

                    {/* OPTIONS ROW: Remember Me & Forgot Password */}
                    <View style={styles.optionsRow}>
                      <TouchableOpacity
                        onPress={() => setRememberMe((prev) => !prev)}
                        style={styles.checkboxRow}
                        activeOpacity={0.8}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: rememberMe }}
                        accessibilityLabel="Remember Me"
                      >
                        <View
                          style={[
                            styles.checkboxCircle,
                            rememberMe && styles.checkboxCircleChecked,
                          ]}
                        >
                          {rememberMe && (
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={styles.rememberMeLabel}>Remember Me</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setIsForgotPasswordView(true);
                          setApiErrorMessage('');
                          setApiSuccessMessage('');
                        }}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Forgot Password"
                        style={styles.forgotLinkRow}
                      >
                        <Text style={styles.forgotLink}>Forgot Password?</Text>
                        <Feather name="chevron-right" size={14} color="#0047AB" />
                      </TouchableOpacity>
                    </View>

                    {/* LOGIN CTA BUTTON (BLUE-ORANGE GRADIENT WITH [-> | Login]) */}
                    <PrimaryButton
                      title="Login"
                      iconName="log-in-outline"
                      showDivider={true}
                      onPress={handlePasswordSubmit(onPasswordLogin)}
                      disabled={!isPasswordValid}
                      isLoading={isPasswordSubmitting}
                      style={styles.loginButton}
                    />

                    {/* REGISTER FOOTER */}
                    <View style={styles.registerContainer}>
                      <View style={styles.registerDividerLine} />
                      <View style={styles.registerTextWrap}>
                        <Text style={styles.registerPrompt}>Don’t have an account? </Text>
                        <TouchableOpacity onPress={handleOpenRegister} activeOpacity={0.7}>
                          <View style={styles.registerWordContainer}>
                            <Text style={styles.registerLink}>Register</Text>
                            {/* Orange swoosh curve underline under Register */}
                            <View style={styles.registerUnderlineCurve} />
                          </View>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.registerDividerLine} />
                    </View>
                  </View>
                )}

                {/* ============================================================== */}
                {/* 2. OTP TAB                                                     */}
                {/* ============================================================== */}
                {activeTab === 'otp' && (
                  <View style={styles.tabBody}>
                    {!otpSent ? (
                      <>
                        <Controller
                          control={otpControl}
                          name="contact"
                          render={({ field: { onChange, onBlur, value } }) => (
                            <AppInput
                              iconName="mail"
                              placeholder="Email / Mobile"
                              value={value}
                              onChangeText={onChange}
                              onBlur={onBlur}
                              keyboardType="email-address"
                              autoCapitalize="none"
                              autoCorrect={false}
                              returnKeyType="done"
                              onSubmitEditing={() => {
                                void handleOtpRequestSubmit(onRequestOtp)();
                              }}
                              error={otpErrors.contact?.message}
                            />
                          )}
                        />

                        <PrimaryButton
                          title="Get OTP"
                          iconName="send-outline"
                          showDivider={true}
                          onPress={handleOtpRequestSubmit(onRequestOtp)}
                          disabled={!isOtpValid}
                          isLoading={isOtpRequestSubmitting}
                          style={styles.loginButton}
                        />
                      </>
                    ) : (
                      <>
                        <View style={styles.contactChipRow}>
                          <View style={styles.contactChipLeft}>
                            <Ionicons name="phone-portrait-outline" size={16} color="#0047AB" />
                            <Text style={styles.contactChipText}>{targetContact}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              setOtpSent(false);
                              setOtpValue('');
                              setApiErrorMessage('');
                              setApiSuccessMessage('');
                            }}
                            style={styles.changeContactButton}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.changeContactText}>Change</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.otpPromptText}>
                          Enter the 6-digit verification code sent to your registered contact.
                        </Text>

                        <OtpInput
                          value={otpValue}
                          onChange={(val) => {
                            setOtpValue(val);
                            if (val.length === 6) {
                              void onVerifyOtp(val);
                            }
                          }}
                          onComplete={(val) => {
                            void onVerifyOtp(val);
                          }}
                          hasError={!!apiErrorMessage}
                        />

                        <View style={styles.resendContainer}>
                          {otpTimer > 0 ? (
                            <Text style={styles.resendTimerText}>
                              Resend code in{' '}
                              <Text style={styles.resendTimerHighlight}>{otpTimer}s</Text>
                            </Text>
                          ) : (
                            <TouchableOpacity
                              onPress={onResendOtp}
                              disabled={isOtpRequestSubmitting}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.resendActiveText}>Resend OTP</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        <PrimaryButton
                          title="Verify & Login"
                          iconName="checkmark-done-outline"
                          showDivider={true}
                          onPress={() => void onVerifyOtp()}
                          disabled={otpValue.length !== 6}
                          isLoading={isOtpVerifySubmitting}
                          style={styles.loginButton}
                        />
                      </>
                    )}

                    {/* REGISTER FOOTER */}
                    <View style={styles.registerContainer}>
                      <View style={styles.registerDividerLine} />
                      <View style={styles.registerTextWrap}>
                        <Text style={styles.registerPrompt}>Don’t have an account? </Text>
                        <TouchableOpacity onPress={handleOpenRegister} activeOpacity={0.7}>
                          <View style={styles.registerWordContainer}>
                            <Text style={styles.registerLink}>Register</Text>
                            <View style={styles.registerUnderlineCurve} />
                          </View>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.registerDividerLine} />
                    </View>
                  </View>
                )}

                {/* ============================================================== */}
                {/* 3. QR TAB                                                      */}
                {/* ============================================================== */}
                {activeTab === 'qr' && (
                  <View style={styles.tabBody}>
                    <QrInstructionCard
                      onSwitchToPassword={() => {
                        setActiveTab('password');
                        setApiErrorMessage('');
                        setApiSuccessMessage('');
                      }}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Bottom spacer so content doesn't cover artwork */}
            <View style={{ height: 110 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* LANGUAGE SELECT MODAL */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.languageModalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.languageModalCard}>
            <Text style={styles.languageModalTitle}>Select Language</Text>
            {['English', 'Hindi (हिंदी)', 'Gujarati (ગુજરાતી)', 'Marathi (मराठी)'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  selectedLanguage.startsWith(lang.split(' ')[0]) && styles.languageOptionActive,
                ]}
                onPress={() => {
                  setSelectedLanguage(lang.split(' ')[0]);
                  setShowLanguageModal(false);
                }}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    selectedLanguage.startsWith(lang.split(' ')[0]) && styles.languageOptionTextActive,
                  ]}
                >
                  {lang}
                </Text>
                {selectedLanguage.startsWith(lang.split(' ')[0]) && (
                  <Ionicons name="checkmark-circle" size={18} color="#0047AB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FD',
  },
  safeArea: {
    flex: 1,
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 10,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  languageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroTitleHighlight: {
    color: '#FF6E00',
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A6B87',
    marginTop: 6,
    textAlign: 'center',
  },
  titleDividerAccent: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentLine: {
    width: 60,
    height: 3.5,
    borderRadius: 2,
  },
  formContainer: {
    width: '100%',
  },
  tabBody: {
    marginTop: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DFE7F2',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircleChecked: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  rememberMeLabel: {
    fontSize: 13,
    color: '#0E204E',
    fontWeight: '600',
  },
  forgotLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  forgotLink: {
    fontSize: 13,
    color: '#0047AB',
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 10,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
    paddingHorizontal: 10,
  },
  registerDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DCE6F2',
  },
  registerTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  registerPrompt: {
    fontSize: 13,
    color: '#5A6B87',
    fontWeight: '500',
  },
  registerWordContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  registerLink: {
    fontSize: 14,
    color: '#0047AB',
    fontWeight: '700',
  },
  registerUnderlineCurve: {
    position: 'absolute',
    bottom: -3,
    width: '100%',
    height: 2.5,
    backgroundColor: '#FF6E00',
    borderRadius: 1.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  bannerTextError: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  bannerTextSuccess: {
    fontSize: 13,
    color: '#16A34A',
    flex: 1,
    fontWeight: '500',
  },
  contactChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contactChipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  contactChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  changeContactButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#E8F1FC',
  },
  changeContactText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  otpPromptText: {
    fontSize: 13,
    color: '#5A6B87',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 18,
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resendTimerText: {
    fontSize: 13,
    color: '#5A6B87',
  },
  resendTimerHighlight: {
    color: '#0047AB',
    fontWeight: '700',
  },
  resendActiveText: {
    fontSize: 13,
    color: '#0047AB',
    fontWeight: '700',
  },
  forgotHeader: {
    marginBottom: 16,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0047AB',
  },
  forgotTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 6,
  },
  forgotSubtitle: {
    fontSize: 13,
    color: '#5A6B87',
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 10,
  },
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 88, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  languageModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  languageModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0E204E',
    marginBottom: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5FC',
  },
  languageOptionActive: {
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  languageOptionText: {
    fontSize: 14,
    color: '#5A6B87',
    fontWeight: '500',
  },
  languageOptionTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
});
