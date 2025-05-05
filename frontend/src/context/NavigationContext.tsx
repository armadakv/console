import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
    pageTitle: string;
    pageAction: ReactNode | null;
    setPageTitle: (title: string) => void;
    setPageAction: (action: ReactNode | null) => void;
    resetPageAction: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
    children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
    const [pageTitle, setPageTitle] = useState<string>('Dashboard');
    const [pageAction, setPageAction] = useState<ReactNode | null>(null);

    const resetPageAction = () => setPageAction(null);

    const value = {
        pageTitle,
        pageAction,
        setPageTitle,
        setPageAction,
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