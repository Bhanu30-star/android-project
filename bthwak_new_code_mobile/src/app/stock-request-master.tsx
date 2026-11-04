import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StockRequestMasterScreen, StockRequestTab } from '@/components/stock/StockRequestMasterScreen';

export default function StockRequestMasterRoute() {
  const params = useLocalSearchParams<{ tab?: StockRequestTab }>();
  return <StockRequestMasterScreen initialTab={params.tab || 'pending'} />;
}
