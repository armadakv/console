import {
  Typography, Box, Grid, Paper, useTheme, Divider, List, ListItem, ListItemText,
  Accordion, AccordionSummary, AccordionDetails, Tooltip, Chip, Table, TableHead,
  TableRow, TableCell, TableBody, TableContainer
} from '@mui/material';
import React, { useMemo } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StorageIcon from '@mui/icons-material/Storage';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import CardWithHeader from '../../components/shared/CardWithHeader';
import ErrorState from '../../components/shared/ErrorState';
import LoadingState from '../../components/shared/LoadingState';
import RefreshButton from '../../components/shared/RefreshButton';
import StatusChip from '../../components/shared/StatusChip';
import usePageTitle from '../../hooks/usePageTitle';
import { useStatus, useTables } from '../../hooks/useApi';

// Utility function to format bytes to human-readable format
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { data: statusData, isLoading: isStatusLoading, isError: isStatusError, error: statusError, refetch: refetchStatus } = useStatus();
  const { data: tablesData, isLoading: isTablesLoading } = useTables();

  // Calculate cluster health
  const clusterHealth = useMemo(() => {
    if (!statusData?.servers || statusData.servers.length === 0) {
      return { status: 'Unknown', message: 'No servers found' };
    }

    // Check if any server has errors
    const serversWithErrors = statusData.servers.filter(
      server => server.errors && server.errors.length > 0
    );

    // Check if any server has a status that's not 'ok'
    const serversWithIssues = statusData.servers.filter(
      server => server.status !== 'ok'
    );

    if (serversWithIssues.length > 0) {
      return {
        status: 'Error',
        message: `${serversWithIssues.length} ${serversWithIssues.length === 1 ? 'server has' : 'servers have'} issues`
      };
    }

    if (serversWithErrors.length > 0) {
      return {
        status: 'Warning',
        message: `${serversWithErrors.length} ${serversWithErrors.length === 1 ? 'server has' : 'servers have'} warnings`
      };
    }

    return { status: 'Healthy', message: 'All systems operational' };
  }, [statusData]);

  // Count total available tables across all servers
  const totalTables = useMemo(() => {
    if (!statusData?.servers) return 0;

    const tableNames = new Set<string>();
    statusData.servers.forEach(server => {
      if (server.tables) {
        Object.keys(server.tables).forEach(tableName => {
          tableNames.add(tableName);
        });
      }
    });

    return tableNames.size;
  }, [statusData]);

  // Common card height styling
  const summaryCardSx = {
    p: 3,
    textAlign: 'center',
    borderRadius: 2,
    height: '100%', // Ensure consistent height
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  // Create refresh action button for header using RefreshButton component
  const refreshButton = (
    <RefreshButton
      onClick={() => refetchStatus()}
      disabled={isStatusLoading}
      variant="header"
      tooltipTitle="Refresh dashboard data"
    />
  );

  // Use the usePageTitle hook instead of PageHeader component
  usePageTitle('Dashboard', refreshButton);

  if (isStatusLoading) {
    return <LoadingState message="Loading dashboard data..." />;
  }

  if (isStatusError) {
    return (
      <ErrorState
        error={statusError}
        message="Failed to fetch dashboard data. Please try again later."
        onRetry={refetchStatus}
      />
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          sx={{
            ...summaryCardSx,
            bgcolor: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
            border: `1px solid ${theme.palette.primary.main}`,
          }}
        >
          <Typography variant="h6">Servers</Typography>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Typography variant="h2" sx={{ fontWeight: 'medium' }}>
              {statusData?.servers?.length || 0}
            </Typography>
          </Box>
          <Typography variant="body2">
            {statusData?.servers?.length === 1 ? 'Server' : 'Servers'} online
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          sx={{
            ...summaryCardSx,
            bgcolor: 'rgba(76, 175, 80, 0.1)',
            color: 'success.main',
            border: '1px solid',
            borderColor: 'success.main',
          }}
        >
          <Typography variant="h6">Tables</Typography>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Typography variant="h2" sx={{ fontWeight: 'medium' }}>
              {totalTables}
            </Typography>
          </Box>
          <Typography variant="body2">Available tables</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          sx={{
            ...summaryCardSx,
            bgcolor: clusterHealth.status === 'Healthy'
              ? 'rgba(76, 175, 80, 0.1)'
              : clusterHealth.status === 'Warning'
                ? 'rgba(255, 152, 0, 0.1)'
                : 'rgba(244, 67, 54, 0.1)',
            color: clusterHealth.status === 'Healthy'
              ? 'success.main'
              : clusterHealth.status === 'Warning'
                ? 'warning.dark'
                : 'error.main',
            border: '1px solid',
            borderColor: clusterHealth.status === 'Healthy'
              ? 'success.main'
              : clusterHealth.status === 'Warning'
                ? 'warning.main'
                : 'error.main',
          }}
        >
          <Typography variant="h6">Cluster Health</Typography>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {clusterHealth.status === 'Healthy' && <CheckCircleOutlineIcon sx={{ mr: 1 }} />}
              {clusterHealth.status === 'Warning' && <WarningAmberIcon sx={{ mr: 1 }} />}
              {clusterHealth.status === 'Error' && <ErrorOutlineIcon sx={{ mr: 1 }} />}
              {clusterHealth.status === 'Unknown' && <ErrorOutlineIcon sx={{ mr: 1 }} />}
              <Typography variant="h2" sx={{ fontWeight: 'medium' }}>
                {clusterHealth.status}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2">{clusterHealth.message}</Typography>
        </Paper>
      </Grid>

      {/* Server Status Section */}
      <Grid item xs={12}>
        <CardWithHeader title="Server Status">
          {statusData?.servers && statusData.servers.length > 0 ? (
            <Grid container spacing={2}>
              {statusData.servers.map((server) => (
                <Grid item xs={12} key={server.id}>
                  <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderLeft: 4,
                      borderLeftColor: server.status === 'ok'
                        ? (server.errors && server.errors.length > 0)
                          ? 'warning.main'
                          : 'success.main'
                        : 'error.main',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="medium">
                        {server.name || server.id}
                      </Typography>
                      <StatusChip status={server.status} />
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Message:</strong>{' '}
                        {server.message || 'No status message available'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>ID:</strong> {server.id}
                      </Typography>

                      {/* Display errors if any */}
                      {server.errors && server.errors.length > 0 && (
                        <Accordion
                          disableGutters
                          elevation={0}
                          sx={{
                            bgcolor: 'rgba(244, 67, 54, 0.05)',
                            '&:before': { display: 'none' },
                            border: '1px solid',
                            borderColor: 'error.light',
                            borderRadius: '4px !important',
                            mt: 1
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ borderRadius: 1 }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ErrorOutlineIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                              <Typography color="error" variant="body2" fontWeight="medium">
                                {server.errors.length} {server.errors.length === 1 ? 'Error' : 'Errors'} Detected
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense disablePadding>
                              {server.errors.map((error, index) => (
                                <ListItem key={index} divider={index < server.errors!.length - 1}>
                                  <ListItemText primary={error} primaryTypographyProps={{ color: 'error' }} />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* Display tables */}
                      {server.tables && Object.keys(server.tables).length > 0 && (
                        <Accordion
                          disableGutters
                          elevation={0}
                          sx={{
                            '&:before': { display: 'none' },
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '4px !important',
                            mt: 1
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ borderRadius: 1 }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StorageIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                              <Typography color="primary" variant="body2" fontWeight="medium">
                                {Object.keys(server.tables).length} {Object.keys(server.tables).length === 1 ? 'Table' : 'Tables'}
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                              <Table>
                                <TableHead sx={{ bgcolor: 'background.default' }}>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Table Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Log Size</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>DB Size</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Leader</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Raft Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {Object.entries(server.tables).map(([name, status]) => (
                                    <TableRow key={name}>
                                      <TableCell>{name}</TableCell>
                                      <TableCell>{formatBytes(status.logSize)}</TableCell>
                                      <TableCell>{formatBytes(status.dbSize)}</TableCell>
                                      <TableCell>{status.leader}</TableCell>
                                      <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                          <Tooltip title="Raft Index" placement="top">
                                            <Chip
                                              size="small"
                                              label={`Index: ${status.raftIndex}`}
                                              variant="outlined"
                                              sx={{ fontSize: '0.75rem' }}
                                            />
                                          </Tooltip>
                                          <Tooltip title="Raft Term" placement="top">
                                            <Chip
                                              size="small"
                                              label={`Term: ${status.raftTerm}`}
                                              variant="outlined"
                                              sx={{ fontSize: '0.75rem' }}
                                            />
                                          </Tooltip>
                                        </Box>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 3 }}>
              No servers found. Please check your connection to the Armada cluster.
            </Typography>
          )}
        </CardWithHeader>
      </Grid>

      {/* Tables Summary Section */}
      <Grid item xs={12} md={6}>
        <CardWithHeader title="Tables" sx={{ height: '100%' }}>
          {isTablesLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <LoadingState message="Loading tables..." />
            </Box>
          ) : tablesData && tablesData.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'background.default' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tablesData.map(table => (
                    <TableRow key={table.id}>
                      <TableCell>{table.name}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{table.id}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No tables found.
              </Typography>
            </Box>
          )}
        </CardWithHeader>
      </Grid>

      {/* Cluster Summary Section */}
      <Grid item xs={12} md={6}>
        <CardWithHeader title="Cluster Summary" sx={{ height: '100%' }}>
          <Box sx={{ p: 3 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                borderLeft: 4,
                borderLeftColor:
                  clusterHealth.status === 'Healthy' ? 'success.main' :
                    clusterHealth.status === 'Warning' ? 'warning.main' :
                      'error.main',
                mb: 2
              }}
            >
              <Typography variant="subtitle1" fontWeight="medium">
                Status: {clusterHealth.status}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {clusterHealth.message}
              </Typography>
            </Paper>

            <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
              Cluster Statistics
            </Typography>
            <List dense>
              <ListItem divider>
                <ListItemText
                  primary="Total Servers"
                  secondary={statusData?.servers?.length || 0}
                />
              </ListItem>
              <ListItem divider>
                <ListItemText
                  primary="Total Tables"
                  secondary={totalTables}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Health Status"
                  secondary={clusterHealth.status}
                />
              </ListItem>
            </List>
          </Box>
        </CardWithHeader>
      </Grid>
    </Grid>
  );
};

export default DashboardPage;
