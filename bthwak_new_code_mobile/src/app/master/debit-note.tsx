import React from 'react';
import { useRouter } from 'expo-router';
import { DebitNoteDetailScreen } from '@/components/master/DebitNoteDetailScreen';

export default function MasterDebitNoteRoute() {
  const router = useRouter();

  return (
    <DebitNoteDetailScreen
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
