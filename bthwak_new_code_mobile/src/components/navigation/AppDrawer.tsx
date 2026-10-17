import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  useWindowDimensions,
  Animated,
  PanResponder,
  BackHandler,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { DRAWER_MENU_SECTIONS } from '@/navigation/menu';

import { DrawerHeader } from '../drawer/DrawerHeader';
import { UserCard } from '../drawer/UserCard';
import { SectionLabel } from '../drawer/SectionLabel';
import { MenuItem } from '../drawer/MenuItem';
import { MenuGroup } from '../drawer/MenuGroup';
import { DrawerFooter } from '../drawer/DrawerFooter';

interface AppDrawerProps {
  visible: boolean;
  activeRoute?: string;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenHelpSupport?: () => void;
  onLogout: () => void;
}

function getInitialOpenGroupId(activeRoute?: string): string | null {
  if (activeRoute) {
    for (const section of DRAWER_MENU_SECTIONS) {
      for (const item of section.items) {
        if (item.children?.some((sub) => sub.route === activeRoute)) {
          return item.id;
        }
      }
    }
  }
  return 'purchase';
}

export const AppDrawer: React.FC<AppDrawerProps> = ({
  visible,
  activeRoute = '/dashboard',
  onClose,
  onNavigateTab,
  onOpenHelpSupport,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { user, isLoading } = useAuth();

  // Drawer width: 320, never more than 85% of screen width
  const drawerWidth = Math.min(320, screenWidth * 0.85);

  // Animated values initialized with useMemo
  const slideAnim = useMemo(() => new Animated.Value(-drawerWidth), [drawerWidth]);
  const opacityAnim = useMemo(() => new Animated.Value(0), []);

  // Track which single group is open
  const [openGroupId, setOpenGroupId] = useState<string | null>(() =>
    getInitialOpenGroupId(activeRoute)
  );

  // Handle slide animation when visibility changes
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -drawerWidth,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, drawerWidth, slideAnim, opacityAnim]);

  // Android Back Button handler
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  // PanResponder to detect swipe left to close
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 20;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -40 || gestureState.vx < -0.3) {
            onClose();
          }
        },
      }),
    [onClose]
  );

  // Handle group toggle (only one open at a time)
  const handleToggleGroup = (groupId: string) => {
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  };

  // Handle leaf navigation
  const handleSelectRoute = (label: string, route?: string) => {
    onClose();

    if (!route) {
      Alert.alert(label, 'Feature module coming soon.');
      return;
    }

    if (route === '/businessdetail') {
      router.push('/profile');
    } else if (route === '/dashboard') {
      onNavigateTab?.('dashboard');
    } else if (route.startsWith('/generate-invoice') || route === '/invoice') {
      onNavigateTab?.('sales');
    } else if (route.startsWith('/purchase') || route.startsWith('/master')) {
      onNavigateTab?.('parties');
    } else if (
      route.startsWith('/reports') ||
      route.startsWith('/collection_dsr') ||
      route.startsWith('/stockdsr')
    ) {
      onNavigateTab?.('reports');
    } else {
      Alert.alert(label, `${label} module (${route}) is ready for backend sync.`);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Scrim: #1B1840 at 45% opacity */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.scrim, { opacity: opacityAnim }]} />
        </TouchableWithoutFeedback>

        {/* Drawer Sliding Body */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              paddingTop: Math.max(insets.top, 12),
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* 1. Header (Logo Tile & Close Button) */}
          <DrawerHeader onClose={onClose} />

          {/* 2. User Card (Business name & Mobile) */}
          <UserCard user={user} isLoading={isLoading} />

          {/* 3. Middle Scrollable Menu */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {DRAWER_MENU_SECTIONS.map((section) => (
              <View key={section.id}>
                {section.sectionLabel && (
                  <SectionLabel label={section.sectionLabel} />
                )}

                {section.items.map((item) => {
                  if (item.children && item.children.length > 0) {
                    return (
                      <MenuGroup
                        key={item.id}
                        label={item.label}
                        icon={item.icon}
                        subItems={item.children}
                        isExpanded={openGroupId === item.id}
                        activeRoute={activeRoute}
                        onToggle={() => handleToggleGroup(item.id)}
                        onSelectSubItem={(sub) =>
                          handleSelectRoute(sub.label, sub.route)
                        }
                      />
                    );
                  }

                  const isActive = activeRoute === item.route;
                  return (
                    <MenuItem
                      key={item.id}
                      label={item.label}
                      icon={item.icon}
                      isActive={isActive}
                      onPress={() => handleSelectRoute(item.label, item.route)}
                    />
                  );
                })}
              </View>
            ))}
          </ScrollView>

          {/* 4. Pinned Footer (Help & Support + Logout) */}
          <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            <DrawerFooter
              onPressHelp={() => {
                onClose();
                if (onOpenHelpSupport) {
                  onOpenHelpSupport();
                } else {
                  Alert.alert('Help & Support', 'Reach us at support@bthawk.com');
                }
              }}
              onPressLogout={() => {
                onClose();
                onLogout();
              }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(27, 24, 64, 0.45)',
  },
  drawer: {
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    height: '100%',
    shadowColor: '#1B1840',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 4, height: 0 },
    elevation: 16,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
