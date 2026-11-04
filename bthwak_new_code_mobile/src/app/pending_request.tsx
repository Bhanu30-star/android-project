import React from 'react';
import { StockRequestMasterScreen } from '@/components/stock/StockRequestMasterScreen';

export default function PendingRequestRoute() {
  return <StockRequestMasterScreen initialTab="pending" />;
}
