import { Typography, Box, Grid, Paper, useTheme, Divider } from '@mui/material';
import React from 'react';

import CardWithHeader from '../../components/shared/CardWithHeader';
import ErrorState from '../../components/shared/ErrorState';
import LoadingState from '../../components/shared/LoadingState';
import PageHeader from '../../components/shared/PageHeader';
import RefreshButton from '../../components/shared/RefreshButton';
import StatusChip from '../../components/shared/StatusChip';
import { useStatus } from '../../hooks/useApi';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { data, isLoading, isError, error, refetch } = useStatus();

  // Create refresh action button for header using RefreshButton component
  const refreshButton = (
    <RefreshButton
      onClick={() => refetch()}
      disabled={isLoading}
      variant="button"
      label="Refresh"
    />
  );

  if (isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <LoadingState message="Loading dashboard data..." />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorState
          error={error}
          message="Failed to fetch dashboard data. Please try again later."
          onRetry={refetch}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" action={refreshButton} />

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              border: `1px solid ${theme.palette.primary.main}`,
            }}
          >
            <Typography variant="h6">Servers</Typography>
            <Typography variant="h2" sx={{ my: 2, fontWeight: 'medium' }}>
              {data?.servers?.length || 0}
            </Typography>
            <Typography variant="body2">
              {data?.servers?.length === 1 ? 'Server' : 'Servers'} online
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              color: 'success.main',
              border: '1px solid',
              borderColor: 'success.main',
            }}
          >
            <Typography variant="h6">Tables</Typography>
            <Typography variant="h2" sx={{ my: 2, fontWeight: 'medium' }}>
              {data?.tables?.length || 0}
            </Typography>
            <Typography variant="body2">Available tables</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'rgba(255, 152, 0, 0.1)',
              color: 'warning.dark',
              border: '1px solid',
              borderColor: 'warning.main',
            }}
          >
            <Typography variant="h6">Cluster Health</Typography>
            <Typography variant="h5" sx={{ my: 2, fontWeight: 'medium' }}>
              {data?.clusterHealth || 'Unknown'}
            </Typography>
            <Typography variant="body2">Current cluster status</Typography>
          </Paper>
        </Grid>

        {/* Server Status Section */}
        <Grid item xs={12}>
          <CardWithHeader title="Server Status">
            {data?.servers && data.servers.length > 0 ? (
              <Grid container spacing={2}>
                {data.servers.map((server) => (
                  <Grid item xs={12} key={server.id}>
                    <Paper
                      elevation={0}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        borderLeft: 4,
                        borderLeftColor: server.status === 'ok' ? 'success.main' : 'error.main',
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

        {/* Resources Section */}
        <Grid item xs={12}>
          <CardWithHeader title="Resources" sx={{ mt: 2 }}>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 2 }}>
              No resources available yet. This section will display Armada resources when connected.
            </Typography>
          </CardWithHeader>
        </Grid>
      </Grid>
    </>
  );
};

export default DashboardPage;
