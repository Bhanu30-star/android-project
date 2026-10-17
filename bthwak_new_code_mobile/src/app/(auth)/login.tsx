import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather, Ionicons } from '@expo/vector-icons';

import { Theme } from '@/theme';
import { AuthTabs, AuthTabType } from '@/components/AuthTabs';
import { AppInput } from '@/components/AppInput';
import { PasswordInput } from '@/components/PasswordInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { OtpInput } from '@/components/OtpInput';
import { RecaptchaBox } from '@/components/RecaptchaBox';
import { PromoBanner } from '@/components/PromoBanner';
import { SocialLinks } from '@/components/SocialLinks';
import { QrInstructionCard } from '@/components/QrInstructionCard';

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
  const [trustDevice, setTrustDevice] = useState(false);
  const [captchaTokenPassword, setCaptchaTokenPassword] = useState<string | null>(null);
  const [captchaErrorPassword, setCaptchaErrorPassword] = useState('');
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // OTP Login State
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [captchaTokenOtp, setCaptchaTokenOtp] = useState<string | null>(null);
  const [captchaErrorOtp, setCaptchaErrorOtp] = useState('');
  const [isOtpRequestSubmitting, setIsOtpRequestSubmitting] = useState(false);
  const [isOtpVerifySubmitting, setIsOtpVerifySubmitting] = useState(false);

  // Forgot Password State
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // Global inline error banner
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [apiSuccessMessage, setApiSuccessMessage] = useState('');

  // Refs for moving focus
  const passwordInputRef = useRef<any>(null);

  // If already authenticated, redirect to home
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

    if (!captchaTokenPassword) {
      setCaptchaErrorPassword('Please complete reCAPTCHA verification');
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      const response = await loginApi({
        emailOrMobile: data.email,
        password: data.password,
        loginType: 'with-pass',
        trustDevice,
        recaptchaKey: captchaTokenPassword,
      });

      if (response?.data?.auth_token) {
        await loginWithToken(response.data.auth_token);
        router.replace('/dashboard');
      } else {
        setApiErrorMessage(response?.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      const parsedError = parseApiError(error);
      setApiErrorMessage(parsedError);
      // Reset captcha on failure
      setCaptchaTokenPassword(null);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // Handler: Request OTP
  const onRequestOtp = async (data: OtpRequestFormData) => {
    setApiErrorMessage('');
    setApiSuccessMessage('');

    if (!captchaTokenOtp) {
      setCaptchaErrorOtp('Please verify reCAPTCHA before requesting OTP');
      return;
    }

    setIsOtpRequestSubmitting(true);
    try {
      const response = await sendOtpForLoginApi(data.contact, captchaTokenOtp);
      setOtpSent(true);
      setOtpTimer(30);
      setOtpValue('');
      setApiSuccessMessage(response.message || 'OTP sent successfully! Please check your mobile or email.');
    } catch (error) {
      const parsed = parseApiError(error);
      setApiErrorMessage(parsed);
      setCaptchaTokenOtp(null);
    } finally {
      setIsOtpRequestSubmitting(false);
    }
  };

  // Handler: Verify OTP & Login
  const onVerifyOtp = async () => {
    setApiErrorMessage('');
    setApiSuccessMessage('');

    if (otpValue.length !== 6) {
      setApiErrorMessage('Please enter a complete 6-digit OTP');
      return;
    }

    const contact = getOtpValues('contact');
    setIsOtpVerifySubmitting(true);
    try {
      const response = await loginApi({
        emailOrMobile: contact,
        otp: otpValue,
        loginType: 'with-otp',
        trustDevice,
        recaptchaKey: captchaTokenOtp || '',
      });

      if (response?.data?.auth_token) {
        await loginWithToken(response.data.auth_token);
        router.replace('/dashboard');
      } else {
        setApiErrorMessage(response?.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      const parsed = parseApiError(error);
      setApiErrorMessage(parsed);
    } finally {
      setIsOtpVerifySubmitting(false);
    }
  };

  // Handler: Resend OTP
  const onResendOtp = async () => {
    const contact = getOtpValues('contact');
    if (!contact) return;
    setApiErrorMessage('');
    setIsOtpRequestSubmitting(true);
    try {
      const response = await sendOtpForLoginApi(contact, captchaTokenOtp || '');
      setOtpTimer(30);
      setOtpValue('');
      setApiSuccessMessage(response.message || 'OTP resent successfully!');
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
        response.message ||
          'If an account exists, a password reset link has been sent to your registered address.'
      );
      resetForgotForm();
    } catch (error) {
      setApiErrorMessage(parseApiError(error));
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={Theme.colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
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
              {/* TOP: LOGO & HINDI TAGLINE */}
              <View style={styles.logoHeader}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                  accessibilityLabel="BTHAWK Logo - आपके बिज़नेस का डॉक्टर"
                />
              </View>

              {/* OPTIONAL PROMO BANNER (Collapsible) */}
              <PromoBanner />

              {/* MAIN WHITE ROUNDED CARD */}
              <View style={styles.card}>
                {/* FORGOT PASSWORD VIEW OR TABS */}
                {isForgotPasswordView ? (
                  <View style={styles.forgotHeader}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsForgotPasswordView(false);
                        setApiErrorMessage('');
                        setApiSuccessMessage('');
                      }}
                      style={styles.backRow}
                    >
                      <Feather name="arrow-left" size={18} color={Theme.colors.primary} />
                      <Text style={styles.backText}>Back to Login</Text>
                    </TouchableOpacity>
                    <Text style={styles.forgotTitle}>Reset Password</Text>
                    <Text style={styles.forgotSubtitle}>
                      Enter your registered Email or Mobile number to receive a reset link.
                    </Text>
                  </View>
                ) : (
                  <AuthTabs
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                      setActiveTab(tab);
                      setApiErrorMessage('');
                      setApiSuccessMessage('');
                    }}
                  />
                )}

                {/* API FEEDBACK BANNERS */}
                {!!apiErrorMessage && (
                  <View style={styles.errorBanner} accessibilityRole="alert">
                    <Feather name="alert-circle" size={16} color={Theme.colors.error} />
                    <Text style={styles.bannerTextError}>{apiErrorMessage}</Text>
                  </View>
                )}

                {!!apiSuccessMessage && (
                  <View style={styles.successBanner} accessibilityRole="alert">
                    <Ionicons name="checkmark-circle" size={16} color={Theme.colors.success} />
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
                          label="Email or Mobile"
                          iconName="mail"
                          placeholder="Enter your Email/Mobile no..."
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
                          label="Password"
                          placeholder="Enter your password.."
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

                    {/* reCAPTCHA */}
                    <RecaptchaBox
                      verified={!!captchaTokenPassword}
                      onVerify={(token) => {
                        setCaptchaTokenPassword(token);
                        setCaptchaErrorPassword('');
                      }}
                      error={captchaErrorPassword}
                    />

                    {/* Checkbox "Trust this device" & "Forgot Password" */}
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
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>Trust this device for 30 days</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setIsForgotPasswordView(true);
                          setApiErrorMessage('');
                          setApiSuccessMessage('');
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Forgot Password"
                      >
                        <Text style={styles.forgotLink}>Forgot Password</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Submit Button */}
                    <PrimaryButton
                      title="Login"
                      onPress={handlePasswordSubmit(onPasswordLogin)}
                      disabled={!isPasswordValid || !captchaTokenPassword}
                      isLoading={isPasswordSubmitting}
                      style={styles.submitButton}
                    />
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
                              label="Email / Mobile"
                              iconName="phone"
                              placeholder="Enter your Email/Mobile no..."
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

                        {/* reCAPTCHA */}
                        <RecaptchaBox
                          verified={!!captchaTokenOtp}
                          onVerify={(token) => {
                            setCaptchaTokenOtp(token);
                            setCaptchaErrorOtp('');
                          }}
                          error={captchaErrorOtp}
                        />

                        <PrimaryButton
                          title="Get OTP"
                          onPress={handleOtpRequestSubmit(onRequestOtp)}
                          disabled={!isOtpValid || !captchaTokenOtp}
                          isLoading={isOtpRequestSubmitting}
                          style={styles.submitButton}
                        />
                      </>
                    ) : (
                      <>
                        {/* Selected Contact with Change option */}
                        <View style={styles.contactChipRow}>
                          <View style={styles.contactChipLeft}>
                            <Feather name="user-check" size={15} color={Theme.colors.primary} />
                            <Text style={styles.contactChipText} numberOfLines={1}>
                              {getOtpValues('contact')}
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
                            accessibilityRole="button"
                            accessibilityLabel="Change email or mobile number"
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
                          onComplete={() => onVerifyOtp()}
                        />

                        {/* Resend Timer / Action */}
                        <View style={styles.resendContainer}>
                          {otpTimer > 0 ? (
                            <Text style={styles.resendTimerText}>
                              Resend OTP in{' '}
                              <Text style={styles.resendTimerHighlight}>{otpTimer}s</Text>
                            </Text>
                          ) : (
                            <TouchableOpacity
                              onPress={onResendOtp}
                              disabled={isOtpRequestSubmitting}
                              accessibilityRole="button"
                              accessibilityLabel="Resend OTP"
                            >
                              <Text style={styles.resendActiveText}>Resend OTP</Text>
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Trust device for OTP */}
                        <TouchableOpacity
                          onPress={() => setTrustDevice((prev) => !prev)}
                          style={[styles.checkboxRow, { marginBottom: Theme.spacing.lg }]}
                          activeOpacity={0.8}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: trustDevice }}
                        >
                          <View
                            style={[
                              styles.checkboxBox,
                              trustDevice && styles.checkboxBoxChecked,
                            ]}
                          >
                            {trustDevice && (
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            )}
                          </View>
                          <Text style={styles.checkboxLabel}>Trust this device for 30 days</Text>
                        </TouchableOpacity>

                        <PrimaryButton
                          title="Verify OTP & Login"
                          onPress={onVerifyOtp}
                          disabled={otpValue.length !== 6}
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
                          label="Email or Mobile"
                          iconName="mail"
                          placeholder="Enter your Email/Mobile no..."
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

              {/* FOOTER */}
              <SocialLinks />
            </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    justifyContent: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  logoHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
  },
  logoImage: {
    width: 220,
    height: 52,
  },
  card: {
    backgroundColor: Theme.colors.cardBg,
    borderRadius: Theme.borderRadius.card,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xl,
    ...Theme.shadows.card,
  },
  forgotHeader: {
    marginBottom: Theme.spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Theme.spacing.sm,
  },
  backText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  forgotTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  forgotSubtitle: {
    fontSize: Theme.typography.sizes.xs + 1,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    gap: 8,
  },
  bannerTextError: {
    flex: 1,
    fontSize: Theme.typography.sizes.xs + 1,
    color: Theme.colors.error,
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    gap: 8,
  },
  bannerTextSuccess: {
    flex: 1,
    fontSize: Theme.typography.sizes.xs + 1,
    color: Theme.colors.success,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Theme.spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  checkboxLabel: {
    fontSize: Theme.typography.sizes.xs + 1,
    color: Theme.colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  forgotLink: {
    fontSize: Theme.typography.sizes.xs + 1,
    fontWeight: '700',
    color: Theme.colors.primary,
    marginLeft: 8,
  },
  submitButton: {
    marginTop: Theme.spacing.sm,
  },
  contactChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: Theme.spacing.md,
  },
  contactChipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  contactChipText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  changeContactButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  changeContactText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  otpPromptText: {
    fontSize: Theme.typography.sizes.xs + 1,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  resendContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.sm,
  },
  resendTimerText: {
    fontSize: Theme.typography.sizes.xs + 1,
    color: Theme.colors.textMuted,
  },
  resendTimerHighlight: {
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  resendActiveText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
});
