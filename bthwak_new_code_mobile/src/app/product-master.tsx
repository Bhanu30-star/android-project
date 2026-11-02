import React from 'react';
import { useRouter } from 'expo-router';
import { ProductMasterScreen } from '@/components/products/ProductMasterScreen';

export default function ProductMasterRoute() {
  const router = useRouter();

  return (
    <ProductMasterScreen
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
