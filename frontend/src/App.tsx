import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { 
  Box, 
  Container, 
  CssBaseline, 
  Drawer, 
  Toolbar, 
  useMediaQuery, 
  useTheme
} from '@mui/material';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './routes/dashboard/Dashboard';
import Data from './routes/data/Data';
import AddKeyValuePage from './routes/data/AddKeyValuePage';
import EditKeyValuePage from './routes/data/EditKeyValuePage';
import Resources from './routes/resources/Resources';
import Settings from './routes/settings/Settings';
import Footer from './components/Footer';

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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* App bar */}
      <Header 
        drawerWidth={drawerWidth} 
        onDrawerToggle={handleDrawerToggle} 
      />

      {/* Sidebar / Navigation drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/data" element={<Data />} />
            <Route path="/data/:table" element={<Data />} />
            <Route path="/data/:table/add" element={<AddKeyValuePage />} />
            <Route path="/data/:table/edit/:key" element={<EditKeyValuePage />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Container>
        <Footer />
      </Box>
    </Box>
  );
};

export default App;