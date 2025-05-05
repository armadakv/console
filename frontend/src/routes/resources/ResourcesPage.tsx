import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import React from 'react';
import { useClusterInfo, useStatus } from '../../hooks/useApi';

import CardWithHeader from '../../components/shared/CardWithHeader';
import ErrorState from '../../components/shared/ErrorState';
import LoadingState from '../../components/shared/LoadingState';
import RefreshButton from '../../components/shared/RefreshButton';
import usePageTitle from '../../hooks/usePageTitle';

const ResourcesPage: React.FC = () => {
  const theme = useTheme();
  const { data: statusData, isLoading: statusLoading, isError: statusError, error: statusErrorData, refetch: refetchStatus } = useStatus();
  const { data: clusterData, isLoading: clusterLoading, isError: clusterError, error: clusterErrorData, refetch: refetchCluster } = useClusterInfo();

  const isLoading = statusLoading || clusterLoading;
  const isError = statusError || clusterError;
  const error = statusErrorData || clusterErrorData;

  // Create refresh action button for header using RefreshButton component
  const refreshButton = (
    <RefreshButton
      onClick={() => {
        refetchStatus();
        refetchCluster();
      }}
      disabled={isLoading}
      variant="header"
      tooltipTitle="Refresh resources data"
    />
  );

  // Use the usePageTitle hook instead of PageHeader component
  usePageTitle('Resources', refreshButton);

  if (isLoading) {
    return <LoadingState message="Loading resources data..." />;
  }

  if (isError) {
    return <ErrorState error={error} message="Failed to fetch resources data." onRetry={() => {
      refetchStatus();
      refetchCluster();
    }} />;
  }

  const onlineServers = statusData?.servers?.filter(server => server.status === 'ok')?.length || 0;
  const totalServers = statusData?.servers?.length || 0;

  return (
    <Grid container spacing={3}>
      {/* System Resources */}
      <Grid item xs={12}>
        <CardWithHeader title="Cluster Resources">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  borderLeft: 4,
                  borderLeftColor: 'primary.main',
                }}
                variant="outlined"
              >
                <Typography color="textSecondary" variant="subtitle2">
                  Servers Online
                </Typography>
                <Typography variant="h4" sx={{ my: 1, fontWeight: 'medium' }}>
                  {onlineServers}/{totalServers}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  borderLeft: 4,
                  borderLeftColor: 'info.main',
                }}
                variant="outlined"
              >
                <Typography color="textSecondary" variant="subtitle2">
                  Current Node
                </Typography>
                <Typography variant="h4" sx={{ my: 1, fontWeight: 'medium' }}>
                  {clusterData?.nodeId ? clusterData.nodeId.substring(0, 8) : 'Unknown'}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  height: '100%',
                  borderLeft: 4,
                  borderLeftColor: 'success.main',
                }}
                variant="outlined"
              >
                <Typography color="textSecondary" variant="subtitle2">
                  Total Cluster Members
                </Typography>
                <Typography variant="h4" sx={{ my: 1, fontWeight: 'medium' }}>
                  {clusterData?.members?.length || 0}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardWithHeader>
      </Grid>

      {/* Server Information */}
      <Grid item xs={12}>
        <CardWithHeader title="Server Information">
          <Grid container spacing={3}>
            {clusterData?.members?.map((member, index) => (
              <Grid item xs={12} md={6} key={member.id}>
                <Paper
                  sx={{
                    p: 2,
                    height: '100%',
                    borderLeft: 4,
                    borderLeftColor: member.id === clusterData.nodeId ? 'primary.main' : 'divider',
                  }}
                  variant="outlined"
                >
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                    {member.name || member.id.substring(0, 8)}
                    {member.id === clusterData.nodeId && ' (current)'}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    ID: {member.id}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Client URLs:</strong> {member.clientURLs.join(', ')}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Peer URLs:</strong> {member.peerURLs.join(', ')}
                  </Typography>
                </Paper>
              </Grid>
            ))}

            {(!clusterData?.members || clusterData.members.length === 0) && (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary" align="center">
                  No server information available
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardWithHeader>
      </Grid>
    </Grid>
  );
};

export default ResourcesPage;
