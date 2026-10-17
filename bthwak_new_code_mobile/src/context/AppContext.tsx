import React, { createContext, useContext, useState } from 'react';

export type AppTabType = 'dashboard' | 'sales' | 'parties' | 'reports' | 'settings';

interface AppContextType {
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  formatAmount: (amount: number | string | undefined | null) => string;
}

const AppContext = createContext<AppContextType>({
  activeTab: 'dashboard',
  setActiveTab: () => {},
  isPrivacyMode: false,
  togglePrivacyMode: () => {},
  formatAmount: () => '',
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTabType>('dashboard');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => !prev);
  };

  const formatAmount = (amount: number | string | undefined | null): string => {
    if (isPrivacyMode) {
      return '₹ ••••••';
    }
    if (amount === null || amount === undefined) {
      return '₹ 0';
    }
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹ 0';

    const formatted = num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
    return `₹ ${formatted}`;
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isPrivacyMode,
        togglePrivacyMode,
        formatAmount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
