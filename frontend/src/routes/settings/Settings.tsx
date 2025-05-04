import React from 'react';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import TableManagement from './TableManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="settings tabs">
          <Tab label="Tables" {...a11yProps(0)} />
          <Tab label="System" {...a11yProps(1)} />
          <Tab label="User Preferences" {...a11yProps(2)} />
        </Tabs>
      </Box>
      
      <TabPanel value={value} index={0}>
        <TableManagement />
      </TabPanel>
      
      <TabPanel value={value} index={1}>
        System settings coming soon
      </TabPanel>
      
      <TabPanel value={value} index={2}>
        User preferences coming soon
      </TabPanel>
    </Box>
  );
};

export default Settings;
