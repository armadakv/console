// filepath: /Users/jakubcoufal/Projects/oss/armadakv/console/frontend/src/components/Sidebar.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import SettingsIcon from '@mui/icons-material/Settings';
import TableChartIcon from '@mui/icons-material/TableChart';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import { useTables } from '../hooks/useApi';

// Logo styling
const LogoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '1.2rem',
  color: theme.palette.primary.main,
  letterSpacing: '0.5px',
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
}));

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tablesOpen, setTablesOpen] = useState(true);

  // Fetch tables for submenu
  const { data: tables, isLoading: tablesLoading } = useTables();

  // Navigation items
  const navItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Resources', path: '/resources', icon: <MemoryIcon /> },
    { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  // Handle navigation
  const handleNavClick = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  // Toggle tables submenu
  const handleToggleTables = () => {
    setTablesOpen(!tablesOpen);
  };

  // Handle table selection
  const handleTableClick = (tableName: string) => {
    navigate(`/data/${tableName}`);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div>
      <Toolbar>
        <LogoContainer>
          <Logo variant="h6">Armada Console</Logo>
        </LogoContainer>
      </Toolbar>
      <Divider />
      <List>
        {/* Main navigation items except Data which has a submenu */}
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={item.path === location.pathname}
              onClick={() => handleNavClick(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  borderLeft: 4,
                  borderColor: 'primary.main',
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: item.path === location.pathname ? 'primary.main' : 'inherit',
                  minWidth: '40px',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Data item with tables submenu */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname.startsWith('/data')}
            onClick={handleToggleTables}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                borderLeft: 4,
                borderColor: 'primary.main',
              },
              '&.Mui-selected:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.12)',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: location.pathname.startsWith('/data') ? 'primary.main' : 'inherit',
                minWidth: '40px',
              }}
            >
              <StorageIcon />
            </ListItemIcon>
            <ListItemText primary="Data" />
            {tablesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>

        {/* Tables submenu */}
        <Collapse in={tablesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* All Tables option */}
            <ListItemButton
              selected={location.pathname === '/data'}
              onClick={() => handleNavClick('/data')}
              sx={{ pl: 4 }}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <TableChartIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All Tables" />
            </ListItemButton>

            {/* Individual tables */}
            {!tablesLoading &&
              tables &&
              tables.map((table) => (
                <ListItemButton
                  key={table.id}
                  selected={location.pathname === `/data/${table.name}`}
                  onClick={() => handleTableClick(table.name)}
                  sx={{ pl: 4 }}
                >
                  <ListItemIcon sx={{ minWidth: '40px' }}>
                    <TableChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={table.name} />
                </ListItemButton>
              ))}

            {/* Show loading indicator or no tables message */}
            {tablesLoading && (
              <ListItem sx={{ pl: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Loading tables...
                </Typography>
              </ListItem>
            )}

            {!tablesLoading && (!tables || tables.length === 0) && (
              <ListItem sx={{ pl: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  No tables available
                </Typography>
              </ListItem>
            )}
          </List>
        </Collapse>
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center' }}
        >
          Armada KV Database
        </Typography>
      </Box>
    </div>
  );
};

export default Sidebar;
