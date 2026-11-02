import React from 'react';
import { useRouter } from 'expo-router';
import { BulkRetailerScreen } from '@/components/master/BulkRetailerScreen';

export default function BulkRetailerRoute() {
  const router = useRouter();

  return (
    <BulkRetailerScreen
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
