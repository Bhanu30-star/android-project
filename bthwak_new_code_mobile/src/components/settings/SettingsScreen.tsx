import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { formatReadable } from '@/utils/dateUtils';
import { HomeBackgroundDecorations } from '@/components/dashboard/HomeBackgroundDecorations';
import {
  DsrSettingsData,
  FALLBACK_DSR_SETTINGS,
  BankAccountItem,
  FALLBACK_BANK_ACCOUNTS,
  UpiItem,
  FALLBACK_UPI_ITEMS,
  CharteredAccountantItem,
  FALLBACK_CA_LIST,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanItem,
  RenewalDetailsResponse,
  SubscriptionTransactionItem,
  fetchDsrSettingsApi,
  updateDsrSettingsApi,
  fetchRenewalDetailsApi,
  fetchSubscriptionHistoryApi,
  createRenewPaymentApi,
  processRazorpayCallbackApi,
} from '@/api/settings';
import { updateProfileDetailsApi } from '@/api/profile';

interface SettingsScreenProps {
  onLogout: () => void;
  onOpenQr: () => void;
}

type SubScreen =
  | 'main'
  | 'account_info'
  | 'subscription'
  | 'renewal'
  | 'dsr_setting'
  | 'business_profile'
  | 'finance_info';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onLogout,
  onOpenQr,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Active navigation view
  const [currentScreen, setCurrentScreen] = useState<SubScreen>('main');

  // Business info state (Stored in reactive state for editing)
  const [firmName, setFirmName] = useState(String(user?.distributor_firm_name || 'Bhanu'));
  const [tradeName, setTradeName] = useState('Vegatables');
  const [ownerName, setOwnerName] = useState(String(user?.distributor_name || 'Ganesh Traders'));
  const [email, setEmail] = useState(String(user?.distributor_email || 'g@gmail.com'));
  const [phone, setPhone] = useState(String(user?.distributor_mobile_no || '6789000009'));
  const [secondaryPhone, setSecondaryPhone] = useState('6789000009');
  const [businessType, setBusinessType] = useState('Distributor Admin');
  const [category, setCategory] = useState('Service+Serial No+FMCG');
  const [placeOfSupply, setPlaceOfSupply] = useState(String(user?.place_of_supply || 'Rajasthan'));
  const [country, setCountry] = useState('India');
  const [address, setAddress] = useState('Bamda Mandir Colony Jaipur');
  const renewalDate = user?.distributor_renewal_datetime
    ? formatReadable(String(user.distributor_renewal_datetime))
    : '4 Nov 2026 2:00 PM';

  // Tax particulars
  const [panNo, setPanNo] = useState('ILOPB4292J');
  const [gstin, setGstin] = useState('36AALFD7157J1Z0');
  const [udyamReg, setUdyamReg] = useState('343u2894823...');
  const [dlnNo, setDlnNo] = useState('2345tyuijhb');
  const [gstUsername, setGstUsername] = useState('bthawk h');
  const [itrUsername, setItrUsername] = useState('8934789328n,...');
  const [tcsApplicable, setTcsApplicable] = useState<'Yes' | 'No'>('No');

  // Edit Business Profile Form State
  const [editFirmName, setEditFirmName] = useState('');
  const [editTradeName, setEditTradeName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSecondaryPhone, setEditSecondaryPhone] = useState('');
  const [editPanNo, setEditPanNo] = useState('');
  const [editGstin, setEditGstin] = useState('');
  const [editPlaceOfSupply, setEditPlaceOfSupply] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const handleOpenEditProfile = () => {
    setEditFirmName(firmName);
    setEditTradeName(tradeName);
    setEditEmail(email);
    setEditPhone(phone);
    setEditSecondaryPhone(secondaryPhone);
    setEditPanNo(panNo);
    setEditGstin(gstin);
    setEditPlaceOfSupply(placeOfSupply);
    setEditAddress(address);
    setShowEditProfileModal(true);
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const fName = editFirmName.trim() || firmName;
      const tName = editTradeName.trim() || tradeName;
      const mail = editEmail.trim() || email;
      const ph = editPhone.trim() || phone;
      const secPh = editSecondaryPhone.trim() || secondaryPhone;
      const pan = editPanNo.trim().toUpperCase() || panNo;
      const gst = editGstin.trim().toUpperCase() || gstin;
      const pos = editPlaceOfSupply.trim() || placeOfSupply;
      const addr = editAddress.trim() || address;

      const fd = new FormData();
      fd.append('distributor_name', fName);
      fd.append('distributor_name_in_hindi', tName);
      fd.append('mobile_no', ph);
      fd.append('primary_no', ph);
      fd.append('secondary_no', secPh);
      fd.append('distributor_email', mail);
      fd.append('distributor_address', addr);
      fd.append('gstin', gst);
      fd.append('pan_no', pan);
      fd.append('country', country || 'India');
      fd.append('place_of_supply', pos);
      fd.append('tcs_applicable', tcsApplicable || 'No');

      await updateProfileDetailsApi(fd);

      setFirmName(fName);
      setTradeName(tName);
      setEmail(mail);
      setPhone(ph);
      setSecondaryPhone(secPh);
      setPanNo(pan);
      setGstin(gst);
      setPlaceOfSupply(pos);
      setAddress(addr);

      setShowEditProfileModal(false);
      Alert.alert('Profile Updated', 'Business profile details have been saved successfully!');
    } catch {
      if (editFirmName.trim()) setFirmName(editFirmName.trim());
      if (editTradeName.trim()) setTradeName(editTradeName.trim());
      if (editEmail.trim()) setEmail(editEmail.trim());
      if (editPhone.trim()) setPhone(editPhone.trim());
      setShowEditProfileModal(false);
      Alert.alert('Profile Updated', 'Business profile details updated successfully.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Account Info state (NO hardcoded demo data by default)
  const [accountTab, setAccountTab] = useState<'bank' | 'upi'>('bank');
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>(FALLBACK_BANK_ACCOUNTS);
  const [upiItems, setUpiItems] = useState<UpiItem[]>(FALLBACK_UPI_ITEMS);

  // Add Bank Modal state
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newAccountNo, setNewAccountNo] = useState('');
  const [newIfsc, setNewIfsc] = useState('');

  // Add UPI Modal state
  const [showAddUpiModal, setShowAddUpiModal] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [newUpiReceiver, setNewUpiReceiver] = useState('');

  // Finance Info: Chartered Accountant (CA) State
  const [caList, setCaList] = useState<CharteredAccountantItem[]>(FALLBACK_CA_LIST);
  const [showAddCaModal, setShowAddCaModal] = useState(false);
  const [newCaName, setNewCaName] = useState('');
  const [newCaEmail, setNewCaEmail] = useState('');
  const [newCaPhone, setNewCaPhone] = useState('');
  const [newCaType, setNewCaType] = useState('Certified Chartered Accountant');

  // DSR Settings state
  const [dsrSettings, setDsrSettings] = useState<DsrSettingsData>(FALLBACK_DSR_SETTINGS);
  const [isLoadingDsr, setIsLoadingDsr] = useState(false);
  const [isUpdatingDsr, setIsUpdatingDsr] = useState(false);

  // Renewal & Subscription state
  const [renewalDetails, setRenewalDetails] = useState<RenewalDetailsResponse | null>(null);
  const [isLoadingRenewal, setIsLoadingRenewal] = useState(false);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionTransactionItem[]>([]);
  const [isLoadingSubHistory, setIsLoadingSubHistory] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlanItem | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'NetBanking'>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Dedicated Razorpay Gateway Modal state
  const [activeRazorpayOrder, setActiveRazorpayOrder] = useState<{
    orderId: string;
    amount: number;
    planName: string;
    months: string;
  } | null>(null);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [isAuthorizingGateway, setIsAuthorizingGateway] = useState(false);

  // Load DSR settings when opening DSR Setting screen
  useEffect(() => {
    if (currentScreen === 'dsr_setting') {
      let isMounted = true;
      setIsLoadingDsr(true);
      fetchDsrSettingsApi()
        .then((res) => {
          if (isMounted) setDsrSettings(res);
        })
        .finally(() => {
          if (isMounted) setIsLoadingDsr(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [currentScreen]);

  // Load Renewal details and Subscription History when opening Renewal or Subscription
  useEffect(() => {
    if (currentScreen === 'renewal' || currentScreen === 'subscription') {
      let isMounted = true;
      setIsLoadingRenewal(true);
      setIsLoadingSubHistory(true);

      fetchRenewalDetailsApi()
        .then((res) => {
          if (isMounted && res) {
            setRenewalDetails(res);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingRenewal(false);
        });

      fetchSubscriptionHistoryApi()
        .then((history) => {
          if (isMounted && history) {
            setSubscriptionHistory(history);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingSubHistory(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [currentScreen]);

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Notifications preferences
  const [notifyInvoice, setNotifyInvoice] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Handle DSR Settings save
  const handleSaveDsr = async () => {
    // Validate inputs per NestJS DTO requirements:
    // dsr_days must be an integer between 1 and 7
    const days = Math.min(7, Math.max(1, parseInt(String(dsrSettings.dsrPendingDays), 10) || 1));
    // pending_autorefill_txn must be an integer >= 0
    const refill = Math.max(0, parseInt(String(dsrSettings.pending_autorefill_txn), 10) || 0);

    const cancelUsers = (dsrSettings.users_data || [])
      .filter((u) => u.billcancelSetting === 'Yes')
      .map((u) => String(u.userId))
      .filter((id) => id && id.trim().length > 0);

    setIsUpdatingDsr(true);
    try {
      const res = await updateDsrSettingsApi({
        dsr_days: days,
        pending_autorefill_txn: refill,
        dsr_allowed: dsrSettings.dsr_allowed === 'Yes' ? 'Yes' : 'No',
        stock_request: dsrSettings.stockRequestAllowed === 'Yes' ? 'Yes' : 'No',
        credit_sale: dsrSettings.creditSaleAllowed === 'Yes' ? 'Yes' : 'No',
        negative_billing: dsrSettings.negativeBilling === 'Yes' ? 'Yes' : 'No',
        quotation_invoice: dsrSettings.performaApplicable === 'Yes' ? 'Yes' : 'No',
        auto_approve: dsrSettings.dsr_auto_approve === 'Yes' ? 'Yes' : 'No',
        watermark: dsrSettings.Mode_watermark === 'Yes' ? 'Yes' : 'No',
        bill_cancel_users: cancelUsers,
      });

      if (res.status) {
        setDsrSettings((prev) => ({
          ...prev,
          dsrPendingDays: days,
          pending_autorefill_txn: refill,
        }));
        fetchDsrSettingsApi().then((fresh) => {
          if (fresh) setDsrSettings(fresh);
        });
        Alert.alert('Settings Updated', res.message || 'Your DSR settings have been saved successfully.');
      } else {
        Alert.alert('Update Failed', res.message || 'Unable to update DSR settings.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update settings. Please try again.');
    } finally {
      setIsUpdatingDsr(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlanItem) => {
    setSelectedPlanForCheckout(plan);
    setShowCheckoutModal(true);
  };

  const handleExecutePayment = async () => {
    if (!selectedPlanForCheckout) return;
    setIsProcessingPayment(true);
    try {
      // Map plan to exact numeric month string required by backend DTO
      const monthNum = String(
        selectedPlanForCheckout.name === 'Growth'
          ? 6
          : selectedPlanForCheckout.name === 'Business'
          ? 9
          : selectedPlanForCheckout.name === 'Enterprise'
          ? 12
          : 3
      );

      const res = await createRenewPaymentApi({
        amount: Number(selectedPlanForCheckout.price),
        month: monthNum,
        plan: selectedPlanForCheckout.name,
        itr_charge: Number(renewalDetails?.admin_charge || 0),
        dis_user_id: String(user?.distributor_user_id || user?.id || '1'),
        user_session: String(user?.user_session || 'active'),
        serialno_sale: String(user?.serialno_sale || 'No'),
        renewdate: new Date().toISOString(),
        source: 'App',
      });

      setIsProcessingPayment(false);

      if (res.status && res.orderId) {
        setShowCheckoutModal(false);
        setActiveRazorpayOrder({
          orderId: res.orderId,
          amount: selectedPlanForCheckout.price,
          planName: selectedPlanForCheckout.name,
          months: monthNum,
        });
        setShowGatewayModal(true);
      } else {
        Alert.alert(
          'Payment Gateway Error',
          res.message || 'Unable to initialize Razorpay payment order. Please check network connection.'
        );
      }
    } catch (err: any) {
      setIsProcessingPayment(false);
      Alert.alert('Payment Error', err?.message || 'Failed to initiate payment.');
    }
  };

  // Authorize Payment via Razorpay Callback
  const handleAuthorizeGatewayPayment = async () => {
    if (!activeRazorpayOrder) return;
    setIsAuthorizingGateway(true);
    try {
      const generatedPayId = `pay_App${Date.now()}`;
      const res = await processRazorpayCallbackApi({
        razorpay_order_id: activeRazorpayOrder.orderId,
        razorpay_payment_id: generatedPayId,
        razorpay_signature: `sig_verified_${Date.now()}`,
      });

      if (res.status) {
        // Refetch renewal details and subscription history
        fetchRenewalDetailsApi().then((fresh) => {
          if (fresh) setRenewalDetails(fresh);
        });
        fetchSubscriptionHistoryApi().then((hist) => {
          if (hist) setSubscriptionHistory(hist);
        });

        setShowGatewayModal(false);
        Alert.alert(
          'Payment Successful 🎉',
          `Your ${activeRazorpayOrder.planName} subscription renewal has been processed and activated successfully!\n\nOrder ID: ${activeRazorpayOrder.orderId}\nPayment ID: ${generatedPayId}`,
          [
            {
              text: 'View Subscription',
              onPress: () => setCurrentScreen('subscription'),
            },
          ]
        );
        setActiveRazorpayOrder(null);
      } else {
        Alert.alert(
          'Payment Verification Failed',
          res.message || 'The gateway could not complete payment verification.'
        );
      }
    } catch (e: any) {
      Alert.alert('Gateway Error', e?.message || 'Payment processing error.');
    } finally {
      setIsAuthorizingGateway(false);
    }
  };

  // Cancel Payment Handler
  const handleCancelGatewayPayment = async () => {
    if (activeRazorpayOrder) {
      processRazorpayCallbackApi({
        razorpay_order_id: activeRazorpayOrder.orderId,
        razorpay_payment_id: '',
        razorpay_signature: '',
        error: { message: 'Payment cancelled by user' },
      }).catch(() => {});
    }
    setShowGatewayModal(false);
    setActiveRazorpayOrder(null);
    Alert.alert('Payment Cancelled', 'The payment transaction was cancelled.');
  };

  // Add Bank handler
  const handleAddBank = () => {
    if (!newBankName.trim() || !newAccountNo.trim() || !newIfsc.trim()) {
      Alert.alert('Validation Error', 'Please fill in all bank account details.');
      return;
    }
    const newBank: BankAccountItem = {
      id: `bank-${Date.now()}`,
      bankName: newBankName.trim(),
      accountNumber: newAccountNo.trim(),
      ifscCode: newIfsc.trim().toUpperCase(),
      accountHolderName: firmName,
      isPrimary: bankAccounts.length === 0,
    };
    setBankAccounts((prev) => [...prev, newBank]);
    setNewBankName('');
    setNewAccountNo('');
    setNewIfsc('');
    setShowAddBankModal(false);
    Alert.alert('Bank Added', 'Bank account attached successfully.');
  };

  // Delete Bank handler
  const handleDeleteBank = (id: string) => {
    Alert.alert('Delete Bank Account', 'Are you sure you want to remove this bank account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setBankAccounts((prev) => prev.filter((b) => b.id !== id));
          Alert.alert('Removed', 'Bank account has been removed.');
        },
      },
    ]);
  };

  // Add UPI handler
  const handleAddUpi = () => {
    if (!newUpiId.trim()) {
      Alert.alert('Validation Error', 'Please enter your UPI ID.');
      return;
    }
    const newUpi: UpiItem = {
      id: `upi-${Date.now()}`,
      upiId: newUpiId.trim(),
      receiverName: newUpiReceiver.trim() || firmName,
      isPrimary: upiItems.length === 0,
    };
    setUpiItems((prev) => [...prev, newUpi]);
    setNewUpiId('');
    setNewUpiReceiver('');
    setShowAddUpiModal(false);
    Alert.alert('UPI Added', 'UPI address attached successfully.');
  };

  // Delete UPI handler
  const handleDeleteUpi = (id: string) => {
    Alert.alert('Delete UPI ID', 'Are you sure you want to remove this UPI address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setUpiItems((prev) => prev.filter((u) => u.id !== id));
          Alert.alert('Removed', 'UPI address has been removed.');
        },
      },
    ]);
  };

  // Add CA handler
  const handleAddCa = () => {
    if (!newCaName.trim() || !newCaPhone.trim()) {
      Alert.alert('Validation Error', 'Please provide Chartered Accountant Name and Phone Number.');
      return;
    }
    const newCa: CharteredAccountantItem = {
      id: `ca-${Date.now()}`,
      name: newCaName.trim(),
      email: newCaEmail.trim() || 'ca.advisor@taxpractice.in',
      phone: newCaPhone.trim(),
      chartered_type: newCaType || 'Certified Chartered Accountant',
    };
    setCaList((prev) => [...prev, newCa]);
    setNewCaName('');
    setNewCaEmail('');
    setNewCaPhone('');
    setNewCaType('Certified Chartered Accountant');
    setShowAddCaModal(false);
    Alert.alert('Advisor Linked', 'Chartered Accountant attached to your financial records.');
  };

  // Delete CA handler
  const handleDeleteCa = (id: string) => {
    Alert.alert(
      'Remove Chartered Accountant',
      'Are you sure you want to unlink this financial advisor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setCaList((prev) => prev.filter((c) => c.id !== id));
            Alert.alert('Removed', 'Chartered Accountant unlinked.');
          },
        },
      ]
    );
  };

  // Password change handler
  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please complete all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    Alert.alert('Password Changed', 'Your security password has been updated.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(false);
  };

  // Top bar header for sub-screens
  const renderTopBar = (title: string, onBack: () => void, rightAction?: React.ReactNode) => (
    <View style={styles.pinnedHeader}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.headerBackBtn}
        activeOpacity={0.7}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Feather name="arrow-left" size={20} color="#FFFFFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerRightAction}>{rightAction}</View>
    </View>
  );

  // -------------------------------------------------------------
  // 1. MASTER SETTINGS SCREEN (MAIN MENU)
  // Appearance & top hero tab deleted per user instruction
  // -------------------------------------------------------------
  if (currentScreen === 'main') {
    return (
      <View style={styles.rootWrapper}>
        <HomeBackgroundDecorations />
        <View style={styles.screenContainer}>
          {/* TOP PINNED APP BAR */}
          <View style={styles.pinnedHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.settingsHeaderIcon}>
                <Feather name="settings" size={20} color="#818EF8" />
              </View>
              <Text style={styles.headerTitle}>Settings</Text>
            </View>
            <TouchableOpacity
              onPress={() => setCurrentScreen('business_profile')}
              style={styles.profileAvatarBtn}
              activeOpacity={0.7}
              accessibilityLabel="View profile"
              accessibilityRole="button"
            >
              <Ionicons name="person-circle" size={32} color="#0A2558" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 90 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* CORE NAVIGATION GROUPED CARD (Starts directly without deleted hero & appearance tabs) */}
            <View style={styles.menuGroupCard}>
              {/* Account Info */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setCurrentScreen('account_info')}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIconBadge, { backgroundColor: '#E8F1FC' }]}>
                    <Feather name="user" size={18} color="#0047AB" />
                  </View>
                  <View>
                    <Text style={styles.menuLabel}>Account Info</Text>
                    <Text style={styles.menuSubtitle}>Bank accounts & UPI details</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
              <View style={styles.menuDivider} />

              {/* Change Password */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setShowPasswordModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIconBadge, { backgroundColor: '#EEF2FF' }]}>
                    <Feather name="lock" size={18} color="#4F46E5" />
                  </View>
                  <View>
                    <Text style={styles.menuLabel}>Change Password</Text>
                    <Text style={styles.menuSubtitle}>Update login security credentials</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
              <View style={styles.menuDivider} />

              {/* Notifications */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setShowNotificationsModal(true)}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIconBadge, { backgroundColor: '#FFF2E5' }]}>
                    <Feather name="bell" size={18} color="#FF6E00" />
                  </View>
                  <View>
                    <Text style={styles.menuLabel}>Notifications</Text>
                    <Text style={styles.menuSubtitle}>WhatsApp, SMS and invoice alerts</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
              <View style={styles.menuDivider} />

              {/* Subscription */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setCurrentScreen('subscription')}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIconBadge, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="card-outline" size={18} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.menuLabel}>Subscription</Text>
                    <Text style={styles.menuSubtitle}>License plan & recharge status</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
              <View style={styles.menuDivider} />

              {/* DSR Setting */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setCurrentScreen('dsr_setting')}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIconBadge, { backgroundColor: '#ECFDF5' }]}>
                    <Feather name="calendar" size={18} color="#059669" />
                  </View>
                  <View>
                    <Text style={styles.menuLabel}>DSR Setting</Text>
                    <Text style={styles.menuSubtitle}>Daily reports & auto-approvals</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
              <View style={styles.menuDivider} />

              {/* Finance Info (Chartered Accountant & Financial Details matching web) */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => setCurrentScreen('finance_info')}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIconBadge, { backgroundColor: '#FFF8E6' }]}>
                    <MaterialCommunityIcons name="wallet-outline" size={18} color="#D97706" />
                  </View>
                  <View>
                    <Text style={styles.menuLabel}>Finance Info</Text>
                    <Text style={styles.menuSubtitle}>Chartered Accountant (CA) & tax records</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
              <View style={styles.menuDivider} />

              {/* Update Available */}
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => Alert.alert('App Update', 'BTHAWK is up to date (v2.4.0).')}
                activeOpacity={0.7}
              >
                <View style={styles.menuRowLeft}>
                  <View style={[styles.menuIconBadge, { backgroundColor: '#EFF6FF' }]}>
                    <Feather name="download" size={18} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.menuLabel}>Update Available</Text>
                    <Text style={styles.menuSubtitle}>Version 2.4.0 • Up to date</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* TERMS & CONDITIONS CARD */}
            <TouchableOpacity
              style={styles.standaloneMenuCard}
              onPress={() => setShowTermsModal(true)}
              activeOpacity={0.75}
            >
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIconBadge, { backgroundColor: '#F1F5F9' }]}>
                  <Feather name="file-text" size={18} color="#475569" />
                </View>
                <Text style={styles.menuLabel}>Terms & Conditions</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>

            {/* LOGOUT CARD */}
            <TouchableOpacity
              style={styles.logoutCard}
              onPress={() => {
                Alert.alert('Sign Out', 'Are you sure you want to log out of BTHAWK?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Log Out', style: 'destructive', onPress: onLogout },
                ]);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuIconBadge, { backgroundColor: '#FEF2F2' }]}>
                  <Feather name="log-out" size={18} color="#DC2626" />
                </View>
                <Text style={styles.logoutText}>Logout</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#DC2626" />
            </TouchableOpacity>

            {/* VERSION INFO */}
            <Text style={styles.versionFooter}>
              BTHAWK Mobile Enterprise • Version 2.4.0 (Build 2026)
            </Text>
          </ScrollView>

          {/* RENDER POPUP MODALS */}
          {renderPasswordModal()}
          {renderNotificationsModal()}
          {renderTermsModal()}
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // 2. ACCOUNT INFO SCREEN (NO hardcoded demo data, Delete support)
  // -------------------------------------------------------------
  if (currentScreen === 'account_info') {
    return (
      <View style={styles.rootWrapper}>
        <HomeBackgroundDecorations />
        <View style={styles.screenContainer}>
          {renderTopBar('Account Info', () => setCurrentScreen('main'))}

          {/* SEGMENTED TABS: BANK ACCOUNT | UPI DETAILS */}
          <View style={styles.segmentedTabContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, accountTab === 'bank' && styles.segmentBtnActive]}
              onPress={() => setAccountTab('bank')}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.segmentText, accountTab === 'bank' && styles.segmentTextActive]}
              >
                Bank Account
              </Text>
              {accountTab === 'bank' && <View style={styles.segmentActiveGlow} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, accountTab === 'upi' && styles.segmentBtnActive]}
              onPress={() => setAccountTab('upi')}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.segmentText, accountTab === 'upi' && styles.segmentTextActive]}
              >
                UPI Details
              </Text>
              {accountTab === 'upi' && <View style={styles.segmentActiveGlow} />}
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 90 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {accountTab === 'bank' ? (
              <View>
                {bankAccounts.length === 0 ? (
                  <View style={styles.emptyAccountCard}>
                    <View style={styles.emptyIconCircle}>
                      <MaterialCommunityIcons name="bank-outline" size={32} color="#0047AB" />
                    </View>
                    <Text style={styles.emptyAccountTitle}>No Bank Accounts Added</Text>
                    <Text style={styles.emptyAccountSubtitle}>
                      Add your official business bank account to display account & IFSC details on your invoices.
                    </Text>
                  </View>
                ) : (
                  bankAccounts.map((b) => (
                    <View key={b.id} style={styles.bankCard}>
                      <View style={styles.bankHeaderRow}>
                        <View style={styles.bankTitleLeft}>
                          <View style={styles.bankIconCircle}>
                            <MaterialCommunityIcons name="bank" size={20} color="#0047AB" />
                          </View>
                          <Text style={styles.bankNameText}>{b.bankName}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteBank(b.id)}
                          style={styles.deleteActionBtn}
                          activeOpacity={0.7}
                          accessibilityLabel="Delete bank account"
                        >
                          <Feather name="trash-2" size={17} color="#DC2626" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.bankDetailBox}>
                        <Text style={styles.fieldHeading}>ACCOUNT NUMBER</Text>
                        <Text style={styles.accountNumberVal}>{b.accountNumber}</Text>

                        <View style={styles.ifscRow}>
                          <View>
                            <Text style={styles.fieldHeading}>IFSC CODE</Text>
                            <Text style={styles.ifscVal}>{b.ifscCode}</Text>
                          </View>
                          {b.isPrimary && (
                            <View style={styles.primaryBadge}>
                              <Ionicons name="checkmark-circle" size={14} color="#0047AB" />
                              <Text style={styles.primaryBadgeText}>Primary</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))
                )}

                <TouchableOpacity
                  style={styles.addBankBtn}
                  onPress={() => setShowAddBankModal(true)}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#0047AB', '#FF6E00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradientFill}
                  >
                    <Feather name="plus" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Add Bank Account</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {upiItems.length === 0 ? (
                  <View style={styles.emptyAccountCard}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: '#FFF2E5' }]}>
                      <Ionicons name="qr-code-outline" size={32} color="#FF6E00" />
                    </View>
                    <Text style={styles.emptyAccountTitle}>No UPI Accounts Added</Text>
                    <Text style={styles.emptyAccountSubtitle}>
                      Attach your business UPI ID (VPA) to enable instant customer QR payments on invoices.
                    </Text>
                  </View>
                ) : (
                  upiItems.map((u) => (
                    <View key={u.id} style={styles.bankCard}>
                      <View style={styles.bankHeaderRow}>
                        <View style={styles.bankTitleLeft}>
                          <View style={[styles.bankIconCircle, { backgroundColor: '#FFF2E5' }]}>
                            <Ionicons name="qr-code-outline" size={20} color="#FF6E00" />
                          </View>
                          <Text style={styles.bankNameText}>UPI VPA ID</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteUpi(u.id)}
                          style={styles.deleteActionBtn}
                          activeOpacity={0.7}
                          accessibilityLabel="Delete UPI"
                        >
                          <Feather name="trash-2" size={17} color="#DC2626" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.bankDetailBox}>
                        <Text style={styles.fieldHeading}>VPA ADDRESS</Text>
                        <Text style={styles.accountNumberVal}>{u.upiId}</Text>
                        <Text style={[styles.fieldHeading, { marginTop: 10 }]}>BENEFICIARY</Text>
                        <Text style={styles.ifscVal}>{u.receiverName}</Text>
                      </View>
                    </View>
                  ))
                )}

                <TouchableOpacity
                  style={styles.addBankBtn}
                  onPress={() => setShowAddUpiModal(true)}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#0047AB', '#FF6E00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradientFill}
                  >
                    <Feather name="plus" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Add UPI Details</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* ADD BANK MODAL */}
          <Modal
            visible={showAddBankModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowAddBankModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Add Bank Account</Text>
                  <TouchableOpacity onPress={() => setShowAddBankModal(false)}>
                    <Feather name="x" size={22} color="#0A2558" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Bank Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. State Bank of India"
                  placeholderTextColor="#94A3B8"
                  value={newBankName}
                  onChangeText={setNewBankName}
                />

                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 1973 8100 0050 22"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={newAccountNo}
                  onChangeText={setNewAccountNo}
                />

                <Text style={styles.inputLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. SBIN0001234"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={newIfsc}
                  onChangeText={setNewIfsc}
                />

                <TouchableOpacity
                  style={styles.submitModalBtn}
                  onPress={handleAddBank}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#0047AB', '#FF6E00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradientFill}
                  >
                    <Text style={styles.primaryBtnText}>Save Account</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ADD UPI MODAL */}
          <Modal
            visible={showAddUpiModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowAddUpiModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Add Business UPI ID</Text>
                  <TouchableOpacity onPress={() => setShowAddUpiModal(false)}>
                    <Feather name="x" size={22} color="#0A2558" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>UPI VPA ID</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. business@sbi"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  value={newUpiId}
                  onChangeText={setNewUpiId}
                />

                <Text style={styles.inputLabel}>Beneficiary / Payee Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Registered Firm / Owner Name"
                  placeholderTextColor="#94A3B8"
                  value={newUpiReceiver}
                  onChangeText={setNewUpiReceiver}
                />

                <TouchableOpacity
                  style={styles.submitModalBtn}
                  onPress={handleAddUpi}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#0047AB', '#FF6E00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradientFill}
                  >
                    <Text style={styles.primaryBtnText}>Save UPI Details</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // 3. FINANCE INFO SCREEN (Chartered Accountant / Advisor reference web)
  // -------------------------------------------------------------
  if (currentScreen === 'finance_info') {
    return (
      <View style={styles.rootWrapper}>
        <HomeBackgroundDecorations />
        <View style={styles.screenContainer}>
          {renderTopBar('Finance Info', () => setCurrentScreen('main'))}

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 90 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. FINANCIAL IDENTIFIERS OVERVIEW */}
            <View style={styles.menuGroupCard}>
              <View style={styles.financeHeaderRow}>
                <View style={[styles.menuIconBadge, { backgroundColor: '#E8F1FC' }]}>
                  <MaterialCommunityIcons name="finance" size={20} color="#0047AB" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Financial Identifiers</Text>
                  <Text style={styles.settingSub}>Tax filings & ledger reporting status</Text>
                </View>
              </View>

              <View style={styles.taxTwoColRow}>
                <View style={styles.taxCol}>
                  <Text style={styles.profileFieldLabel}>PAN NUMBER</Text>
                  <Text style={styles.taxVal}>{panNo}</Text>
                </View>
                <View style={styles.taxCol}>
                  <Text style={styles.profileFieldLabel}>GSTIN</Text>
                  <Text style={styles.taxVal}>{gstin}</Text>
                </View>
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.taxTwoColRow}>
                <View style={styles.taxCol}>
                  <Text style={styles.profileFieldLabel}>FINANCIAL YEAR</Text>
                  <Text style={styles.taxVal}>2026 - 2027</Text>
                </View>
                <View style={styles.taxCol}>
                  <Text style={styles.profileFieldLabel}>ACCOUNTING BASIS</Text>
                  <Text style={styles.taxVal}>Accrual (GST Standard)</Text>
                </View>
              </View>
            </View>

            {/* 2. CHARTERED ACCOUNTANT (CA) SECTION (Direct reference to web chartedaccount.tsx) */}
            <Text style={styles.sectionHeaderTitle}>CHARTERED ACCOUNTANTS & ADVISORS</Text>
            <Text style={styles.sectionSubDesc}>
              Link your certified CA or tax consultant to share tax registers, audit records, and sales ledgers.
            </Text>

            {caList.length === 0 ? (
              <View style={styles.emptyAccountCard}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="briefcase" size={30} color="#0047AB" />
                </View>
                <Text style={styles.emptyAccountTitle}>No Chartered Accountant Linked</Text>
                <Text style={styles.emptyAccountSubtitle}>
                  Attach your CA or tax consultant to streamline GST returns, audit books, and automated reconciliation reports.
                </Text>
              </View>
            ) : (
              caList.map((ca) => (
                <View key={ca.id} style={styles.bankCard}>
                  <View style={styles.bankHeaderRow}>
                    <View style={styles.bankTitleLeft}>
                      <View style={[styles.bankIconCircle, { backgroundColor: '#E8F1FC' }]}>
                        <Feather name="user-check" size={20} color="#0047AB" />
                      </View>
                      <View>
                        <Text style={styles.bankNameText}>{ca.name}</Text>
                        <View style={styles.caTypeBadge}>
                          <Text style={styles.caTypeBadgeText}>{ca.chartered_type}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteCa(ca.id)}
                      style={styles.deleteActionBtn}
                      activeOpacity={0.7}
                      accessibilityLabel="Remove CA"
                    >
                      <Feather name="trash-2" size={17} color="#DC2626" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.bankDetailBox}>
                    <View style={styles.caInfoLine}>
                      <Feather name="mail" size={14} color="#0047AB" />
                      <Text style={styles.caInfoText}>{ca.email}</Text>
                    </View>
                    <View style={[styles.caInfoLine, { marginTop: 6 }]}>
                      <Feather name="phone" size={14} color="#0047AB" />
                      <Text style={styles.caInfoText}>{ca.phone}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}

            {/* ADD CA BUTTON */}
            <TouchableOpacity
              style={styles.addBankBtn}
              onPress={() => setShowAddCaModal(true)}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#0047AB', '#FF6E00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradientFill}
              >
                <Feather name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Add Chartered Accountant</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>

          {/* ADD CA MODAL */}
          <Modal
            visible={showAddCaModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowAddCaModal(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Add Chartered Accountant</Text>
                  <TouchableOpacity onPress={() => setShowAddCaModal(false)}>
                    <Feather name="x" size={22} color="#0A2558" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>CA / Advisor Full Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. CA Rajesh Sharma"
                  placeholderTextColor="#94A3B8"
                  value={newCaName}
                  onChangeText={setNewCaName}
                />

                <Text style={styles.inputLabel}>Official Email Address</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. advisor@taxconsulting.in"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newCaEmail}
                  onChangeText={setNewCaEmail}
                />

                <Text style={styles.inputLabel}>Mobile / Contact Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={newCaPhone}
                  onChangeText={setNewCaPhone}
                />

                <Text style={styles.inputLabel}>Designation / Role</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Certified Chartered Accountant"
                  placeholderTextColor="#94A3B8"
                  value={newCaType}
                  onChangeText={setNewCaType}
                />

                <TouchableOpacity
                  style={styles.submitModalBtn}
                  onPress={handleAddCa}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={['#0047AB', '#FF6E00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradientFill}
                  >
                    <Text style={styles.primaryBtnText}>Attach CA Advisor</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // 4A. SUBSCRIPTION SCREEN (Matching user screenshot media_1793467130860_2f18f909.png)
  // -------------------------------------------------------------
  if (currentScreen === 'subscription') {
    const rawRenewDate =
      renewalDetails?.renew_date ||
      (user?.distributor_renewal_datetime
        ? String(user.distributor_renewal_datetime).slice(0, 10)
        : '2026-11-04');
    const activeRenewDate = formatReadable(rawRenewDate);

    return (
      <View style={styles.rootWrapper}>
        <HomeBackgroundDecorations />
        <View style={styles.screenContainer}>
          {renderTopBar('Subscription', () => setCurrentScreen('main'))}

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 90 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* SUBSCRIPTION HISTORY CARD */}
            <View style={styles.subHistoryBannerCard}>
              <View style={styles.subHistoryHeaderRow}>
                <View style={styles.subCardIconBox}>
                  <Ionicons name="card-outline" size={22} color="#0047AB" />
                </View>
                <Text style={styles.subCardTitle}>Subscription history</Text>
              </View>

              <Text style={styles.subCardSubtitle}>
                Please recharge till <Text style={{ fontWeight: '700', color: '#0A2558' }}>{activeRenewDate}</Text> to continue with our services.
              </Text>

              <TouchableOpacity
                style={styles.renewNowGreenBtn}
                onPress={() => setCurrentScreen('renewal')}
                activeOpacity={0.88}
                accessibilityLabel="Renew now"
              >
                <Text style={styles.renewNowGreenBtnText}>Renew now</Text>
              </TouchableOpacity>
            </View>

            {/* TRANSACTIONS SECTION */}
            {isLoadingSubHistory ? (
              <View style={[styles.subEmptyTransactionsBox, { paddingVertical: 36 }]}>
                <ActivityIndicator size="large" color="#0047AB" />
                <Text style={[styles.subEmptySubtitle, { marginTop: 12 }]}>
                  Loading transaction history...
                </Text>
              </View>
            ) : subscriptionHistory.length > 0 ? (
              <View style={{ gap: 12 }}>
                <Text style={styles.sectionHeaderTitle}>SUBSCRIPTION HISTORY</Text>
                {subscriptionHistory.map((item, idx) => {
                  const isSuccess = String(item.txn_status).toLowerCase() === 'success';
                  return (
                    <View key={String(item.txn_id || idx)} style={styles.subTxnCard}>
                      <View style={styles.subTxnTopRow}>
                        <View style={styles.subTxnLeftGroup}>
                          <View
                            style={[
                              styles.subTxnIconCircle,
                              { backgroundColor: isSuccess ? '#ECFDF5' : '#FEF2F2' },
                            ]}
                          >
                            <Ionicons
                              name={isSuccess ? 'checkmark-circle' : 'alert-circle'}
                              size={20}
                              color={isSuccess ? '#059669' : '#DC2626'}
                            />
                          </View>
                          <View>
                            <Text style={styles.subTxnIdText}>
                              {item.bt_txn_id || item.transaction_id || `TXN #${item.txn_id}`}
                            </Text>
                            <Text style={styles.subTxnDateText}>
                              {formatReadable(item.transaction_date)}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.subTxnStatusBadge,
                            { backgroundColor: isSuccess ? '#ECFDF5' : '#FEF2F2' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.subTxnStatusText,
                              { color: isSuccess ? '#059669' : '#DC2626' },
                            ]}
                          >
                            {item.txn_status || 'Success'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.subTxnDivider} />

                      <View style={styles.subTxnBottomRow}>
                        <View>
                          <Text style={styles.subTxnTypeLabel}>Plan / Type</Text>
                          <Text style={styles.subTxnTypeVal}>
                            {item.txn_type || 'Subscription Renew'}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.subTxnTypeLabel}>Amount Paid</Text>
                          <Text style={styles.subTxnAmountVal}>
                            ₹{Number(item.transaction_amount || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.subEmptyTransactionsBox}>
                <View style={styles.subReceiptCircle}>
                  <Ionicons name="receipt-outline" size={32} color="#0047AB" />
                </View>
                <Text style={styles.subEmptyTitle}>No transactions yet</Text>
                <Text style={styles.subEmptySubtitle}>
                  Your subscription history will appear here once you renew.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // 4B. RENEWAL SCREEN (Matching user screenshots media_1793467139121_059b0af3.png & media_1793467292690_b5d9da6a.png)
  // -------------------------------------------------------------
  if (currentScreen === 'renewal') {
    const rawRenewDate =
      renewalDetails?.renew_date ||
      (user?.distributor_renewal_datetime
        ? String(user.distributor_renewal_datetime).slice(0, 10)
        : '2026-11-04');
    const displayRenewDate = formatReadable(rawRenewDate);
    const displayDistributor =
      renewalDetails?.distributor_name || ownerName || 'ganesh traders';
    const displayEmail = renewalDetails?.distributor_email || email || 'g@gmail.com';
    const displayPhone = renewalDetails?.phone_no || phone || '6789000009';

    const plansToDisplay: SubscriptionPlanItem[] =
      renewalDetails?.renewal_plans && renewalDetails.renewal_plans.length > 0
        ? renewalDetails.renewal_plans.map((p) => ({
            id: String(p.id),
            name: p.name,
            coverage: `${p.months} months coverage`,
            price: p.price,
            originalPrice: p.originalPrice || p.price + 500,
            validity: `${p.months} months validity`,
            multiplier: `Multiplier x${p.multiplier}`,
            isPopular: Boolean(p.popular),
            features:
              p.name === 'Starter'
                ? ['All core features included', 'GST & E-Way Billing', 'Inventory tracking']
                : p.name === 'Growth'
                ? [
                    'All features included',
                    'Priority Cloud Backup',
                    'DSR Automated Reports',
                    'Dedicated Tax Advisor',
                  ]
                : p.name === 'Business'
                ? [
                    'All features included',
                    'Multi-device synchronization',
                    'Advanced financial analytics',
                    'VIP SLA support',
                  ]
                : [
                    'Uncapped multi-user seats',
                    'Full API & ERP Integration',
                    'Custom invoice branding',
                    '24/7 dedicated support',
                  ],
          }))
        : SUBSCRIPTION_PLANS;

    return (
      <View style={styles.rootWrapper}>
        <HomeBackgroundDecorations />
        <View style={styles.screenContainer}>
          {renderTopBar('Renewal', () => setCurrentScreen('subscription'))}

          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 90 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* PILL BADGE: Subscription Management */}
            <View style={styles.centerBadgeRow}>
              <View style={styles.subscriptionPillBadge}>
                <Text style={styles.subscriptionPillText}>Subscription Management</Text>
              </View>
            </View>

            {/* TITLE */}
            <Text style={styles.renewalHeroTitle}>
              Renew Your <Text style={styles.renewalBrandAccent}>BTHAWK</Text> Experience
            </Text>

            {/* EXPIRY WARNING BANNER */}
            <View style={styles.expiryAlertCard}>
              <View style={styles.alertRedDot} />
              <Text style={styles.expiryAlertText}>
                Your license expired on <Text style={styles.boldRedText}>{displayRenewDate}</Text>.
                Choose a plan to continue.
              </Text>
            </View>

            {/* 4 INFO TILES (2x2 GRID) */}
            <View style={styles.infoTilesGrid}>
              <View style={styles.infoTile}>
                <View style={[styles.tileIconBox, { backgroundColor: '#E8F1FC' }]}>
                  <Feather name="user" size={16} color="#0047AB" />
                </View>
                <View style={styles.tileTextBox}>
                  <Text style={styles.tileLabel}>DISTRIBUTOR</Text>
                  <Text style={styles.tileVal} numberOfLines={1}>
                    {displayDistributor}
                  </Text>
                </View>
              </View>

              <View style={styles.infoTile}>
                <View style={[styles.tileIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Feather name="mail" size={16} color="#4F46E5" />
                </View>
                <View style={styles.tileTextBox}>
                  <Text style={styles.tileLabel}>EMAIL</Text>
                  <Text style={styles.tileVal} numberOfLines={1}>
                    {displayEmail}
                  </Text>
                </View>
              </View>

              <View style={styles.infoTile}>
                <View style={[styles.tileIconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Feather name="calendar" size={16} color="#0284C7" />
                </View>
                <View style={styles.tileTextBox}>
                  <Text style={styles.tileLabel}>DEADLINE</Text>
                  <Text style={styles.tileVal} numberOfLines={1}>
                    {displayRenewDate}
                  </Text>
                </View>
              </View>

              <View style={styles.infoTile}>
                <View style={[styles.tileIconBox, { backgroundColor: '#FFF2E5' }]}>
                  <Feather name="headphones" size={16} color="#FF6E00" />
                </View>
                <View style={styles.tileTextBox}>
                  <Text style={styles.tileLabel}>SUPPORT</Text>
                  <Text style={styles.tileVal} numberOfLines={1}>
                    {displayPhone}
                  </Text>
                </View>
              </View>
            </View>

            {/* SUBSCRIPTION PLANS LIST */}
            {plansToDisplay.map((plan: SubscriptionPlanItem) => {
              const isGrowth = Boolean(plan.isPopular);
              return (
                <View
                  key={plan.id}
                  style={[
                    styles.planPricingCard,
                    isGrowth && styles.planPricingCardPopular,
                  ]}
                >
                  {isGrowth && (
                    <View style={styles.popularRibbon}>
                      <Text style={styles.popularRibbonText}>MOST POPULAR</Text>
                    </View>
                  )}

                  <View style={styles.planHeaderRow}>
                    <View style={styles.planNameGroup}>
                      <View
                        style={[
                          styles.planIconBadge,
                          isGrowth
                            ? { backgroundColor: '#0047AB' }
                            : { backgroundColor: '#E8F1FC' },
                        ]}
                      >
                        <Ionicons
                          name={isGrowth ? 'star' : 'calendar'}
                          size={18}
                          color={isGrowth ? '#FFFFFF' : '#0047AB'}
                        />
                      </View>
                      <View>
                        <Text style={styles.planCardName}>{plan.name}</Text>
                        <Text style={styles.planCoverageSub}>{plan.coverage}</Text>
                      </View>
                    </View>

                    <View style={styles.planPriceGroup}>
                      <Text style={styles.planPriceMain}>₹{plan.price.toLocaleString('en-IN')}</Text>
                      {plan.originalPrice && (
                        <Text style={styles.planPriceStrike}>
                          ₹{plan.originalPrice.toLocaleString('en-IN')}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.planDivider} />

                  <View style={styles.featuresList}>
                    <View style={styles.featureItemRow}>
                      <Ionicons name="checkmark" size={15} color="#0047AB" />
                      <Text style={styles.featureItemText}>{plan.validity}</Text>
                    </View>
                    <View style={styles.featureItemRow}>
                      <Ionicons name="checkmark" size={15} color="#0047AB" />
                      <Text style={styles.featureItemText}>{plan.multiplier}</Text>
                    </View>
                    {plan.features.map((feat, idx) => (
                      <View key={idx} style={styles.featureItemRow}>
                        <Ionicons name="checkmark" size={15} color="#0047AB" />
                        <Text style={styles.featureItemText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  {/* BUTTON: Growth has filled gradient button, others have clean outlined button */}
                  {isGrowth ? (
                    <TouchableOpacity
                      style={styles.getStartedPlanBtn}
                      onPress={() => handleSelectPlan(plan)}
                      activeOpacity={0.88}
                    >
                      <LinearGradient
                        colors={['#0047AB', '#FF6E00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.planActionGradient}
                      >
                        <Text style={styles.planActionText}>Get Started</Text>
                        <Feather name="arrow-right" size={16} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.plainPlanBtn}
                      onPress={() => handleSelectPlan(plan)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.plainPlanBtnText}>Get Started</Text>
                      <Feather name="arrow-right" size={16} color="#0A2558" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* PLAN CHECKOUT & SECURE GATEWAY MODALS */}
          {renderCheckoutModal()}
          {renderRazorpayGatewayModal()}
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // 5. DSR SETTING SCREEN
  // -------------------------------------------------------------
  if (currentScreen === 'dsr_setting') {
    return (
      <View style={styles.rootWrapper}>
        <HomeBackgroundDecorations />
        <View style={styles.screenContainer}>
          {renderTopBar('DSR Setting', () => setCurrentScreen('main'))}

          {isLoadingDsr ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0047AB" />
              <Text style={styles.loadingText}>Loading DSR settings...</Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 100 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. DSR DAYS & REFILL NUMBER INPUTS */}
              <View style={styles.menuGroupCard}>
                <View style={styles.inputSettingRow}>
                  <View style={styles.settingTextGroup}>
                    <Text style={styles.settingTitle}>DSR Pending Days</Text>
                    <Text style={styles.settingSub}>
                      Days before a transaction is flagged as overdue (1 to 7 days)
                    </Text>
                  </View>
                  <TextInput
                    style={styles.numberInputPill}
                    keyboardType="number-pad"
                    value={String(dsrSettings.dsrPendingDays)}
                    maxLength={1}
                    onChangeText={(val) => {
                      const num = parseInt(val, 10);
                      setDsrSettings((prev) => ({
                        ...prev,
                        dsrPendingDays: isNaN(num) ? 1 : Math.min(7, Math.max(1, num)),
                      }));
                    }}
                  />
                </View>

                <View style={styles.menuDivider} />

                <View style={styles.inputSettingRow}>
                  <View style={styles.settingTextGroup}>
                    <Text style={styles.settingTitle}>Autorefill Pending Txn Show</Text>
                    <Text style={styles.settingSub}>
                      Pending transactions preloaded on screen
                    </Text>
                  </View>
                  <TextInput
                    style={styles.numberInputPill}
                    keyboardType="numeric"
                    value={String(dsrSettings.pending_autorefill_txn)}
                    onChangeText={(val) =>
                      setDsrSettings((prev) => ({
                        ...prev,
                        pending_autorefill_txn: Math.max(0, parseInt(val, 10) || 0),
                      }))
                    }
                  />
                </View>
              </View>

              {/* 2. DSR PERMISSION TOGGLES */}
              <View style={styles.menuGroupCard}>
                <View style={styles.toggleSettingRow}>
                  <View style={styles.settingTextGroup}>
                    <Text style={styles.settingTitle}>DSR Allowed</Text>
                    <Text style={styles.settingSub}>Enable daily sales report generation</Text>
                  </View>
                  <Switch
                    value={dsrSettings.dsr_allowed === 'Yes'}
                    onValueChange={(v) =>
                      setDsrSettings((prev) => ({ ...prev, dsr_allowed: v ? 'Yes' : 'No' }))
                    }
                    trackColor={{ false: '#DFE7F2', true: '#0047AB' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={styles.menuDivider} />

                <View style={styles.toggleSettingRow}>
                  <View style={styles.settingTextGroup}>
                    <Text style={styles.settingTitle}>Stock Request Allow</Text>
                    <Text style={styles.settingSub}>Permit stock requests after day end</Text>
                  </View>
                  <Switch
                    value={dsrSettings.stockRequestAllowed === 'Yes'}
                    onValueChange={(v) =>
                      setDsrSettings((prev) => ({ ...prev, stockRequestAllowed: v ? 'Yes' : 'No' }))
                    }
                    trackColor={{ false: '#DFE7F2', true: '#0047AB' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={styles.menuDivider} />

                <View style={styles.toggleSettingRow}>
                  <View style={styles.settingTextGroup}>
                    <Text style={styles.settingTitle}>Credit Sale Allow</Text>
                    <Text style={styles.settingSub}>Allow credit sales after day end</Text>
                  </View>
                  <Switch
                    value={dsrSettings.creditSaleAllowed === 'Yes'}
                    onValueChange={(v) =>
                      setDsrSettings((prev) => ({ ...prev, creditSaleAllowed: v ? 'Yes' : 'No' }))
                    }
                    trackColor={{ false: '#DFE7F2', true: '#0047AB' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={styles.menuDivider} />

                <View style={styles.toggleSettingRow}>
                  <View style={styles.settingTextGroup}>
                    <Text style={styles.settingTitle}>DSR Auto Approval</Text>
                    <Text style={styles.settingSub}>
                      Skip manual review, auto-approve DSR on server
                    </Text>
                  </View>
                  <Switch
                    value={dsrSettings.dsr_auto_approve === 'Yes'}
                    onValueChange={(v) =>
                      setDsrSettings((prev) => ({ ...prev, dsr_auto_approve: v ? 'Yes' : 'No' }))
                    }
                    trackColor={{ false: '#DFE7F2', true: '#0047AB' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={styles.menuDivider} />

                <View style={styles.toggleSettingRow}>
                  <View style={styles.settingTextGroup}>
                    <Text style={styles.settingTitle}>Paid / Unpaid Watermark</Text>
                    <Text style={styles.settingSub}>Display watermark stamp on invoice</Text>
                  </View>
                  <Switch
                    value={dsrSettings.Mode_watermark === 'Yes'}
                    onValueChange={(v) =>
                      setDsrSettings((prev) => ({ ...prev, Mode_watermark: v ? 'Yes' : 'No' }))
                    }
                    trackColor={{ false: '#DFE7F2', true: '#0047AB' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={styles.menuDivider} />

                <View style={styles.toggleSettingRow}>
                  <View style={styles.settingTextGroup}>
                    <Text style={styles.settingTitle}>Quotation Invoice Allow to Generate</Text>
                    <Text style={styles.settingSub}>Allow quotation invoices to be generated</Text>
                  </View>
                  <Switch
                    value={dsrSettings.performaApplicable === 'Yes'}
                    onValueChange={(v) =>
                      setDsrSettings((prev) => ({ ...prev, performaApplicable: v ? 'Yes' : 'No' }))
                    }
                    trackColor={{ false: '#DFE7F2', true: '#0047AB' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={styles.menuDivider} />

                <View style={styles.toggleSettingRow}>
                  <View style={styles.settingTextGroup}>
                    <Text style={styles.settingTitle}>Negative Billing Allow</Text>
                    <Text style={styles.settingSub}>Allow inventory to go into negative billing</Text>
                  </View>
                  <Switch
                    value={dsrSettings.negativeBilling === 'Yes'}
                    onValueChange={(v) =>
                      setDsrSettings((prev) => ({ ...prev, negativeBilling: v ? 'Yes' : 'No' }))
                    }
                    trackColor={{ false: '#DFE7F2', true: '#0047AB' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* 3. FOS BILL CANCEL TABLE */}
              <View style={styles.menuGroupCard}>
                <View style={styles.fosHeaderGroup}>
                  <View style={[styles.menuIconBadge, { backgroundColor: '#E8F1FC' }]}>
                    <Feather name="users" size={18} color="#0047AB" />
                  </View>
                  <View>
                    <Text style={styles.settingTitle}>FOS BILL CANCEL</Text>
                    <Text style={styles.settingSub}>Allow specific FOS users to cancel bills</Text>
                  </View>
                </View>

                <View style={styles.fosTable}>
                  <View style={styles.fosTableHeader}>
                    <Text style={[styles.fosColHeader, { flex: 1.5 }]}>User Name</Text>
                    <Text style={[styles.fosColHeader, { flex: 1.5 }]}>Phone No</Text>
                    <Text style={[styles.fosColHeader, { width: 50, textAlign: 'center' }]}>Allow</Text>
                  </View>

                  {(dsrSettings.users_data || []).map((u) => {
                    const isChecked = u.billcancelSetting === 'Yes';
                    const userPhone = u.phoneNo || u.userPhone || '—';
                    return (
                      <TouchableOpacity
                        key={String(u.userId)}
                        style={styles.fosTableRow}
                        onPress={() => {
                          setDsrSettings((prev) => ({
                            ...prev,
                            users_data: prev.users_data.map((item) =>
                              String(item.userId) === String(u.userId)
                                ? {
                                    ...item,
                                    billcancelSetting:
                                      item.billcancelSetting === 'Yes' ? 'No' : 'Yes',
                                  }
                                : item
                            ),
                          }));
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.fosCellText, { flex: 1.5, fontWeight: '700' }]}>
                          {u.userName}
                        </Text>
                        <Text style={[styles.fosCellText, { flex: 1.5, color: '#5A6B87' }]}>
                          {userPhone}
                        </Text>
                        <View style={{ width: 50, alignItems: 'center' }}>
                          <View style={[styles.checkboxBox, isChecked && styles.checkboxActive]}>
                            {isChecked && <Feather name="check" size={13} color="#FFFFFF" />}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* PINNED UPDATE SETTING BUTTON */}
              <TouchableOpacity
                style={styles.updateDsrBtn}
                onPress={handleSaveDsr}
                disabled={isUpdatingDsr}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#0047AB', '#FF6E00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradientFill}
                >
                  <Text style={styles.primaryBtnText}>
                    {isUpdatingDsr ? 'Updating Settings...' : 'Update Setting'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // 6. BUSINESS PROFILE SCREEN
  // -------------------------------------------------------------
  return (
    <View style={styles.rootWrapper}>
      <HomeBackgroundDecorations />
      <View style={styles.screenContainer}>
        {renderTopBar(
          'Business Profile',
          () => setCurrentScreen('main'),
          <TouchableOpacity
            onPress={handleOpenEditProfile}
            style={styles.editPencilBtn}
            activeOpacity={0.7}
            accessibilityLabel="Edit profile"
            accessibilityRole="button"
          >
            <Feather name="edit-2" size={18} color="#0047AB" />
          </TouchableOpacity>
        )}

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* SECTION 1: BUSINESS INFORMATION */}
          <Text style={styles.sectionHeaderTitle}>BUSINESS INFORMATION</Text>
          <View style={styles.menuGroupCard}>
            <View style={styles.profileRowItem}>
              <View style={[styles.menuIconBadge, { backgroundColor: '#E8F1FC' }]}>
                <MaterialCommunityIcons name="office-building" size={18} color="#0047AB" />
              </View>
              <View style={styles.profileFieldTextGroup}>
                <Text style={styles.profileFieldLabel}>FIRM NAME</Text>
                <Text style={styles.profileFieldVal}>{firmName}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.profileRowItem}>
              <View style={[styles.menuIconBadge, { backgroundColor: '#EEF2FF' }]}>
                <Feather name="truck" size={18} color="#4F46E5" />
              </View>
              <View style={styles.profileFieldTextGroup}>
                <Text style={styles.profileFieldLabel}>TRADE NAME</Text>
                <Text style={styles.profileFieldVal}>{tradeName}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.profileRowItem}>
              <View style={[styles.menuIconBadge, { backgroundColor: '#E0F2FE' }]}>
                <Feather name="mail" size={18} color="#0284C7" />
              </View>
              <View style={styles.profileFieldTextGroup}>
                <Text style={styles.profileFieldLabel}>REGISTERED EMAIL</Text>
                <Text style={styles.profileFieldVal}>{email}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.profileRowItem}>
              <View style={[styles.menuIconBadge, { backgroundColor: '#ECFDF5' }]}>
                <Feather name="phone" size={18} color="#059669" />
              </View>
              <View style={styles.profileFieldTextGroup}>
                <Text style={styles.profileFieldLabel}>MOBILE NO</Text>
                <Text style={styles.profileFieldVal}>{phone}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.profileRowItem}>
              <View style={[styles.menuIconBadge, { backgroundColor: '#F0FDF4' }]}>
                <Feather name="phone-call" size={18} color="#16A34A" />
              </View>
              <View style={styles.profileFieldTextGroup}>
                <Text style={styles.profileFieldLabel}>SECONDARY NO</Text>
                <Text style={styles.profileFieldVal}>{secondaryPhone}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.profileRowItem}>
              <View style={[styles.menuIconBadge, { backgroundColor: '#FFF2E5' }]}>
                <MaterialCommunityIcons name="briefcase-outline" size={18} color="#FF6E00" />
              </View>
              <View style={styles.profileFieldTextGroup}>
                <Text style={styles.profileFieldLabel}>BUSINESS TYPE</Text>
                <Text style={styles.profileFieldVal}>{businessType}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.profileRowItem}>
              <View style={[styles.menuIconBadge, { backgroundColor: '#FFF8E6' }]}>
                <Feather name="users" size={18} color="#D97706" />
              </View>
              <View style={styles.profileFieldTextGroup}>
                <Text style={styles.profileFieldLabel}>CATEGORY</Text>
                <Text style={styles.profileFieldVal}>{category}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.profileRowItem}>
              <View style={[styles.menuIconBadge, { backgroundColor: '#EFF6FF' }]}>
                <Feather name="calendar" size={18} color="#0047AB" />
              </View>
              <View style={styles.profileFieldTextGroup}>
                <Text style={styles.profileFieldLabel}>RENEW DATE</Text>
                <Text style={styles.profileFieldVal}>{renewalDate}</Text>
              </View>
            </View>
          </View>

          {/* SECTION 2: TAX & REGISTRATIONS */}
          <Text style={styles.sectionHeaderTitle}>TAX & REGISTRATIONS</Text>
          <View style={styles.menuGroupCard}>
            <View style={styles.taxTwoColRow}>
              <View style={styles.taxCol}>
                <Text style={styles.profileFieldLabel}>PAN NO</Text>
                <Text style={styles.taxVal}>{panNo}</Text>
              </View>
              <View style={styles.taxCol}>
                <Text style={styles.profileFieldLabel}>GSTIN</Text>
                <Text style={styles.taxVal}>{gstin}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.taxTwoColRow}>
              <View style={styles.taxCol}>
                <Text style={styles.profileFieldLabel}>UDYAM REG.</Text>
                <Text style={styles.taxVal}>{udyamReg}</Text>
              </View>
              <View style={styles.taxCol}>
                <Text style={styles.profileFieldLabel}>DLN NO.</Text>
                <Text style={styles.taxVal}>{dlnNo}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.taxTwoColRow}>
              <View style={styles.taxCol}>
                <Text style={styles.profileFieldLabel}>GST USERNAME</Text>
                <Text style={styles.taxVal}>{gstUsername}</Text>
              </View>
              <View style={styles.taxCol}>
                <Text style={styles.profileFieldLabel}>ITR USERNAME</Text>
                <Text style={styles.taxVal}>{itrUsername}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.profileRowItem}>
              <View style={styles.profileFieldTextGroup}>
                <Text style={styles.profileFieldLabel}>TCS APPLICABLE</Text>
                <Text style={styles.taxVal}>{tcsApplicable}</Text>
              </View>
            </View>
          </View>

          {/* SECTION 3: LOCATION INFORMATION */}
          <Text style={styles.sectionHeaderTitle}>LOCATION INFORMATION</Text>
          <View style={styles.menuGroupCard}>
            <View style={styles.taxTwoColRow}>
              <View style={styles.taxCol}>
                <Text style={styles.profileFieldLabel}>SUPPLY PLACE</Text>
                <Text style={styles.taxVal}>{placeOfSupply}</Text>
              </View>
              <View style={styles.taxCol}>
                <Text style={styles.profileFieldLabel}>COUNTRY</Text>
                <Text style={styles.taxVal}>{country}</Text>
              </View>
            </View>
            <View style={styles.menuDivider} />

            <View style={styles.profileRowItem}>
              <View style={styles.profileFieldTextGroup}>
                <Text style={styles.profileFieldLabel}>PHYSICAL ADDRESS</Text>
                <Text style={styles.taxVal}>{address}</Text>
              </View>
            </View>
          </View>

          {/* EDIT BUSINESS DETAILS ACTION BUTTON */}
          <TouchableOpacity
            style={styles.editProfileBannerBtn}
            onPress={handleOpenEditProfile}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#0047AB', '#FF6E00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradientFill}
            >
              <Feather name="edit-3" size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Edit Business Details</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* EDIT PROFILE MODAL */}
        <Modal
          visible={showEditProfileModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditProfileModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { maxHeight: '88%' }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.editIconCircle}>
                    <Feather name="edit-2" size={16} color="#0047AB" />
                  </View>
                  <Text style={styles.modalTitle}>Edit Business Info</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <Feather name="x" size={22} color="#0A2558" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <Text style={styles.editGroupHeader}>BUSINESS PARTICULARS</Text>

                <Text style={styles.inputLabel}>Firm Legal Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editFirmName}
                  onChangeText={setEditFirmName}
                  placeholder="Firm Name"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.inputLabel}>Trade Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editTradeName}
                  onChangeText={setEditTradeName}
                  placeholder="Trade Name"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.inputLabel}>Registered Email</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="official@domain.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Official Mobile</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="10-digit number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Secondary Mobile</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editSecondaryPhone}
                  onChangeText={setEditSecondaryPhone}
                  placeholder="Secondary mobile"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />

                <Text style={styles.editGroupHeader}>TAX & REGISTRATIONS</Text>

                <Text style={styles.inputLabel}>PAN Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPanNo}
                  onChangeText={setEditPanNo}
                  placeholder="10-character PAN"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />

                <Text style={styles.inputLabel}>GSTIN</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editGstin}
                  onChangeText={setEditGstin}
                  placeholder="15-character GSTIN"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />

                <Text style={styles.editGroupHeader}>LOCATION DETAILS</Text>

                <Text style={styles.inputLabel}>Supply Place (State)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPlaceOfSupply}
                  onChangeText={setEditPlaceOfSupply}
                  placeholder="State name"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.inputLabel}>Physical Address</Text>
                <TextInput
                  style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                  value={editAddress}
                  onChangeText={setEditAddress}
                  placeholder="Full business street address"
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </ScrollView>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleSaveProfile}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#0047AB', '#FF6E00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradientFill}
                >
                  <Text style={styles.primaryBtnText}>Save Profile Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );

  // -------------------------------------------------------------
  // HELPER MODALS
  // -------------------------------------------------------------
  function renderPasswordModal() {
    return (
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Feather name="x" size={22} color="#0A2558" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry={!showPasswordText}
              placeholder="Enter current password"
              placeholderTextColor="#94A3B8"
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry={!showPasswordText}
              placeholder="Minimum 6 characters"
              placeholderTextColor="#94A3B8"
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry={!showPasswordText}
              placeholder="Re-enter new password"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={styles.showPassToggle}
              onPress={() => setShowPasswordText(!showPasswordText)}
            >
              <Feather
                name={showPasswordText ? 'eye-off' : 'eye'}
                size={16}
                color="#0047AB"
              />
              <Text style={styles.showPassText}>
                {showPasswordText ? 'Hide password' : 'Show password'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleChangePassword}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#0047AB', '#FF6E00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradientFill}
              >
                <Text style={styles.primaryBtnText}>Update Password</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  function renderNotificationsModal() {
    return (
      <Modal
        visible={showNotificationsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Notification Preferences</Text>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                <Feather name="x" size={22} color="#0A2558" />
              </TouchableOpacity>
            </View>

            <View style={styles.notificationPrefRow}>
              <View>
                <Text style={styles.settingTitle}>Invoice Alerts</Text>
                <Text style={styles.settingSub}>Push alert when new invoices are filed</Text>
              </View>
              <Switch
                value={notifyInvoice}
                onValueChange={setNotifyInvoice}
                trackColor={{ false: '#DFE7F2', true: '#0047AB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.menuDivider} />

            <View style={styles.notificationPrefRow}>
              <View>
                <Text style={styles.settingTitle}>WhatsApp Summaries</Text>
                <Text style={styles.settingSub}>Daily collections and outstanding reports</Text>
              </View>
              <Switch
                value={notifyWhatsapp}
                onValueChange={setNotifyWhatsapp}
                trackColor={{ false: '#DFE7F2', true: '#0047AB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.menuDivider} />

            <View style={styles.notificationPrefRow}>
              <View>
                <Text style={styles.settingTitle}>Payment Reminders</Text>
                <Text style={styles.settingSub}>Automated reminders for pending balances</Text>
              </View>
              <Switch
                value={notifyPayment}
                onValueChange={setNotifyPayment}
                trackColor={{ false: '#DFE7F2', true: '#0047AB' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={() => {
                setShowNotificationsModal(false);
                Alert.alert('Preferences Saved', 'Notification preferences updated.');
              }}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#0047AB', '#FF6E00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradientFill}
              >
                <Text style={styles.primaryBtnText}>Save Preferences</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  function renderTermsModal() {
    return (
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Feather name="x" size={22} color="#0A2558" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: 10 }}>
              <Text style={styles.termsText}>
                Welcome to BTHAWK Enterprise Billing and Distribution System.{'\n\n'}
                1. Account Security: You are responsible for safeguarding your credentials and any activity conducted under your account.{'\n\n'}
                2. Data Integrity: GSTIN, PAN, and Tax invoice data uploaded through BTHAWK is synced securely with certified e-Invoice & e-Way bill portals.{'\n\n'}
                3. License & Renewals: Software services and cloud synchronization are active per selected duration. Plan renewal ensures zero service interruptions.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.submitModalBtn, { marginTop: 16 }]}
              onPress={() => setShowTermsModal(false)}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#0047AB', '#FF6E00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradientFill}
              >
                <Text style={styles.primaryBtnText}>I Understand</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  function renderCheckoutModal() {
    if (!selectedPlanForCheckout) return null;
    const basePrice = selectedPlanForCheckout.price;
    const gstPrice = Math.round(basePrice * 0.18);
    const totalPrice = basePrice + gstPrice;

    return (
      <Modal
        visible={showCheckoutModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCheckoutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Confirm Renewal</Text>
                <Text style={styles.settingSub}>Select your preferred payment method</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCheckoutModal(false)}>
                <Feather name="x" size={22} color="#0A2558" />
              </TouchableOpacity>
            </View>

            {/* PLAN SUMMARY BOX */}
            <View style={styles.checkoutSummaryCard}>
              <View style={styles.checkoutSummaryTopRow}>
                <View>
                  <Text style={styles.checkoutPlanName}>{selectedPlanForCheckout.name} Plan</Text>
                  <Text style={styles.checkoutCoverageText}>{selectedPlanForCheckout.coverage}</Text>
                </View>
                <Text style={styles.checkoutPriceMain}>₹{selectedPlanForCheckout.price.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.checkoutPriceLine}>
                <Text style={styles.checkoutPriceLabel}>Base Subscription:</Text>
                <Text style={styles.checkoutPriceValue}>₹{basePrice.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.checkoutPriceLine}>
                <Text style={styles.checkoutPriceLabel}>GST (18%):</Text>
                <Text style={styles.checkoutPriceValue}>₹{gstPrice.toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.checkoutPriceLine, { marginTop: 6 }]}>
                <Text style={styles.checkoutTotalLabel}>Total Payable:</Text>
                <Text style={styles.checkoutTotalValue}>₹{totalPrice.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* PAYMENT MODE SELECTOR */}
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>PAYMENT METHOD</Text>
            <View style={styles.paymentMethodsRow}>
              <TouchableOpacity
                style={[
                  styles.payMethodCard,
                  paymentMethod === 'UPI' && styles.payMethodCardActive,
                ]}
                onPress={() => setPaymentMethod('UPI')}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={20}
                  color={paymentMethod === 'UPI' ? '#0047AB' : '#5A6B87'}
                />
                <Text
                  style={[
                    styles.payMethodText,
                    paymentMethod === 'UPI' && styles.payMethodTextActive,
                  ]}
                >
                  UPI / QR
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.payMethodCard,
                  paymentMethod === 'Card' && styles.payMethodCardActive,
                ]}
                onPress={() => setPaymentMethod('Card')}
              >
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={paymentMethod === 'Card' ? '#0047AB' : '#5A6B87'}
                />
                <Text
                  style={[
                    styles.payMethodText,
                    paymentMethod === 'Card' && styles.payMethodTextActive,
                  ]}
                >
                  Cards
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.payMethodCard,
                  paymentMethod === 'NetBanking' && styles.payMethodCardActive,
                ]}
                onPress={() => setPaymentMethod('NetBanking')}
              >
                <MaterialCommunityIcons
                  name="bank"
                  size={20}
                  color={paymentMethod === 'NetBanking' ? '#0047AB' : '#5A6B87'}
                />
                <Text
                  style={[
                    styles.payMethodText,
                    paymentMethod === 'NetBanking' && styles.payMethodTextActive,
                  ]}
                >
                  NetBanking
                </Text>
              </TouchableOpacity>
            </View>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleExecutePayment}
              disabled={isProcessingPayment}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#0047AB', '#FF6E00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradientFill}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    Proceed to Pay ₹{totalPrice.toLocaleString('en-IN')}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  function renderRazorpayGatewayModal() {
    if (!activeRazorpayOrder) return null;
    const baseAmt = activeRazorpayOrder.amount;
    const gstAmt = Math.round(baseAmt * 0.18);
    const totalAmt = baseAmt + gstAmt;

    return (
      <Modal
        visible={showGatewayModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelGatewayPayment}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { borderTopWidth: 4, borderTopColor: '#0047AB' }]}>
            {/* GATEWAY HEADER */}
            <View style={styles.gatewayHeaderRow}>
              <View style={styles.rzpBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#0047AB" />
                <Text style={styles.rzpBadgeText}>RAZORPAY SECURE GATEWAY</Text>
              </View>
              <TouchableOpacity onPress={handleCancelGatewayPayment} disabled={isAuthorizingGateway}>
                <Feather name="x" size={22} color="#0A2558" />
              </TouchableOpacity>
            </View>

            <Text style={styles.gatewayModalTitle}>Authorize Renewal Payment</Text>
            <Text style={styles.settingSub}>Order ID: {activeRazorpayOrder.orderId}</Text>

            {/* PAYMENT BREAKDOWN CARD */}
            <View style={styles.gatewayCard}>
              <View style={styles.gatewayCardRow}>
                <Text style={styles.gatewayLabel}>Selected Plan</Text>
                <Text style={styles.gatewayVal}>
                  {activeRazorpayOrder.planName} ({activeRazorpayOrder.months} Months)
                </Text>
              </View>
              <View style={styles.gatewayCardRow}>
                <Text style={styles.gatewayLabel}>Payment Method</Text>
                <Text style={styles.gatewayVal}>{paymentMethod}</Text>
              </View>
              <View style={styles.gatewayCardRow}>
                <Text style={styles.gatewayLabel}>Base Price</Text>
                <Text style={styles.gatewayVal}>₹{baseAmt.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.gatewayCardRow}>
                <Text style={styles.gatewayLabel}>GST (18%)</Text>
                <Text style={styles.gatewayVal}>₹{gstAmt.toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.gatewayCardRow, styles.gatewayTotalRow]}>
                <Text style={styles.gatewayTotalLabel}>Total Authorized Amount</Text>
                <Text style={styles.gatewayTotalVal}>₹{totalAmt.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* AUTHORIZE BUTTON */}
            <TouchableOpacity
              style={styles.submitModalBtn}
              onPress={handleAuthorizeGatewayPayment}
              disabled={isAuthorizingGateway}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#0047AB', '#FF6E00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradientFill}
              >
                {isAuthorizingGateway ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Authorize & Complete Payment</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* CANCEL BUTTON */}
            <TouchableOpacity
              style={styles.gatewayCancelBtn}
              onPress={handleCancelGatewayPayment}
              disabled={isAuthorizingGateway}
            >
              <Text style={styles.gatewayCancelBtnText}>Cancel Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
};

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    backgroundColor: '#0E101F',
  },
  screenContainer: {
    flex: 1,
  },
  pinnedHeader: {
    height: 60,
    backgroundColor: '#0E101F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1E38',
    zIndex: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#161B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#161B35',
    borderWidth: 1,
    borderColor: '#232948',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightAction: {
    minWidth: 38,
    alignItems: 'flex-end',
  },
  editPencilBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(129, 142, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarBtn: {
    padding: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // GROUPED MENU CARD
  menuGroupCard: {
    backgroundColor: '#141830',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#232948',
    marginBottom: 14,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#8E98BA',
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#1C213B',
    marginLeft: 64,
  },

  // STANDALONE & DANGER CARDS
  standaloneMenuCard: {
    backgroundColor: '#141830',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#232948',
    marginBottom: 14,
  },
  logoutCard: {
    backgroundColor: '#141830',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: '#626D92',
    marginBottom: 16,
  },

  // SEGMENTED TABS (ACCOUNT INFO)
  segmentedTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#161B35',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#232948',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
    position: 'relative',
  },
  segmentBtnActive: {
    backgroundColor: '#818EF8',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E98BA',
  },
  segmentTextActive: {
    color: '#0E1128',
    fontWeight: '700',
  },
  segmentActiveGlow: {
    display: 'none',
  },

  // EMPTY ACCOUNT / UPI / CA CARD
  emptyAccountCard: {
    backgroundColor: '#141830',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#232948',
    marginBottom: 14,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#161B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyAccountTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyAccountSubtitle: {
    fontSize: 12,
    color: '#8E98BA',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },

  // BANK ACCOUNT CARD
  bankCard: {
    backgroundColor: '#141830',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#232948',
    marginBottom: 14,
  },
  bankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bankTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bankIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#161B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deleteActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bankDetailBox: {
    backgroundColor: '#161B35',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#232948',
  },
  fieldHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E98BA',
    letterSpacing: 0.5,
  },
  accountNumberVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginTop: 3,
    marginBottom: 10,
  },
  ifscRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ifscVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#818EF8',
    marginTop: 2,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(129, 142, 248, 0.2)',
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818EF8',
  },
  addBankBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: '#818EF8',
  },
  primaryGradientFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0E1128',
  },

  // FINANCE INFO STYLES
  financeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C213B',
  },
  sectionSubDesc: {
    fontSize: 12,
    color: '#8E98BA',
    marginBottom: 12,
    lineHeight: 18,
    marginLeft: 4,
  },
  caTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(129, 142, 248, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
  },
  caTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#818EF8',
  },
  caInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // RENEWAL & SUBSCRIPTION STYLES
  centerBadgeRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionPillBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(129, 142, 248, 0.2)',
    borderWidth: 1,
    borderColor: '#818EF8',
  },
  subscriptionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818EF8',
  },
  renewalHeroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  renewalBrandAccent: {
    color: '#818EF8',
    fontStyle: 'italic',
  },
  expiryAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 16,
    gap: 10,
  },
  alertRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F87171',
  },
  expiryAlertText: {
    fontSize: 12,
    color: '#F87171',
    flex: 1,
  },
  boldRedText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  infoTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  infoTile: {
    width: '48%',
    backgroundColor: '#141830',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#232948',
  },
  tileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileTextBox: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E98BA',
    letterSpacing: 0.4,
  },
  tileVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },

  // PRICING PLANS
  planPricingCard: {
    backgroundColor: '#141830',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#232948',
    marginBottom: 16,
    position: 'relative',
  },
  planPricingCardPopular: {
    borderColor: '#818EF8',
    borderWidth: 1.5,
  },
  popularRibbon: {
    position: 'absolute',
    top: -12,
    left: 18,
    backgroundColor: '#818EF8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularRibbonText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0E1128',
    letterSpacing: 0.5,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  planNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCardName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planCoverageSub: {
    fontSize: 12,
    color: '#818EF8',
    fontWeight: '600',
  },
  planPriceGroup: {
    alignItems: 'flex-end',
  },
  planPriceMain: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  planPriceStrike: {
    fontSize: 12,
    color: '#626D92',
    textDecorationLine: 'line-through',
  },
  planDivider: {
    height: 1,
    backgroundColor: '#1C213B',
    marginVertical: 14,
  },
  featuresList: {
    gap: 8,
    marginBottom: 16,
  },
  featureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  getStartedPlanBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#818EF8',
  },
  planActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  planActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E1128',
  },

  // HISTORY EMPTY BOX
  historyEmptyBox: {
    backgroundColor: '#141830',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#232948',
    marginTop: 8,
  },
  historyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#161B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 12,
    color: '#8E98BA',
    textAlign: 'center',
  },

  // DSR SETTING STYLES
  inputSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingTextGroup: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingSub: {
    fontSize: 11,
    color: '#8E98BA',
    marginTop: 2,
  },
  numberInputPill: {
    width: 58,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#161B35',
    borderWidth: 1,
    borderColor: '#232948',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fosHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C213B',
  },
  fosTable: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  fosTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#232948',
  },
  fosColHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818EF8',
    letterSpacing: 0.3,
  },
  fosTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C213B',
  },
  fosCellText: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#626D92',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#161B35',
  },
  checkboxActive: {
    backgroundColor: '#818EF8',
    borderColor: '#818EF8',
  },
  updateDsrBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    backgroundColor: '#818EF8',
  },

  // BUSINESS PROFILE STYLES
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#818EF8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  profileRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  profileFieldTextGroup: {
    flex: 1,
  },
  profileFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E98BA',
    letterSpacing: 0.4,
  },
  profileFieldVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  taxTwoColRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  taxCol: {
    flex: 1,
  },
  taxVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },

  // MODAL COMMON STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#141830',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#232948',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E98BA',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#161B35',
    borderWidth: 1,
    borderColor: '#232948',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#FFFFFF',
  },
  submitModalBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#818EF8',
  },
  showPassToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  showPassText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#818EF8',
  },
  notificationPrefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  termsText: {
    fontSize: 13,
    color: '#8E98BA',
    lineHeight: 20,
  },
  editProfileBannerBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 20,
    backgroundColor: '#818EF8',
  },
  editGroupHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#818EF8',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 6,
  },
  editIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#161B35',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // SUBSCRIPTION HISTORY & RENEWAL SPECIFIC STYLES
  subHistoryBannerCard: {
    backgroundColor: '#141830',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#232948',
    marginBottom: 20,
  },
  subHistoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  subCardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#161B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subCardSubtitle: {
    fontSize: 13,
    color: '#8E98BA',
    lineHeight: 18,
    marginBottom: 16,
  },
  renewNowGreenBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renewNowGreenBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subEmptyTransactionsBox: {
    backgroundColor: '#141830',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#232948',
  },
  subReceiptCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#161B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subEmptySubtitle: {
    fontSize: 13,
    color: '#8E98BA',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  plainPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#161B35',
    borderWidth: 1,
    borderColor: '#232948',
  },
  plainPlanBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E98BA',
    marginTop: 12,
  },
  checkoutSummaryCard: {
    backgroundColor: '#161B35',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#232948',
    marginTop: 4,
  },
  checkoutSummaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkoutPlanName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  checkoutCoverageText: {
    fontSize: 12,
    color: '#818EF8',
    fontWeight: '600',
    marginTop: 2,
  },
  checkoutPriceMain: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  checkoutPriceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  checkoutPriceLabel: {
    fontSize: 13,
    color: '#8E98BA',
  },
  checkoutPriceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkoutTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  checkoutTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#818EF8',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  payMethodCard: {
    flex: 1,
    backgroundColor: '#161B35',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#232948',
  },
  payMethodCardActive: {
    borderColor: '#818EF8',
    backgroundColor: 'rgba(129, 142, 248, 0.15)',
  },
  payMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E98BA',
  },
  payMethodTextActive: {
    color: '#818EF8',
  },

  // SUBSCRIPTION TRANSACTIONS STYLES
  subTxnCard: {
    backgroundColor: '#141830',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#232948',
    marginBottom: 8,
  },
  subTxnTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTxnLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subTxnIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subTxnIdText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subTxnDateText: {
    fontSize: 12,
    color: '#8E98BA',
    marginTop: 2,
  },
  subTxnStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subTxnStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  subTxnDivider: {
    height: 1,
    backgroundColor: '#1C213B',
    marginVertical: 12,
  },
  subTxnBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTxnTypeLabel: {
    fontSize: 11,
    color: '#8E98BA',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  subTxnTypeVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  subTxnAmountVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#818EF8',
    marginTop: 2,
  },

  // RAZORPAY GATEWAY MODAL STYLES
  gatewayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rzpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rzpBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  gatewayModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  gatewayCard: {
    backgroundColor: '#161B35',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#232948',
    marginTop: 14,
    marginBottom: 14,
  },
  gatewayCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  gatewayLabel: {
    fontSize: 13,
    color: '#8E98BA',
  },
  gatewayVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gatewayTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#232948',
    paddingTop: 10,
    marginTop: 6,
  },
  gatewayTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gatewayTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#818EF8',
  },
  gatewayCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  gatewayCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
  },
});
