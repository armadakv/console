import React from 'react';

import ClusterSummarySection from './components/ClusterSummarySection';
import ErrorAccordion from './components/ErrorAccordion';
import ServerStatusSection from './components/ServerStatusSection';
import TablesSection from './components/TablesSection';

import { useStatus, useTables } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ErrorState } from '@/shared/ErrorState';
import { LoadingState } from '@/shared/LoadingState';
import { RefreshButton } from '@/shared/RefreshButton';

/**
 * Dashboard page displaying overall system status, server health, and tables
 */
const DashboardPage: React.FC = () => {
  usePageTitle('Dashboard');

  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useStatus();
  const {
    data: tables,
    isLoading: tablesLoading,
    error: tablesError,
    refetch: refetchTables,
  } = useTables();

  const isLoading = statusLoading || tablesLoading;
  const hasError = statusError || tablesError;

  if (isLoading) {
    return <LoadingState />;
  }

  if (hasError) {
    return (
      <ErrorState
        error={statusError || tablesError}
        onRetry={() => {
          refetchStatus();
          refetchTables();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <RefreshButton
          onClick={() => {
            refetchStatus();
            refetchTables();
          }}
          variant="button"
          label="Refresh"
        />
      </div>

      {/* Server Status Section */}
      <ServerStatusSection servers={status?.servers || []} />

      {/* Cluster Summary Section */}
      <ClusterSummarySection
        status={status?.servers?.[0]?.status || 'unknown'}
        message={status?.servers?.[0]?.message || 'No status available'}
        totalServers={status?.servers?.length || 0}
        totalTables={tables?.length || 0}
      />

      {/* Tables Section */}
      <TablesSection tables={tables} loading={tablesLoading} />

      {/* Error Display */}
      {(statusError || tablesError) && (
        <ErrorAccordion
          errors={[
            ...(statusError ? [String(statusError)] : []),
            ...(tablesError ? [String(tablesError)] : []),
          ]}
        />
      )}
    </div>
  );
};

export default DashboardPage;
