import PersonIcon from '@mui/icons-material/Person';
import SettingsSystemDaydreamIcon from '@mui/icons-material/SettingsSystemDaydream';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Box, Tab, Tabs, Paper, Card, Typography, useTheme } from '@mui/material';
import React from 'react';

import PageHeader from '../../components/shared/PageHeader';

import ServerConfig from './ServerConfig';
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
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <>
      <PageHeader title="Settings" />

      <Card>
        <Box
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          }}
        >
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="settings tabs"
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 2,
              '& .MuiTab-root': {
                py: 1.5,
                px: 2,
                textTransform: 'none',
                color: isDarkMode ? theme.palette.text.secondary : theme.palette.text.primary,
                '&.Mui-selected': {
                  color: isDarkMode ? theme.palette.primary.light : theme.palette.primary.dark,
                  fontWeight: 500,
                },
                '&:hover': {
                  color: isDarkMode ? theme.palette.primary.light : theme.palette.primary.dark,
                  opacity: 0.8,
                },
              },
            }}
          >
            <Tab icon={<TableChartIcon />} iconPosition="start" label="Tables" {...a11yProps(0)} />
            <Tab
              icon={<SettingsSystemDaydreamIcon />}
              iconPosition="start"
              label="System"
              {...a11yProps(1)}
            />
            <Tab
              icon={<PersonIcon />}
              iconPosition="start"
              label="User Preferences"
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <TableManagement />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <ServerConfig />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              User Preferences
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                borderLeft: 4,
                borderLeftColor: 'primary.light',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                User preferences settings coming soon.
              </Typography>
            </Paper>
          </Box>
        </TabPanel>
      </Card>
    </>
  );
};

export default SettingsPage;
