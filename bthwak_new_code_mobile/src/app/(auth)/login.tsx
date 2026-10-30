import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather, Ionicons } from '@expo/vector-icons';

import { AuthTabs, AuthTabType } from '@/components/AuthTabs';
import { AppInput } from '@/components/AppInput';
import { PasswordInput } from '@/components/PasswordInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { OtpInput } from '@/components/OtpInput';
import { QrInstructionCard } from '@/components/QrInstructionCard';
import { BthawkLogo } from '@/components/BthawkLogo';

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

  // Password Login State
  const [trustDevice, setTrustDevice] = useState(true);
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
        trustDevice,
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
          trustDevice,
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
    [isOtpVerifySubmitting, otpValue, targetContact, getOtpValues, loginWithToken, router, trustDevice]
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
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* BRAND HEADER */}
            <View style={styles.brandHeader}>
              <View style={styles.brandLogoRow}>
                <BthawkLogo size={48} />
                <Text style={styles.brandLogoText}>
                  BTHAWK<Text style={styles.brandLogoPlus}>+</Text>
                </Text>
              </View>
              <Text style={styles.brandSubtitle}>Sales, Stock &amp; Commerce Management</Text>
            </View>

            {/* MAIN CARD */}
            <View style={styles.card}>
              {/* FORGOT PASSWORD HEADER OR TABS */}
              {isForgotPasswordView ? (
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
                    <Feather name="arrow-left" size={18} color="#6C7CFF" />
                    <Text style={styles.backText}>Back to Login</Text>
                  </TouchableOpacity>
                  <Text style={styles.cardTitle}>Reset Password</Text>
                  <Text style={styles.cardSubtitle}>
                    Enter your registered email or 10-digit mobile number to receive a secure reset link.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.cardTitle}>Welcome Back</Text>
                  <Text style={styles.cardSubtitle}>Sign in to access your business portal</Text>
                  <AuthTabs
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      setApiErrorMessage('');
                      setApiSuccessMessage('');
                    }}
                  />
                </>
              )}

              {/* API ERROR BANNER */}
              {!!apiErrorMessage && (
                <View style={styles.errorBanner} accessibilityRole="alert">
                  <Feather name="alert-circle" size={16} color="#FF5C6C" />
                  <Text style={styles.bannerTextError}>{apiErrorMessage}</Text>
                </View>
              )}

              {/* API SUCCESS BANNER */}
              {!!apiSuccessMessage && (
                <View style={styles.successBanner} accessibilityRole="alert">
                  <Ionicons name="checkmark-circle" size={16} color="#2DD4A8" />
                  <Text style={styles.bannerTextSuccess}>{apiSuccessMessage}</Text>
                </View>
              )}

              {/* 1. PASSWORD TAB */}
              {!isForgotPasswordView && activeTab === 'password' && (
                <View>
                  <Controller
                    control={passwordControl}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppInput
                        iconName="mail"
                        placeholder="Email or 10-digit mobile"
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

                  {/* OPTIONS ROW: Remember Device & Forgot Password */}
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      onPress={() => setTrustDevice((prev) => !prev)}
                      style={styles.checkboxRow}
                      activeOpacity={0.8}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: trustDevice }}
                      accessibilityLabel="Trust this device for 30 days"
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          trustDevice && styles.checkboxBoxChecked,
                        ]}
                      >
                        {trustDevice && (
                          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>Trust device</Text>
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
                    >
                      <Text style={styles.forgotLink}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>

                  {/* LOGIN CTA BUTTON */}
                  <PrimaryButton
                    title="Sign In"
                    onPress={handlePasswordSubmit(onPasswordLogin)}
                    disabled={!isPasswordValid}
                    isLoading={isPasswordSubmitting}
                    style={styles.submitButton}
                  />

                  {/* REGISTER FOOTER */}
                  <View style={styles.registerRow}>
                    <Text style={styles.registerPrompt}>Don&apos;t have an account? </Text>
                    <TouchableOpacity onPress={handleOpenRegister} activeOpacity={0.7}>
                      <Text style={styles.registerLink}>Register</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* 2. OTP TAB */}
              {!isForgotPasswordView && activeTab === 'otp' && (
                <View>
                  {!otpSent ? (
                    <>
                      <Controller
                        control={otpControl}
                        name="contact"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <AppInput
                            iconName="phone"
                            placeholder="Email or 10-digit mobile"
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
                        onPress={handleOtpRequestSubmit(onRequestOtp)}
                        disabled={!isOtpValid}
                        isLoading={isOtpRequestSubmitting}
                        style={styles.submitButton}
                      />

                      {/* REGISTER FOOTER */}
                      <View style={styles.registerRow}>
                        <Text style={styles.registerPrompt}>Don&apos;t have an account? </Text>
                        <TouchableOpacity onPress={handleOpenRegister} activeOpacity={0.7}>
                          <Text style={styles.registerLink}>Register</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Selected Contact with Change option */}
                      <View style={styles.contactChipRow}>
                        <View style={styles.contactChipLeft}>
                          <Feather name="check-circle" size={15} color="#2DD4A8" />
                          <Text style={styles.contactChipText} numberOfLines={1}>
                            {targetContact || getOtpValues('contact')}
                          </Text>
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
                        Enter the 6-digit verification code sent to your contact
                      </Text>

                      {/* 6-box OTP Input */}
                      <OtpInput
                        value={otpValue}
                        onChange={setOtpValue}
                        onComplete={(code) => {
                          void onVerifyOtp(code);
                        }}
                      />

                      {/* Resend Timer / Action */}
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

                      {/* Trust device for OTP */}
                      <TouchableOpacity
                        onPress={() => setTrustDevice((prev) => !prev)}
                        style={[styles.checkboxRow, { marginBottom: 18 }]}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.checkboxBox,
                            trustDevice && styles.checkboxBoxChecked,
                          ]}
                        >
                          {trustDevice && (
                            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>Trust this device for 30 days</Text>
                      </TouchableOpacity>

                      <PrimaryButton
                        title="Verify & Sign In"
                        onPress={() => onVerifyOtp()}
                        disabled={otpValue.length !== 6 || isOtpVerifySubmitting}
                        isLoading={isOtpVerifySubmitting}
                        style={styles.submitButton}
                      />
                    </>
                  )}
                </View>
              )}

              {/* 3. QR CODE TAB */}
              {!isForgotPasswordView && activeTab === 'qr' && (
                <QrInstructionCard onSwitchToPassword={() => setActiveTab('password')} />
              )}

              {/* 4. FORGOT PASSWORD VIEW */}
              {isForgotPasswordView && (
                <View>
                  <Controller
                    control={forgotControl}
                    name="user"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <AppInput
                        iconName="mail"
                        placeholder="Email or 10-digit mobile"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
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
                    style={styles.submitButton}
                  />
                </View>
              )}
            </View>

            {/* TRUST & SECURITY BADGE */}
            <View style={styles.trustFooter}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#2DD4A8" />
              <Text style={styles.trustText}>
                256-Bit SSL Encrypted • ISO 27001 Certified
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#100F1D',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  brandLogoText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F2F2FA',
    letterSpacing: 0.5,
  },
  brandLogoPlus: {
    color: '#E8552D',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#9AA0BF',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#17162A',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: '#2A2D4A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F2F2FA',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9AA0BF',
    lineHeight: 18,
    marginBottom: 16,
  },
  forgotHeader: {
    marginBottom: 12,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  backText: {
    fontSize: 14,
    color: '#6C7CFF',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26131D',
    borderWidth: 1,
    borderColor: '#5C1D24',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  bannerTextError: {
    flex: 1,
    fontSize: 13,
    color: '#FF5C6C',
    fontWeight: '500',
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162828',
    borderWidth: 1,
    borderColor: '#1B4D3E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  bannerTextSuccess: {
    flex: 1,
    fontSize: 13,
    color: '#2DD4A8',
    fontWeight: '500',
    lineHeight: 18,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#2A2D4A',
    backgroundColor: '#100F1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#6C7CFF',
    borderColor: '#6C7CFF',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#9AA0BF',
    fontWeight: '500',
  },
  forgotLink: {
    fontSize: 13,
    color: '#6C7CFF',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 6,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerPrompt: {
    fontSize: 13,
    color: '#9AA0BF',
  },
  registerLink: {
    fontSize: 13,
    color: '#6C7CFF',
    fontWeight: '700',
  },
  contactChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#100F1D',
    borderWidth: 1,
    borderColor: '#2A2D4A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
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
    color: '#F2F2FA',
  },
  changeContactButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E1D36',
  },
  changeContactText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C7CFF',
  },
  otpPromptText: {
    fontSize: 13,
    color: '#9AA0BF',
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
    color: '#9AA0BF',
  },
  resendTimerHighlight: {
    color: '#6C7CFF',
    fontWeight: '700',
  },
  resendActiveText: {
    fontSize: 13,
    color: '#6C7CFF',
    fontWeight: '700',
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  trustText: {
    fontSize: 12,
    color: '#5B6084',
    fontWeight: '500',
  },
});
