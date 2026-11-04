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
  Platform,
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
    } else if (
      route === '/purchase/credit_list' ||
      route === '/purchase/credit-list' ||
      route === '/purchase-credit'
    ) {
      router.push('/purchase-credit');
    } else if (
      route === '/purchase/add_stock' ||
      route === '/purchase/add-stock' ||
      route === '/add-stock'
    ) {
      router.push('/purchase/add_stock' as any);
    } else if (route === '/purchase/generate_debit_note' || route === '/generate-debit-note') {
      router.push('/purchase/generate_debit_note' as any);
    } else if (
      route === '/master/customer' ||
      route === '/master/sales_executive' ||
      route === '/master/sales-executive' ||
      route === '/sales-executive'
    ) {
      router.push('/master/sales-executive' as any);
    } else if (
      route === '/master/buyer_seller' ||
      route === '/master/buyer-seller' ||
      route === '/buyer-seller'
    ) {
      router.push('/master/buyer-seller' as any);
    } else if (
      route === '/master/beat' ||
      route === '/master/beat-management' ||
      route === '/beat'
    ) {
      router.push('/master/beat' as any);
    } else if (
      route === '/master/bulkretailer' ||
      route === '/master/bulk-retailer' ||
      route === '/bulkretailer'
    ) {
      router.push('/master/bulkretailer' as any);
    } else if (
      route === '/generate-receipt' ||
      route === '/sale/generate-receipt' ||
      route === '/sale-generate-receipt' ||
      route === '/sale/generate_receipt'
    ) {
      router.push('/generate-receipt' as any);
    } else if (
      route === '/receipt-register' ||
      route === '/receipt-book' ||
      route === '/sale/receipt-book' ||
      route === '/receipt_book'
    ) {
      router.push('/receipt-book' as any);
    } else if (
      route === '/sale_return' ||
      route === '/sale-return' ||
      route === '/sale/return'
    ) {
      router.push('/sale-return' as any);
    } else if (
      route === '/master/Creditnote' ||
      route === '/master/credit-note' ||
      route === '/credit-note-detail' ||
      route === '/credit-note'
    ) {
      router.push('/credit-note-detail' as any);
    } else if (route === '/product/waste_damage' || route === '/waste-damage') {
      router.push('/product/waste_damage' as any);
    } else if (route === '/product/add' || route === '/product-master' || route.startsWith('/product')) {
      router.push('/product-master');
    } else if (
      route === '/pending_request' ||
      route === '/stock_transfer' ||
      route === '/cancelled_request' ||
      route === '/Executive_stocktransfer' ||
      route === '/stock-request-master'
    ) {
      router.push(route as any);
    } else if (route === '/dashboard') {
      onNavigateTab?.('dashboard');
    } else if (route === '/invoice' || route.startsWith('/invoice')) {
      router.push('/invoice' as any);
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
      statusBarTranslucent={true}
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
              paddingTop: Platform.OS === 'ios' ? insets.top : Math.max(insets.top, 8),
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
    backgroundColor: 'rgba(10, 37, 88, 0.45)',
  },
  drawer: {
    backgroundColor: '#FFFFFF',
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#DFE7F2',
    shadowColor: '#0047AB',
    shadowOpacity: 0.15,
    shadowRadius: 20,
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
