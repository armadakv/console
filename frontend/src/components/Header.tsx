import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';

import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  drawerWidth: number;
  onDrawerToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ drawerWidth, onDrawerToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" noWrap component="div">
            {isMobile ? 'Armada Console' : 'Dashboard'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ThemeToggle />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
