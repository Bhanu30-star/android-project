import React from 'react';
import { useRouter } from 'expo-router';
import { CreditNoteDetailScreen } from '@/components/master/CreditNoteDetailScreen';

export default function MasterCreditNoteKebabRoute() {
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
