import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/queryClient';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootStack() {
  const { isLoading } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (!isLoading && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="generate-invoice" />
        <Stack.Screen name="purchase-credit" />
        <Stack.Screen name="purchase/generate_debit_note" />
        <Stack.Screen name="generate-debit-note" />
        <Stack.Screen name="master/sales-executive" />
        <Stack.Screen name="sales-executive" />
        <Stack.Screen name="master/buyer-seller" />
        <Stack.Screen name="buyer-seller" />
        <Stack.Screen name="master/beat" />
        <Stack.Screen name="beat" />
        <Stack.Screen name="master/bulkretailer" />
        <Stack.Screen name="bulkretailer" />
        <Stack.Screen name="generate-receipt" />
        <Stack.Screen name="sale/generate-receipt" />
        <Stack.Screen name="sale-return" />
        <Stack.Screen name="sale/return" />
        <Stack.Screen name="credit-note-detail" />
        <Stack.Screen name="master/Creditnote" />
        <Stack.Screen name="master/credit-note" />
        <Stack.Screen name="invoice" />
        <Stack.Screen name="edit-invoice" />
        <Stack.Screen name="purchase/add_stock" />
        <Stack.Screen name="purchase/add-stock" />
        <Stack.Screen name="add-stock" />
        <Stack.Screen name="purchase/credit_list" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <RootStack />
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
