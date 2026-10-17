export const Colors = {
  background: '#F5F4FF',
  card: '#FFFFFF',
  text: '#1B1840',
  textSecondary: '#5E5B85',
  textBody: '#3A376A',
  primary: '#4F46E5',
  primaryDeep: '#2A2470',
  divider: '#ECEBFA',
  tabBorder: '#E3E1F7',
  dangerDot: '#C0262D',

  // Hero card specific
  hero: {
    bg: '#2A2470',
    label: '#CFCCF7',
    divider: '#4A4296',
    negativeAmount: '#FFD6D6',
    positiveAmount: '#FFFFFF',
    negativePillBg: 'rgba(192, 38, 45, 0.28)',
    negativePillText: '#FFD6D6',
  },

  // Stat chips (bg / icon / value)
  chips: {
    sale: {
      bg: '#E8E6FF',
      icon: '#4F46E5',
      value: '#1B1840',
    },
    purchase: {
      bg: '#FFE9DC',
      icon: '#B4400C',
      value: '#1B1840',
    },
    collected: {
      bg: '#DDF5E9',
      icon: '#0B7A4D',
      value: '#0B7A4D',
    },
    toCollect: {
      bg: '#FFF1D6',
      icon: '#9A5B00',
      value: '#9A5B00',
    },
    expense: {
      bg: '#FFE3E3',
      icon: '#B01E25',
      value: '#1B1840',
    },
  },

  // Field & Stock indicators
  fieldStock: {
    fse: '#4F46E5',
    pending: '#0B7A4D',
    approved: '#9A5B00',
    dsr: '#4F46E5',
  },

  // Support section buttons
  support: {
    btnBg: '#F5F4FF',
    meetingIcon: '#4F46E5',
    emailIcon: '#4F46E5',
    videoIcon: '#DC2626',
    whatsappIcon: '#0B7A4D',
    chatBtnBg: '#4F46E5',
    chatBtnText: '#FFFFFF',
  },

  // Status / Utility
  white: '#FFFFFF',
  error: '#B01E25',
  errorBg: '#FFF5F5',
  success: '#0B7A4D',
  border: '#ECEBFA',
  overlay: 'rgba(27, 24, 64, 0.45)',
  backdrop: 'rgba(15, 12, 41, 0.6)',
  pillBg: '#EEEDFA',

  // Form & Input specific
  inputBg: '#F8F7FF',
  inputBorder: '#ECEBFA',
  inputBorderFocused: '#4F46E5',
  inputBorderError: '#B01E25',
  inputBgError: '#FFF5F5',
  inputErrorText: '#B01E25',
  unsavedTagBg: '#FFF1D6',
  unsavedTagText: '#9A5B00',
  uploadBorder: '#C9C6F5',
};

export const Typography = {
  fontFamily: {
    medium: 'PlusJakartaSans_500Medium',
    semiBold: 'PlusJakartaSans_600SemiBold',
    bold: 'PlusJakartaSans_700Bold',
    extraBold: 'PlusJakartaSans_800ExtraBold',
  },
  pageTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: Colors.text,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 17,
    lineHeight: 22,
    color: Colors.text,
  },
  statValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    lineHeight: 28,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  heroAmount: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -1,
  },
  heroLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.hero.label,
  },
  heroSubValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 17,
    lineHeight: 22,
    color: Colors.white,
  },
  body: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  bodySemiBold: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textBody,
  },
  bodyBold: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  small: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textSecondary,
  },
  button: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    lineHeight: 18,
  },
};

export const Shapes = {
  screenPadding: 16,
  verticalGap: 16,
  gridGap: 12,
  cardRadius: 20,
  cardPadding: 16,
  heroRadius: 24,
  heroPadding: 20,
  iconChipSize: 36,
  iconChipRadius: 12,
  buttonMinHeight: 44,
  tabBarHeight: 84,
  centerFabSize: 56,
  centerFabElevated: 28,
  drawerWidth: 320,
  drawerRadius: 24,

  // Radius aliases
  radiusSmall: 8,
  radiusMedium: 14,
  radiusLarge: 20,

  // Nested convenience aliases
  card: {
    radius: 20,
    padding: 16,
  },
  buttons: {
    minHeight: 44,
  },
};

export const Shadows = {
  card: {
    shadowColor: '#4F46E5',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  hero: {
    shadowColor: '#2A2470',
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  fab: {
    shadowColor: '#4F46E5',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  circleBtn: {
    shadowColor: '#4F46E5',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  button: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  pill: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
};
