import React from 'react';
import { useRouter } from 'expo-router';
import { GenerateReceiptScreen } from '@/components/sale/GenerateReceiptScreen';

export default function GenerateReceiptRoute() {
  const router = useRouter();

  return (
    <GenerateReceiptScreen
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
