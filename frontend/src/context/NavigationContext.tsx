import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface NavigationContextType {
  pageTitle: string;
  pageAction: ReactNode | null;
  setPageTitle: (newTitle: string) => void;
  setPageAction: (newAction: ReactNode | null) => void;
  resetPageAction: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [pageTitle, setPageTitle] = useState<string>('Dashboard');
  const [pageAction, setPageAction] = useState<ReactNode | null>(null);

  // Memoize functions to prevent unnecessary re-renders
  const memoizedSetPageTitle = useCallback((newTitle: string) => {
    setPageTitle(newTitle);
  }, []);

  const memoizedSetPageAction = useCallback((newAction: ReactNode | null) => {
    setPageAction(newAction);
  }, []);

  const resetPageAction = useCallback(() => {
    setPageAction(null);
  }, []);

  const value = {
    pageTitle,
    pageAction,
    setPageTitle: memoizedSetPageTitle,
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
