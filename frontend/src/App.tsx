import {
  Box,
  Container,
  CssBaseline,
  Drawer,
  Toolbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { Suspense, useState, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import Footer from './components/Footer';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoadingState from './components/shared/LoadingState';
import { NavigationProvider } from './context/NavigationContext';

// Lazy load route components for code splitting
const DashboardPage = lazy(() => import('./routes/dashboard/DashboardPage'));
const DataPage = lazy(() => import('./routes/data/DataPage'));
const AddKeyValuePage = lazy(() => import('./routes/data/AddKeyValuePage'));
const EditKeyValuePage = lazy(() => import('./routes/data/EditKeyValuePage'));
const ResourcesPage = lazy(() => import('./routes/resources/ResourcesPage'));
const SettingsPage = lazy(() => import('./routes/settings/SettingsPage'));

// Drawer width for the sidebar
const drawerWidth = 240;

const App: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <NavigationProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />

        {/* App bar */}
        <Header drawerWidth={drawerWidth} onDrawerToggle={handleDrawerToggle} />

        {/* Sidebar / Navigation drawer */}
        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          {/* Mobile drawer */}
          {isMobile && (
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile
              }}
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: drawerWidth,
                },
              }}
            >
              <Sidebar onClose={handleDrawerToggle} />
            </Drawer>
          )}

          {/* Desktop drawer - permanent */}
          {!isMobile && (
            <Drawer
              variant="permanent"
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: drawerWidth,
                  borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                },
              }}
              open
            >
              <Sidebar />
            </Drawer>
          )}
        </Box>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            width: { md: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          <Toolbar /> {/* This adds spacing below the app bar */}
          <Container sx={{ flexGrow: 1, py: 3 }}>
            <Suspense fallback={<LoadingState />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/data" element={<DataPage />} />
                <Route path="/data/:table" element={<DataPage />} />
                <Route path="/data/:table/add" element={<AddKeyValuePage />} />
                <Route path="/data/:table/edit/:key" element={<EditKeyValuePage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Suspense>
          </Container>
          <Footer />
        </Box>
      </Box>
    </NavigationProvider>
  );
};

export default App;
