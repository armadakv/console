import { Edit, Trash2, List, Grid } from 'lucide-react';
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import KeyValueCells from './KeyValueCells';

import { useKeyValuePairs } from '@/hooks/useApi';
import { ErrorState } from '@/shared/ErrorState';
import { LoadingState } from '@/shared/LoadingState';
import { Button } from '@/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/ui/Table';
import { Typography } from '@/ui/Typography';

interface KeyValueTableProps {
  table: string;
  prefix: string;
  start: string;
  end: string;
  onDeletePair: (key: string) => void;
}

const KeyValueTable: React.FC<KeyValueTableProps> = ({
  table,
  prefix,
  start,
  end,
  onDeletePair,
}) => {
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');

  const {
    data: keyValuePairs,
    isLoading,
    isError,
    refetch,
  } = useKeyValuePairs(table, prefix, start, end);

  if (isLoading) {
    return <LoadingState message="Loading key-value pairs..." height={150} />;
  }

  if (isError) {
    return <ErrorState message="Error loading key-value pairs." onRetry={refetch} />;
  }

  if (!keyValuePairs || keyValuePairs.length === 0) {
    return (
      <div className="p-4 mt-4 text-center">
        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
          No key-value pairs found with the current filter.
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            {keyValuePairs?.length || 0} records
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mr-2">
            Density:
          </Typography>
          <div className="flex rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Button
              variant={density === 'compact' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDensity('compact')}
              className="rounded-none border-0 border-r border-gray-200 dark:border-gray-700"
            >
              <List className="w-4 h-4 mr-1" />
              Compact
            </Button>
            <Button
              variant={density === 'comfortable' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDensity('comfortable')}
              className="rounded-none border-0"
            >
              <Grid className="w-4 h-4 mr-1" />
              Comfortable
            </Button>
          </div>
        </div>
      </div>

      {/* Table Container - Improved for better overflow handling */}
      <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800">
        <div className="min-w-full overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableCell className="font-bold bg-gray-50 dark:bg-gray-800 w-80 min-w-[280px] max-w-[400px] sticky left-0 z-10">
                  <div className="flex items-center gap-2">
                    <span>Key</span>
                    <span className="text-xs text-gray-500 font-normal">(ID)</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold bg-gray-50 dark:bg-gray-800 min-w-[400px]">
                  <div className="flex items-center gap-2">
                    <span>Value</span>
                    <span className="text-xs text-gray-500 font-normal">(Data)</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold bg-gray-50 dark:bg-gray-800 text-center w-32 min-w-[120px]">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keyValuePairs.map((pair) => (
                <TableRow
                  key={pair.key}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    density === 'compact' ? 'border-b border-gray-100 dark:border-gray-800' : ''
                  }`}
                >
                  <KeyValueCells keyName={pair.key} value={pair.value} density={density} />
                  <TableCell
                    className={`text-center align-top bg-gray-50/50 dark:bg-gray-800/50 ${
                      density === 'compact' ? 'p-2' : 'p-4'
                    }`}
                  >
                    <div className="flex justify-center gap-1 sm:gap-2">
                      <RouterLink to={`/data/${table}/edit/${encodeURIComponent(pair.key)}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          title="Edit value"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </RouterLink>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        onClick={() => onDeletePair(pair.key)}
                        title="Delete key-value pair"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default KeyValueTable;
