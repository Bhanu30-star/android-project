import React from 'react';
import { StockRequestMasterScreen } from '@/components/stock/StockRequestMasterScreen';

export default function CancelledRequestRoute() {
  return <StockRequestMasterScreen initialTab="cancelled" />;
}
