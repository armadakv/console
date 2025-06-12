import { Edit, Trash2 } from 'lucide-react';
import React from 'react';
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
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell className="font-bold">Key</TableCell>
            <TableCell className="font-bold">Value</TableCell>
            <TableCell className="font-bold text-center">Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keyValuePairs.map((pair) => (
            <TableRow key={pair.key} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <KeyValueCells keyName={pair.key} value={pair.value} />
              <TableCell className="text-center">
                <div className="flex justify-center gap-2">
                  <RouterLink to={`/data/${table}/edit/${encodeURIComponent(pair.key)}`}>
                    <Button variant="ghost" size="sm" className="p-2" title="Edit value">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </RouterLink>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-red-600 hover:text-red-700"
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
  );
};

export default KeyValueTable;
