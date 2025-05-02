import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './routes/Dashboard';
import DataDashboard from './routes/DataDashboard';
import Resources from './routes/Resources';
import Settings from './routes/Settings';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
      <CssBaseline />
      <Header />
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/data" element={<DataDashboard />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default App;