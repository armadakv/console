import { Plus, ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';

import KeyValueFilter from './components/KeyValueFilter';
import KeyValueTable from './components/KeyValueTable';
import TableSelector from './components/TableSelector';

import { useDeleteKeyValuePair } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { CardWithHeader } from '@/shared/CardWithHeader';

const DataPage: React.FC = () => {
  const { table } = useParams<{ table: string }>();
  const navigate = useNavigate();

  // State for form inputs
  const [prefix, setPrefix] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'prefix' | 'range'>('prefix');
  const deleteMutation = useDeleteKeyValuePair();

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

  // Handle table selection
  const handleTableChange = (tableName: string) => {
    navigate(`/data/${tableName}`);
  };

  // Table selection page
  if (!table) {
    return (
      <div className="space-y-6">
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
    try {
      await deleteMutation.mutateAsync({
        table,
        key,
      });
    } catch (error) {
      console.error('Error deleting key-value pair:', error);
    }
  };

  // Create add button for the card header
  const addButton = (
    <RouterLink
      to={`/data/${table}/add`}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Key-Value Pair
    </RouterLink>
  );

  // Table data page (with specified table)
  return (
    <div className="space-y-6">
      {/* Back to Tables Button */}
      <div className="flex items-center">
        <RouterLink
          to="/data"
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tables
        </RouterLink>
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
              onFilter={() => {
                /* refetch happens automatically on dependencies change */
              }}
              disabled={false}
            />
          </div>

          {/* Data table */}
          <KeyValueTable
            table={table}
            prefix={filterMode === 'prefix' ? prefix : ''}
            start={filterMode === 'range' ? start : ''}
            end={filterMode === 'range' ? end : ''}
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
