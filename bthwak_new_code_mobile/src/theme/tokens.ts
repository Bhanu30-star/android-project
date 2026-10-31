export const Colors = {
  background: '#F4F8FD',
  card: '#FFFFFF',
  text: '#0E204E',
  textSecondary: '#5A6B87',
  textBody: '#334155',
  primary: '#0047AB',
  primaryDeep: '#0A2558',
  primaryLight: '#E8F1FC',
  accent: '#FF6E00',
  accentLight: '#FFF2E5',
  accentHover: '#E55E00',
  divider: '#E2E8F0',
  tabBorder: '#D8E2EF',
  dangerDot: '#DC2626',

  // Hero card specific
  hero: {
    bg: '#0A2558',
    label: '#B4CDEB',
    divider: '#1B3D78',
    negativeAmount: '#FFD6D6',
    positiveAmount: '#FFFFFF',
    negativePillBg: 'rgba(220, 38, 38, 0.28)',
    negativePillText: '#FFD6D6',
  },

  // Stat chips (bg / icon / value)
  chips: {
    sale: {
      bg: '#E8F1FC',
      icon: '#0047AB',
      value: '#0E204E',
    },
    purchase: {
      bg: '#FFF2E5',
      icon: '#FF6E00',
      value: '#0E204E',
    },
    collected: {
      bg: '#E6F9F0',
      icon: '#0D9488',
      value: '#0D9488',
    },
    toCollect: {
      bg: '#FFF8E6',
      icon: '#D97706',
      value: '#D97706',
    },
    expense: {
      bg: '#FEF2F2',
      icon: '#DC2626',
      value: '#0E204E',
    },
  },

  // Field & Stock indicators
  fieldStock: {
    fse: '#0047AB',
    pending: '#0D9488',
    approved: '#D97706',
    dsr: '#FF6E00',
  },

  // Support section buttons
  support: {
    btnBg: '#F4F8FD',
    meetingIcon: '#0047AB',
    emailIcon: '#0047AB',
    videoIcon: '#DC2626',
    whatsappIcon: '#16A34A',
    chatBtnBg: '#0047AB',
    chatBtnText: '#FFFFFF',
  },

  // Status / Utility
  white: '#FFFFFF',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  success: '#16A34A',
  border: '#DFE7F2',
  overlay: 'rgba(14, 32, 78, 0.45)',
  backdrop: 'rgba(10, 37, 88, 0.6)',
  pillBg: '#EDF4FC',

  // Form & Input specific
  inputBg: '#FFFFFF',
  inputBorder: '#DFE7F2',
  inputBorderFocused: '#0047AB',
  inputBorderError: '#DC2626',
  inputBgError: '#FEF2F2',
  inputErrorText: '#DC2626',
  unsavedTagBg: '#FFF8E6',
  unsavedTagText: '#D97706',
  uploadBorder: '#BED2ED',
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
  radiusPill: 9999,

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
    shadowColor: '#0A2558',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  hero: {
    shadowColor: '#0A2558',
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  fab: {
    shadowColor: '#FF6E00',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  circleBtn: {
    shadowColor: '#0047AB',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  button: {
    shadowColor: '#FF6E00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  pill: {
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
};
