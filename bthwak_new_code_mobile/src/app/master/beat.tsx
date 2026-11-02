import React from 'react';
import { useRouter } from 'expo-router';
import { BeatManagementScreen } from '@/components/master/BeatManagementScreen';

export default function BeatManagementRoute() {
  const router = useRouter();

  return (
    <BeatManagementScreen
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
