import React from 'react';
import { useRouter } from 'expo-router';
import { CreditNoteDetailScreen } from '@/components/master/CreditNoteDetailScreen';

export default function MasterCreditNoteRoute() {
  const router = useRouter();

  return (
    <CreditNoteDetailScreen
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
