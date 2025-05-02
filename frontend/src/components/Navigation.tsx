import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Container } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import SettingsIcon from '@mui/icons-material/Settings';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [value, setValue] = useState(0);

  // Update the selected tab based on the current path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      setValue(0);
    } else if (path === '/data') {
      setValue(1);
    } else if (path === '/resources') {
      setValue(2);
    } else if (path === '/settings') {
      setValue(3);
    }
  }, [location]);

  // Handle tab change
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/data');
        break;
      case 2:
        navigate('/resources');
        break;
      case 3:
        navigate('/settings');
        break;
    }
  };

  return (
    <Box component="nav" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
      <Container>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="navigation tabs"
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<StorageIcon />} label="Data" />
          <Tab icon={<MemoryIcon />} label="Resources" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>
      </Container>
    </Box>
  );
};

export default Navigation;