import { Components, ThemeOptions } from '@mui/material/styles';

// Theme options shared between light and dark modes
const getBaseThemeOptions = (): Omit<ThemeOptions, 'palette'> => ({
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8, // 1 unit = 8px
  },
});

// Light theme palette
const lightPalette: ThemeOptions['palette'] = {
  mode: 'light',
  primary: {
    main: '#1976d2',
  },
  secondary: {
    main: '#dc004e',
  },
  success: {
    main: '#4caf50',
  },
  error: {
    main: '#f44336',
  },
  warning: {
    main: '#ff9800',
  },
  info: {
    main: '#2196f3',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};

// Dark theme palette
const darkPalette: ThemeOptions['palette'] = {
  mode: 'dark',
  primary: {
    main: '#90caf9',
  },
  secondary: {
    main: '#f48fb1',
  },
  success: {
    main: '#81c784',
  },
  error: {
    main: '#f44336',
  },
  warning: {
    main: '#ffb74d',
  },
  info: {
    main: '#64b5f6',
  },
  background: {
    default: '#121212',
    paper: '#212121',
  },
  divider: 'rgba(255, 255, 255, 0.12)',
};

// Get components overrides based on the selected mode
const getComponents = (mode: 'light' | 'dark'): ThemeOptions['components'] => {
  // We'll use this isDark flag to conditionally apply different styles
  const isDark = mode === 'dark';

  return {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          overflow: 'hidden',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          // We use theme.palette values directly in the ThemeProvider
          // as we don't have access to the theme object here
          backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5',
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
          padding: '16px 24px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: isDark
              ? '0px 2px 4px -1px rgba(0,0,0,0.3)'
              : '0px 2px 4px -1px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#1e1e1e' : '#f5f5f5',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 'bold',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 24,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  };
};

// Main function to get the theme options based on the mode
export const getTheme = (mode: 'light' | 'dark'): ThemeOptions => {
  return {
    ...getBaseThemeOptions(),
    palette: mode === 'light' ? lightPalette : darkPalette,
    components: getComponents(mode),
  };
};

// For backwards compatibility
export default getTheme('light');
