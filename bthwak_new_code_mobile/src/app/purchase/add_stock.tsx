import React from 'react';
import { useRouter } from 'expo-router';
import { PurchaseAddStockScreen } from '@/components/purchase/PurchaseAddStockScreen';

export default function PurchaseAddStockRoute() {
  const router = useRouter();

  return (
    <PurchaseAddStockScreen
      onOpenDrawer={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/dashboard');
        }
      }}
      onNavigateToCreditList={() => {
        router.push('/purchase-credit');
      }}
      onNavigateToParties={() => {
        router.push('/master/buyer-seller' as any);
      }}
    />
  );
}
