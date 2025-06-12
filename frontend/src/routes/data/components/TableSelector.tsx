import { Plus, Search, Table } from 'lucide-react';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { useTables } from '@/hooks/useApi';
import { LoadingState } from '@/shared/LoadingState';
import { Alert } from '@/ui/Alert';
import { Button } from '@/ui/Button';
import { Card, CardContent } from '@/ui/Card';
import { Input } from '@/ui/Input';
import { Typography } from '@/ui/Typography';

interface TableSelectorProps {
  selectedTable: string;
  onTableChange: (tableName: string) => void;
}

const TableSelector: React.FC<TableSelectorProps> = ({ selectedTable, onTableChange }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: tables, isLoading, isError, error, refetch } = useTables();

  // Filter tables based on search query
  const filteredTables = React.useMemo(() => {
    if (!tables) return [];
    if (!searchQuery) return tables;

    const lowerQuery = searchQuery.toLowerCase();
    return tables.filter((table) => table.name.toLowerCase().includes(lowerQuery));
  }, [tables, searchQuery]);

  if (isLoading) {
    return <LoadingState message="Loading tables..." />;
  }

  if (isError) {
    return (
      <div className="py-4">
        <Alert variant="error" className="mb-4">
          {error instanceof Error
            ? error.message
            : 'Failed to fetch tables. Please try again later.'}
        </Alert>
        <Button variant="primary" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const noTablesExist = !tables || tables.length === 0;

  return (
    <div>
      {/* Search and Create Table Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <RouterLink to="/settings">
          <Button variant="primary" className="inline-flex items-center whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />
            Create New Table
          </Button>
        </RouterLink>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mb-6" />

      {/* Tables Grid/List */}
      {noTablesExist ? (
        <div className="text-center py-8">
          <Table className="w-12 h-12 text-gray-400 opacity-50 mx-auto mb-4" />
          <Typography variant="h6" className="mb-2">
            No Tables Found
          </Typography>
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first table to start storing key-value pairs.
          </Typography>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredTables.map((table) => (
            <Card
              key={table.id}
              className={`cursor-pointer transition-all border-2 hover:border-blue-500 hover:shadow-lg ${
                selectedTable === table.name
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => onTableChange(table.name)}
            >
              <CardContent className="flex items-center p-4">
                <Table
                  className={`w-5 h-5 mr-3 ${
                    selectedTable === table.name ? 'text-blue-600' : 'text-gray-500'
                  }`}
                />
                <Typography variant="subtitle1" className="font-medium">
                  {table.name}
                </Typography>
              </CardContent>
            </Card>
          ))}

          {/* Show message when no search results */}
          {filteredTables.length === 0 && searchQuery && (
            <div className="col-span-full text-center py-8">
              <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                No tables matching "{searchQuery}" found.
              </Typography>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableSelector;
