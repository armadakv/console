import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

import KeyValueFilter from './components/KeyValueFilter';
import KeyValueTable from './components/KeyValueTable';
import TableSelector from './components/TableSelector';

import { useDeleteKeyValuePair, useKeyValuePairs, useStatus } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Breadcrumb } from '@/shared/Breadcrumb';
import { CardWithHeader } from '@/shared/CardWithHeader';
import ConfirmDialog from '@/shared/ConfirmDialog';

const DataPage: React.FC = () => {
  const { table } = useParams({ strict: false }) as { table?: string };
  const navigate = useNavigate();

  const [prefix, setPrefix] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'prefix' | 'range'>('prefix');

  const [appliedPrefix, setAppliedPrefix] = useState<string>('');
  const [appliedStart, setAppliedStart] = useState<string>('');
  const [appliedEnd, setAppliedEnd] = useState<string>('');
  const [appliedFilterMode, setAppliedFilterMode] = useState<'prefix' | 'range'>('prefix');

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; key: string }>({
    open: false,
    key: '',
  });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useDeleteKeyValuePair();

  const { isLoading: keyValuePairsLoading } = useKeyValuePairs(
    table || '',
    appliedFilterMode === 'prefix' ? appliedPrefix : '',
    appliedFilterMode === 'range' ? appliedStart : '',
    appliedFilterMode === 'range' ? appliedEnd : '',
  );

  const { data: status, isLoading: statusLoading } = useStatus();

  const tableInfo = React.useMemo(() => {
    if (!status?.servers || !table) return null;
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

  usePageTitle(table ? `Table: ${table}` : 'Key-Value Data');

  const handleFilterModeChange = (mode: 'prefix' | 'range') => {
    setFilterMode(mode);
    if (mode === 'prefix') {
      setStart('');
      setEnd('');
    } else {
      setPrefix('');
    }
  };

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

  const handleTableChange = (tableName: string) => {
    navigate({ to: '/data/$table', params: { table: tableName } });
  };

  if (!table) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Data', current: true }]} />
        <CardWithHeader title="Tables">
          <div className="p-6">
            <TableSelector selectedTable="" onTableChange={handleTableChange} />
          </div>
        </CardWithHeader>
      </div>
    );
  }

  const deleteKeyValuePair = (key: string) => {
    setDeleteError(null);
    setDeleteConfirm({ open: true, key });
  };

  const handleDeleteConfirm = async () => {
    const key = deleteConfirm.key;
    setDeleteConfirm({ open: false, key: '' });
    try {
      await deleteMutation.mutateAsync({ table, key });
    } catch (error) {
      console.error('Error deleting key-value pair:', error);
      setDeleteError(
        `Failed to delete key "${key}". ${
          error instanceof Error ? error.message : 'Please try again.'
        }`,
      );
    }
  };

  const addButton = (
    <Link
      to="/data/$table/add"
      params={{ table }}
      className="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-sm shadow-blue-900/40"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Key-Value Pair
    </Link>
  );

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Data', href: '/data' },
          { label: table, current: true },
        ]}
      />

      {deleteError && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {deleteError}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-100">Table: {table}</h2>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-slate-400">
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
                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                  <span>
                    Server: {tableInfo.serverName} ({tableInfo.serverId})
                  </span>
                  <span>Raft Index: {tableInfo.tableStatus.raftIndex.toLocaleString()}</span>
                  <span>Raft Term: {tableInfo.tableStatus.raftTerm}</span>
                  <span>Leader: {tableInfo.tableStatus.leader}</span>
                </div>
              )}
              {statusLoading && !tableInfo && (
                <p className="text-sm text-slate-400">Loading server metadata...</p>
              )}
            </div>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-sm text-slate-400">Key-Value Store</p>
            {tableInfo && (
              <div className="mt-1 text-xs text-slate-500">
                <div>DB Size: {(tableInfo.tableStatus.dbSize / 1024).toFixed(1)} KB</div>
                <div>Log Size: {(tableInfo.tableStatus.logSize / 1024).toFixed(1)} KB</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <CardWithHeader title="Browse Data" action={addButton}>
        <div className="space-y-6">
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
          <KeyValueTable
            table={table}
            prefix={appliedFilterMode === 'prefix' ? appliedPrefix : ''}
            start={appliedFilterMode === 'range' ? appliedStart : ''}
            end={appliedFilterMode === 'range' ? appliedEnd : ''}
            onDeletePair={deleteKeyValuePair}
          />
        </div>
      </CardWithHeader>

      <div className="fixed bottom-6 right-6 sm:hidden">
        <Link
          to="/data/$table/add"
          params={{ table }}
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-500 transition-colors"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete Key"
        message={`Are you sure you want to delete "${deleteConfirm.key}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, key: '' })}
      />
    </div>
  );
};

export default DataPage;
