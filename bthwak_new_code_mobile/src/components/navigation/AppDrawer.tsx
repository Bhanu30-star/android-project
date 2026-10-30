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

import { UserCard } from '../drawer/UserCard';
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
  return null;
}

export const AppDrawer: React.FC<AppDrawerProps> = ({
  visible,
  activeRoute = '/dashboard',
  onClose,
  onNavigateTab,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { user, isLoading } = useAuth();

  // Drawer width: 320, never more than 85% of screen width
  const drawerWidth = Math.min(320, screenWidth * 0.85);

  const slideAnim = useMemo(() => new Animated.Value(-drawerWidth), [drawerWidth]);
  const opacityAnim = useMemo(() => new Animated.Value(0), []);

  const [openGroupId, setOpenGroupId] = useState<string | null>(() =>
    getInitialOpenGroupId(activeRoute)
  );

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

  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

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

  const handleToggleGroup = (groupId: string) => {
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  };

  const handleSelectRoute = (label: string, route?: string) => {
    onClose();

    if (!route) {
      Alert.alert(label, 'Feature module coming soon.');
      return;
    }

    if (route === '/businessdetail') {
      router.push('/profile');
    } else if (route === '/generate-invoice') {
      router.push('/generate-invoice');
    } else if (route === '/dashboard') {
      onNavigateTab?.('dashboard');
    } else if (route === '/invoice' || route.startsWith('/invoice')) {
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
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.scrim, { opacity: opacityAnim }]} />
        </TouchableWithoutFeedback>

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
          {/* 1. Header with Avatar, User Info & Settings Gear */}
          <UserCard
            user={user}
            isLoading={isLoading}
            onPressSettings={() => {
              onClose();
              onNavigateTab?.('settings');
            }}
          />

          {/* 2. Middle Scrollable Menu */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {DRAWER_MENU_SECTIONS[0].items.map((item) => {
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
          </ScrollView>

          {/* 3. Pinned Footer with Logout & Version */}
          <View style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            <DrawerFooter
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawer: {
    backgroundColor: '#121829',
    height: '100%',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 4, height: 0 },
    elevation: 16,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
});
