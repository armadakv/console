import React, { useState } from 'react';
import { useStatus } from '../../hooks/useApi';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableRow,
  TableCell,
  Paper,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StorageIcon from '@mui/icons-material/Storage';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import CardWithHeader from '../../components/shared/CardWithHeader';
import StyledTable from '../../components/shared/StyledTable';
import StatusChip from '../../components/shared/StatusChip';
import RefreshButton from '../../components/shared/RefreshButton';

const ServerConfig: React.FC = () => {
  const theme = useTheme();
  const { data: statusData, isLoading, error, refetch } = useStatus();
  const [expandedServer, setExpandedServer] = useState<string | false>(false);

  const handleServerToggle = (serverId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedServer(isExpanded ? serverId : false);
  };

  // Helper function to format configuration values
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Define table columns for config data
  const configColumns = [
    { id: 'key', label: 'Key', minWidth: 150 },
    { id: 'value', label: 'Value', minWidth: 250 },
  ];

  // Helper function to render config data as a table
  const renderConfigTable = (config: Record<string, any> | undefined) => {
    if (!config || Object.keys(config).length === 0) {
      return <Typography variant="body2" color="text.secondary">No configuration data available</Typography>;
    }

    return (
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        <StyledTable columns={configColumns} containerSx={{ maxHeight: 400 }}>
          {Object.entries(config).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => (
            <TableRow key={key} hover>
              <TableCell sx={{ maxWidth: '30%', overflowWrap: 'break-word' }}>{key}</TableCell>
              <TableCell sx={{ 
                maxWidth: '70%', 
                overflowWrap: 'break-word', 
                fontFamily: 'monospace',
                fontSize: '0.85rem'
              }}>
                {formatValue(value)}
              </TableCell>
            </TableRow>
          ))}
        </StyledTable>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box p={3}>
        <LoadingState message="Loading server configuration..." height={200} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <ErrorState 
          error={error} 
          message="Error loading server configuration" 
          onRetry={refetch}
        />
      </Box>
    );
  }

  if (!statusData || !statusData.servers || statusData.servers.length === 0) {
    return (
      <Box p={3}>
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            borderLeft: 4,
            borderLeftColor: 'info.main' 
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No server information available
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium">Server Configuration</Typography>
        <RefreshButton 
          onClick={() => refetch()} 
          disabled={isLoading} 
          tooltipTitle="Refresh server status"
        />
      </Box>
      
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2, 
          mb: 3,
          bgcolor: 'rgba(25, 118, 210, 0.05)',
          borderLeft: 4,
          borderLeftColor: 'info.main',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          This section displays the configuration for each server in the Armada cluster.
          Expand a server to see its configuration details.
        </Typography>
      </Paper>

      {statusData.servers.map((server) => (
        <Accordion 
          key={server.id}
          expanded={expandedServer === server.id}
          onChange={handleServerToggle(server.id)}
          sx={{ 
            mb: 2, 
            borderRadius: 2, 
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
            '&:before': {
              display: 'none',
            },
            ...(expandedServer === server.id ? {
              boxShadow: theme.shadows[1],
            } : {})
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{
              borderBottom: expandedServer === server.id ? '1px solid' : 'none',
              borderBottomColor: 'divider',
              bgcolor: expandedServer === server.id ? 'background.default' : 'transparent',
            }}
          >
            <Box display="flex" alignItems="center" width="100%">
              <StorageIcon 
                color={server.status === 'ok' ? 'success' : 'error'}
                sx={{ mr: 1.5 }}
              />
              <Typography sx={{ flexGrow: 1, fontWeight: 'medium' }}>
                {server.name || server.id}
              </Typography>
              <StatusChip status={server.status} />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 2 }}>
            <CardWithHeader 
              title="Server Details" 
              sx={{ mb: 2, borderLeft: 3, borderColor: server.status === 'ok' ? 'success.main' : 'error.main' }}
              contentSx={{ py: 2 }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Status:</strong> {server.status}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>Message:</strong> {server.message || 'No message available'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>ID:</strong> {server.id}
              </Typography>
            </CardWithHeader>

            <CardWithHeader 
              title="Configuration"
              contentSx={{ py: 2 }}
            >
              {renderConfigTable(server.config)}
            </CardWithHeader>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default ServerConfig;