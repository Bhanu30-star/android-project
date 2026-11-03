import React from 'react';
import { Redirect } from 'expo-router';

export default function SaleIndexRedirectRoute() {
  return <Redirect href="/generate-invoice" />;
}
