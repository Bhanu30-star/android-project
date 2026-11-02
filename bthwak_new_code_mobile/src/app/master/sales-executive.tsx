import React from 'react';
import { useRouter } from 'expo-router';
import { SalesExecutiveScreen } from '@/components/master/SalesExecutiveScreen';

export default function SalesExecutiveRoute() {
  const router = useRouter();

  return (
    <SalesExecutiveScreen
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
