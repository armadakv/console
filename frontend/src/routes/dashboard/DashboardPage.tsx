import { Grid, useTheme } from '@mui/material';
import React, { useMemo } from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import ErrorState from '../../components/shared/ErrorState';
import LoadingState from '../../components/shared/LoadingState';
import RefreshButton from '../../components/shared/RefreshButton';
import usePageTitle from '../../hooks/usePageTitle';
import { useStatus, useTables } from '../../hooks/useApi';

import SummaryCard from './components/SummaryCard';
import ServerStatusSection from './components/ServerStatusSection';
import TablesSection from './components/TablesSection';
import ClusterSummarySection from './components/ClusterSummarySection';

/**
 * Dashboard page displaying overall system status, server health, and tables
 */
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

  // Create refresh action button for header using RefreshButton component
  const refreshButton = useMemo(() => {
    return (
      <RefreshButton
        onClick={() => {
          refetchStatus();
        }}
        disabled={isStatusLoading}
        variant="header"
        tooltipTitle="Refresh dashboard data"
      />
    );
  }, [isStatusLoading, refetchStatus]);

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

  // Get the appropriate icon for cluster health status
  const getClusterHealthIcon = () => {
    switch (clusterHealth.status) {
      case 'Healthy':
        return <CheckCircleOutlineIcon />;
      case 'Warning':
        return <WarningAmberIcon />;
      case 'Error':
      case 'Unknown':
      default:
        return <ErrorOutlineIcon />;
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} md={4}>
        <SummaryCard
          title="Servers"
          value={statusData?.servers?.length || 0}
          subtitle={`${statusData?.servers?.length === 1 ? 'Server' : 'Servers'} online`}
          color="primary"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <SummaryCard
          title="Tables"
          value={totalTables}
          subtitle="Available tables"
          color="success"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <SummaryCard
          title="Cluster Health"
          value={clusterHealth.status}
          subtitle={clusterHealth.message}
          color={
            clusterHealth.status === 'Healthy'
              ? 'success'
              : clusterHealth.status === 'Warning'
                ? 'warning'
                : 'error'
          }
          icon={getClusterHealthIcon()}
        />
      </Grid>

      {/* Server Status Section */}
      <Grid item xs={12}>
        <ServerStatusSection servers={statusData?.servers || []} />
      </Grid>

      {/* Tables Summary Section */}
      <Grid item xs={12} md={6}>
        <TablesSection
          tables={tablesData}
          loading={isTablesLoading}
        />
      </Grid>

      {/* Cluster Summary Section */}
      <Grid item xs={12} md={6}>
        <ClusterSummarySection
          status={clusterHealth.status}
          message={clusterHealth.message}
          totalServers={statusData?.servers?.length || 0}
          totalTables={totalTables}
        />
      </Grid>
    </Grid>
  );
};

export default DashboardPage;
