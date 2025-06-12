import { Plus, Trash2, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

import { useTables, useCreateTable, useDeleteTable } from '@/hooks/useApi';
import { CardWithHeader } from '@/shared/CardWithHeader';
import { ErrorState } from '@/shared/ErrorState';
import { LoadingState } from '@/shared/LoadingState';
import { SuccessState } from '@/shared/SuccessState';
import type { Table as TableType } from '@/types';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Typography } from '@/ui/Typography';

const TableManagement: React.FC = () => {
  // State for form and dialogs
  const [newTableName, setNewTableName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<TableType | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // React Query hooks
  const {
    data: tables = [],
    isLoading: isTablesLoading,
    error: tablesError,
    refetch,
  } = useTables();

  const createTableMutation = useCreateTable();
  const deleteTableMutation = useDeleteTable();

  // Form submission handler
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    try {
      const result = await createTableMutation.mutateAsync(newTableName);
      setSuccessMessage(`Table '${newTableName}' created successfully with ID: ${result.id}`);
      setNewTableName('');
    } catch (err) {
      console.error('Error creating table:', err);
    }

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  // Delete table handlers
  const confirmDeleteTable = (table: TableType) => {
    setTableToDelete(table);
    setOpenDialog(true);
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;

    setOpenDialog(false);

    try {
      await deleteTableMutation.mutateAsync(tableToDelete.name);
      setSuccessMessage(`Table '${tableToDelete.name}' deleted successfully`);
    } catch (err) {
      console.error('Error deleting table:', err);
    } finally {
      setTableToDelete(null);
    }

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  // Determine loading and error states
  const isLoading =
    isTablesLoading || createTableMutation.isLoading || deleteTableMutation.isLoading;
  const errorMessage = tablesError
    ? 'Failed to fetch tables'
    : createTableMutation.error
      ? 'Failed to create table'
      : deleteTableMutation.error
        ? 'Failed to delete table'
        : null;

  return (
    <div className="p-6 space-y-6">
      {/* Section Header */}
      <div className="flex justify-between items-center">
        <Typography variant="h6">Table Management</Typography>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Refresh tables list"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error State */}
      {errorMessage && <ErrorState message={errorMessage} onRetry={refetch} />}

      {/* Success Message */}
      {successMessage && <SuccessState message={successMessage} />}

      {/* New Table Form */}
      <CardWithHeader title="Create New Table">
        <div className="p-4">
          <form onSubmit={handleCreateTable} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  label="Table Name"
                  placeholder="Enter table name"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!newTableName.trim() || isLoading}
                startIcon={createTableMutation.isLoading ? undefined : <Plus className="w-4 h-4" />}
                className="sm:min-w-[120px]"
              >
                {createTableMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create'
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardWithHeader>

      {/* Tables List */}
      <div>
        <Typography variant="subtitle1" className="mb-4">
          Existing Tables
        </Typography>

        {isTablesLoading && tables.length === 0 ? (
          <LoadingState message="Loading tables..." />
        ) : tables.length === 0 ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
              No tables found. Create one to get started.
            </Typography>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Table Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Table ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tables.map((table) => (
                  <tr key={table.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography variant="body2" className="font-medium">
                        {table.name}
                      </Typography>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                        {table.id}
                      </Typography>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => confirmDeleteTable(table)}
                        disabled={isLoading}
                        className="inline-flex items-center p-2 border border-transparent rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed dark:text-red-400 dark:hover:bg-red-900/20"
                        title="Delete table"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {openDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setOpenDialog(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <Typography variant="h6" className="mb-2">
                    Confirm Table Deletion
                  </Typography>
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete the table{' '}
                    <strong>"{tableToDelete?.name}"</strong>? This action cannot be undone and all
                    data in this table will be permanently lost.
                  </Typography>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                <Button
                  onClick={handleDeleteTable}
                  variant="error"
                  disabled={deleteTableMutation.isLoading}
                  startIcon={
                    deleteTableMutation.isLoading ? undefined : <Trash2 className="w-4 h-4" />
                  }
                >
                  {deleteTableMutation.isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
                  )}
                </Button>
                <Button onClick={() => setOpenDialog(false)} variant="secondary">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
