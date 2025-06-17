import React from 'react';

import ClusterSummarySection from './components/ClusterSummarySection';
import ErrorAccordion from './components/ErrorAccordion';
import ServerStatusSection from './components/ServerStatusSection';
import TablesSection from './components/TablesSection';

import { useNavigation } from '@/context/NavigationContext';
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
  const { setPageAction, resetPageAction } = useNavigation();

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

  const handleRefresh = React.useCallback(() => {
    refetchStatus();
    refetchTables();
  }, [refetchStatus, refetchTables]);

  // Set up the refresh button in the header
  React.useEffect(() => {
    setPageAction(<RefreshButton onClick={handleRefresh} variant="header" label="Refresh" />);

    // Clean up when component unmounts
    return () => resetPageAction();
  }, [setPageAction, resetPageAction, handleRefresh]);

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
      <ClusterSummarySection
        status={status?.servers?.[0]?.status || 'unknown'}
        message={status?.servers?.[0]?.message || 'No status available'}
        totalServers={status?.servers?.length || 0}
        totalTables={tables?.length || 0}
      />

      <ServerStatusSection servers={status?.servers || []} />

      <TablesSection tables={tables} loading={tablesLoading} />

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
