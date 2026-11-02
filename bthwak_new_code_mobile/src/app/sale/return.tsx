import React from 'react';
import { useRouter } from 'expo-router';
import { SaleReturnScreen } from '@/components/sale/SaleReturnScreen';

export default function SaleReturnNestedRoute() {
  const router = useRouter();

  return (
    <SaleReturnScreen
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
