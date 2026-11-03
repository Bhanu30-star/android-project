import React from 'react';
import { Redirect } from 'expo-router';

export default function SaleRedirectRoute() {
  return <Redirect href="/generate-invoice" />;
}
