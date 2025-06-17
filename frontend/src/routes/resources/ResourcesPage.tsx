import React, { useMemo } from 'react';

import ResourceMetricsGrid from './components/ResourceMetricsGrid';
import ServerResourcesCard from './components/ServerResourcesCard';

import { useClusterInfo, useStatus } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Breadcrumb } from '@/shared/Breadcrumb';
import { CardWithHeader } from '@/shared/CardWithHeader';
import { ErrorState } from '@/shared/ErrorState';
import { LoadingState } from '@/shared/LoadingState';
import { RefreshButton } from '@/shared/RefreshButton';

const ResourcesPage: React.FC = () => {
  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
    error: statusErrorData,
    refetch: refetchStatus,
  } = useStatus();
  const {
    data: clusterData,
    isLoading: clusterLoading,
    isError: clusterError,
    error: clusterErrorData,
    refetch: refetchCluster,
  } = useClusterInfo();

  const isLoading = statusLoading || clusterLoading;
  const isError = statusError || clusterError;
  const error = statusErrorData || clusterErrorData;

  // Create refresh action button for header using RefreshButton component
  const refreshButton = useMemo(() => {
    return (
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
  }, [isLoading, refetchStatus, refetchCluster]);

  // Use the usePageTitle hook instead of PageHeader component
  usePageTitle('Resources', refreshButton);

  if (isLoading) {
    return <LoadingState message="Loading resources data..." />;
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        message="Failed to fetch resources data."
        onRetry={() => {
          refetchStatus();
          refetchCluster();
        }}
      />
    );
  }

  // Prepare server list for ServerResourcesCard with address information
  const serverList =
    statusData?.servers?.map((server) => {
      // Find the corresponding server in cluster data to get its address
      const clusterMember = clusterData?.members?.find((member) => member.id === server.id);
      // Get the first client URL as the server address, format is typically "http://127.0.0.1:5101"
      const fullAddress = clusterMember?.clientURLs?.[0] || '';
      // Extract just the host:port part (e.g., "127.0.0.1:5101")
      const address = fullAddress ? new URL(fullAddress).host : undefined;

      return {
        id: server.id,
        name: server.name || server.id.substring(0, 8),
        status: server.status,
        isCurrent: clusterData?.nodeId === server.id,
        address,
      };
    }) || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={[{ label: 'Resources', current: true }]} />
      {/* Overall Cluster Metrics */}
      <CardWithHeader title="Cluster Resources">
        <div className="p-4">
          <ResourceMetricsGrid
            serverId={clusterData?.nodeId}
            serverAddress={clusterData?.nodeAddress}
          />
        </div>
      </CardWithHeader>

      {/* Server-specific Resources */}
      <ServerResourcesCard servers={serverList} />
    </div>
  );
};

export default ResourcesPage;
