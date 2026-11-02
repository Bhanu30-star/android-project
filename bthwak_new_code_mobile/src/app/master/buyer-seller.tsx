import React from 'react';
import { useRouter } from 'expo-router';
import { BuyerSellerScreen } from '@/components/master/BuyerSellerScreen';

export default function BuyerSellerRoute() {
  const router = useRouter();

  return (
    <BuyerSellerScreen
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
