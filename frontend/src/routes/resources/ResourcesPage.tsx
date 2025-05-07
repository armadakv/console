import { Box, Typography, Grid, Paper } from '@mui/material';
import React from 'react';
import { useClusterInfo, useStatus } from '../../hooks/useApi';

import CardWithHeader from '../../components/shared/CardWithHeader';
import ErrorState from '../../components/shared/ErrorState';
import LoadingState from '../../components/shared/LoadingState';
import RefreshButton from '../../components/shared/RefreshButton';
import usePageTitle from '../../hooks/usePageTitle';
import ResourceMetricsGrid from './components/ResourceMetricsGrid';
import ServerResourcesCard from './components/ServerResourcesCard';

const ResourcesPage: React.FC = () => {
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

  // Prepare server list for ServerResourcesCard with address information
  const serverList = statusData?.servers?.map(server => {
    // Find the corresponding server in cluster data to get its address
    const clusterMember = clusterData?.members?.find(member => member.id === server.id);
    // Get the first client URL as the server address, format is typically "http://127.0.0.1:5101"
    const fullAddress = clusterMember?.clientURLs?.[0] || '';
    // Extract just the host:port part (e.g., "127.0.0.1:5101")
    const address = fullAddress ? new URL(fullAddress).host : undefined;

    return {
      id: server.id,
      name: server.name || server.id.substring(0, 8),
      status: server.status,
      isCurrent: clusterData?.nodeId === server.id,
      address
    };
  }) || [];

  return (
    <Grid container spacing={3}>
      {/* Overall Cluster Metrics */}
      <Grid item xs={12}>
        <CardWithHeader title="Cluster Resources">
          <Box sx={{ p: 2 }}>
            <ResourceMetricsGrid
              serverId={clusterData?.nodeId}
              serverAddress={clusterData?.nodeAddress}
            />
          </Box>
        </CardWithHeader>
      </Grid>

      {/* Server-specific Resources */}
      <Grid item xs={12}>
        <ServerResourcesCard servers={serverList} />
      </Grid>
    </Grid>
  );
};

export default ResourcesPage;
