import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

import { BreadcrumbItem } from '@/shared/Breadcrumb';

interface NavigationContextType {
  breadcrumbs: BreadcrumbItem[];
  pageAction: ReactNode | null;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  setPageAction: (newAction: ReactNode | null) => void;
  resetPageAction: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([]);
  const [pageAction, setPageAction] = useState<ReactNode | null>(null);

  const setBreadcrumbs = useCallback((items: BreadcrumbItem[]) => {
    setBreadcrumbsState(items);
  }, []);

  const memoizedSetPageAction = useCallback((newAction: ReactNode | null) => {
    setPageAction(newAction);
  }, []);

  const resetPageAction = useCallback(() => {
    setPageAction(null);
  }, []);

  const value = {
    breadcrumbs,
    pageAction,
    setBreadcrumbs,
    setPageAction: memoizedSetPageAction,
    resetPageAction,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
