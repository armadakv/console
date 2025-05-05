import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

import { getTheme } from './theme';

// Theme mode type
type ColorMode = 'light' | 'dark' | 'system';

// Theme context type
type ThemeContextType = {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  resolvedMode: 'light' | 'dark';
};

// Create a context for the theme
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use the theme context
export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the initial theme mode from localStorage or default to 'system'
  const [mode, setMode] = useState<ColorMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as ColorMode) || 'system';
  });

  // Determine if the system prefers dark mode
  const prefersDarkMode = useMemo(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Determine the resolved mode (light or dark)
  const resolvedMode = useMemo<'light' | 'dark'>(() => {
    if (mode === 'system') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return mode;
  }, [mode, prefersDarkMode]);

  // Update localStorage when the mode changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Listen for changes to the system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (mode === 'system') {
        // Force a re-render when system preference changes
        setMode('system');
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode]);

  // Create the theme based on the resolved mode
  const theme = useMemo(() => {
    return createTheme(getTheme(resolvedMode));
  }, [resolvedMode]);

  // Context value
  const contextValue = useMemo(() => {
    return { mode, setMode, resolvedMode };
  }, [mode, resolvedMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
