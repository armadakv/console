import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';

import KeyValueFilter from './components/KeyValueFilter';
import KeyValueTable from './components/KeyValueTable';
import TableSelector from './components/TableSelector';

import { useDeleteKeyValuePair, useKeyValuePairs, useStatus } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Breadcrumb } from '@/shared/Breadcrumb';
import { CardWithHeader } from '@/shared/CardWithHeader';

const DataPage: React.FC = () => {
  const { table } = useParams<{ table: string }>();
  const navigate = useNavigate();

  // State for form inputs (what user is typing)
  const [prefix, setPrefix] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'prefix' | 'range'>('prefix');

  // State for applied filters (what's actually used for API calls)
  const [appliedPrefix, setAppliedPrefix] = useState<string>('');
  const [appliedStart, setAppliedStart] = useState<string>('');
  const [appliedEnd, setAppliedEnd] = useState<string>('');
  const [appliedFilterMode, setAppliedFilterMode] = useState<'prefix' | 'range'>('prefix');

  const deleteMutation = useDeleteKeyValuePair();

  // Get loading state for filter
  const { isLoading: keyValuePairsLoading } = useKeyValuePairs(
    table || '',
    appliedFilterMode === 'prefix' ? appliedPrefix : '',
    appliedFilterMode === 'range' ? appliedStart : '',
    appliedFilterMode === 'range' ? appliedEnd : '',
  );

  // Get server status for table metadata
  const { data: status, isLoading: statusLoading } = useStatus();

  // Extract table information from status
  const tableInfo = React.useMemo(() => {
    if (!status?.servers || !table) return null;

    // Look for the table in any server's tables
    for (const server of status.servers) {
      if (server.tables && server.tables[table]) {
        return {
          serverId: server.id,
          serverName: server.name,
          tableStatus: server.tables[table],
        };
      }
    }
    return null;
  }, [status, table]);

  // Use the usePageTitle hook
  usePageTitle(table ? `Table: ${table}` : 'Key-Value Data');

  // Handle filter mode change
  const handleFilterModeChange = (mode: 'prefix' | 'range') => {
    setFilterMode(mode);
    // Reset filter values when switching modes
    if (mode === 'prefix') {
      setStart('');
      setEnd('');
    } else {
      setPrefix('');
    }
  };

  // Apply filters function
  const applyFilters = () => {
    setAppliedFilterMode(filterMode);
    if (filterMode === 'prefix') {
      setAppliedPrefix(prefix);
      setAppliedStart('');
      setAppliedEnd('');
    } else {
      setAppliedPrefix('');
      setAppliedStart(start);
      setAppliedEnd(end);
    }
  };

  // Handle table selection
  const handleTableChange = (tableName: string) => {
    navigate(`/data/${tableName}`);
  };

  // Table selection page
  if (!table) {
    return (
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb items={[{ label: 'Data', current: true }]} />

        <CardWithHeader title="Tables">
          <div className="p-6">
            <TableSelector selectedTable="" onTableChange={handleTableChange} />
          </div>
        </CardWithHeader>
      </div>
    );
  }

  // Delete a key-value pair
  const deleteKeyValuePair = async (key: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the key "${key}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        table,
        key,
      });
      // Success is already handled by React Query mutation
    } catch (error) {
      console.error('Error deleting key-value pair:', error);
      // Show user-friendly error message
      window.alert(
        `Failed to delete key "${key}". ${
          error instanceof Error ? error.message : 'Please try again.'
        }`,
      );
    }
  };

  // Create add button for the card header
  const addButton = (
    <RouterLink
      to={`/data/${table}/add`}
      className="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Key-Value Pair
    </RouterLink>
  );

  // Table data page (with specified table)
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumb
        items={[
          { label: 'Data', href: '/data' },
          { label: table, current: true },
        ]}
      />

      {/* Table Metadata */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Table: {table}
            </h2>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {keyValuePairsLoading ? 'Loading metadata...' : 'Filtered view of table data'}
                {!keyValuePairsLoading && appliedFilterMode === 'prefix' && appliedPrefix && (
                  <span> • Filter: prefix "{appliedPrefix}"</span>
                )}
                {!keyValuePairsLoading &&
                  appliedFilterMode === 'range' &&
                  (appliedStart || appliedEnd) && (
                    <span>
                      {' '}
                      • Filter: range {appliedStart || 'start'} to {appliedEnd || 'end'}
                    </span>
                  )}
              </p>
              {tableInfo && (
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    Server: {tableInfo.serverName} ({tableInfo.serverId})
                  </span>
                  <span>Raft Index: {tableInfo.tableStatus.raftIndex.toLocaleString()}</span>
                  <span>Raft Term: {tableInfo.tableStatus.raftTerm}</span>
                  <span>Leader: {tableInfo.tableStatus.leader}</span>
                </div>
              )}
              {statusLoading && !tableInfo && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading server metadata...
                </p>
              )}
            </div>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Key-Value Store</p>
            {tableInfo && (
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                <div>DB Size: {(tableInfo.tableStatus.dbSize / 1024).toFixed(1)} KB</div>
                <div>Log Size: {(tableInfo.tableStatus.logSize / 1024).toFixed(1)} KB</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Browse Data Card */}
      <CardWithHeader title="Browse Data" action={addButton}>
        <div className="space-y-6">
          {/* Filter form */}
          <div className="px-6 py-4">
            <KeyValueFilter
              prefix={prefix}
              setPrefix={setPrefix}
              start={start}
              setStart={setStart}
              end={end}
              setEnd={setEnd}
              filterMode={filterMode}
              onFilterModeChange={handleFilterModeChange}
              onFilter={applyFilters}
              disabled={false}
            />
          </div>

          {/* Data table */}
          <KeyValueTable
            table={table}
            prefix={appliedFilterMode === 'prefix' ? appliedPrefix : ''}
            start={appliedFilterMode === 'range' ? appliedStart : ''}
            end={appliedFilterMode === 'range' ? appliedEnd : ''}
            onDeletePair={deleteKeyValuePair}
          />
        </div>
      </CardWithHeader>

      {/* Mobile Add Button - Fixed Position */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <RouterLink
          to={`/data/${table}/add`}
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </RouterLink>
      </div>
    </div>
  );
};

export default DataPage;
