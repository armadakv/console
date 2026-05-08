import { Database, HardDrive, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';

import { useNavigation } from '@/context/NavigationContext';
import { useCreateTable, useDeleteTable, useMetricsQuery, useTables } from '@/hooks/useApi';
import { ConfirmDialog } from '@/shared/ConfirmDialog';
import { ErrorState } from '@/shared/ErrorState';
import { LoadingState } from '@/shared/LoadingState';
import { RefreshButton } from '@/shared/RefreshButton';
import type { Table as TableType } from '@/types';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const TableManagement: React.FC = () => {
  const [newTableName, setNewTableName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<TableType | null>(null);

  const { setPageAction, resetPageAction } = useNavigation();

  const { data: tables = [], isLoading, isFetching, error, refetch } = useTables();

  const { data: tableDiskData } = useMetricsQuery('armada_storage_table_disk_bytes');
  const tableDiskBytes = (() => {
    if (!tableDiskData?.data) return null;
    const { resultType, result } = tableDiskData.data;
    if (resultType !== 'vector' || !Array.isArray(result) || result.length === 0) return null;
    const first = result[0] as { value?: [number, string] };
    const v = parseFloat(first?.value?.[1] ?? '');
    return isNaN(v) ? null : v;
  })();

  const createTableMutation = useCreateTable();
  const deleteTableMutation = useDeleteTable();

  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  React.useEffect(() => {
    setPageAction(
      <RefreshButton onClick={handleRefresh} isRefreshing={isFetching} variant="header" />,
    );
    return () => resetPageAction();
  }, [setPageAction, resetPageAction, handleRefresh, isFetching]);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    try {
      await createTableMutation.mutateAsync(newTableName);
      setNewTableName('');
      setShowCreateForm(false);
    } catch {
      // error displayed below
    }
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    try {
      await deleteTableMutation.mutateAsync(tableToDelete.name);
    } finally {
      setTableToDelete(null);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Tables</span>
            <span className="font-semibold text-slate-100">{tables.length}</span>
          </div>
          {tableDiskBytes !== null && (
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">Storage</span>
              <span className="font-semibold text-slate-100">{formatBytes(tableDiskBytes)}</span>
            </div>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setShowCreateForm((v) => !v);
            setNewTableName('');
          }}
          startIcon={showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        >
          {showCreateForm ? 'Cancel' : 'New Table'}
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateTable}
          className="flex items-end gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3"
        >
          <div className="flex-1">
            <Input
              label="Table Name"
              placeholder="Enter table name"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              disabled={createTableMutation.isPending}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!newTableName.trim() || createTableMutation.isPending}
            className="mb-0.5"
          >
            {createTableMutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </form>
      )}

      {/* Mutation errors */}
      {createTableMutation.error && (
        <ErrorState error={createTableMutation.error} title="Failed to create table" />
      )}
      {deleteTableMutation.error && (
        <ErrorState error={deleteTableMutation.error} title="Failed to delete table" />
      )}

      {/* Table list */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                ID
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tables.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-slate-500 text-xs">
                  No tables found. Use the New Table button to create one.
                </td>
              </tr>
            ) : (
              tables.map((table) => (
                <tr key={table.id} className="bg-slate-900 hover:bg-slate-800/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-slate-100 font-medium">{table.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 font-mono">{table.id}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setTableToDelete(table)}
                      disabled={deleteTableMutation.isPending}
                      title="Delete table"
                      className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={tableToDelete !== null}
        title="Delete Table"
        message={`Are you sure you want to delete "${tableToDelete?.name}"? This action cannot be undone and all data in this table will be permanently lost.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteTable}
        onCancel={() => setTableToDelete(null)}
      />
    </div>
  );
};

export default TableManagement;
