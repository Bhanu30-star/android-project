import React from 'react';
import { useRouter } from 'expo-router';
import { WasteDamageScreen } from '@/components/wasteDamage/WasteDamageScreen';

export default function WasteDamageRoute() {
  const router = useRouter();

  return (
    <WasteDamageScreen
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
