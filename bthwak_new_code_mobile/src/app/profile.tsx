import React from 'react';
import { useRouter } from 'expo-router';
import { ProfileScreen } from '@/components/profile/ProfileScreen';

export default function ProfileRoute() {
  const router = useRouter();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/dashboard');
    }
  };

  return <ProfileScreen onGoBack={handleGoBack} />;
}
