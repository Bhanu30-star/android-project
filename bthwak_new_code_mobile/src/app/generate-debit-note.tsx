import React from 'react';
import { useRouter } from 'expo-router';
import { GenerateDebitNoteScreen } from '@/components/purchase/GenerateDebitNoteScreen';

export default function GenerateDebitNoteRoute() {
  const router = useRouter();

  return (
    <GenerateDebitNoteScreen
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
