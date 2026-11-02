import React from 'react';
import { useRouter } from 'expo-router';
import { PurchaseCreditScreen } from '@/components/purchase/PurchaseCreditScreen';

export default function PurchaseCreditRoute() {
  const router = useRouter();

  return (
    <PurchaseCreditScreen
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/dashboard');
        }
      }}
    />
  );
}
