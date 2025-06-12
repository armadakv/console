import React from 'react';

import { CardWithHeader } from '@/shared/CardWithHeader';
import { LoadingState } from '@/shared/LoadingState';
import { Table as TableType } from '@/types';
import { Table, TableRow, TableHeader, TableBody, TableCell } from '@/ui/Table';
import { Typography } from '@/ui/Typography';

interface TablesSectionProps {
  tables?: TableType[];
  loading: boolean;
}

/**
 * Section for displaying a list of tables in a card
 */
const TablesSection: React.FC<TablesSectionProps> = ({ tables, loading }) => {
  return (
    <CardWithHeader title="Tables" className="h-full">
      {loading ? (
        <div className="p-8 text-center">
          <LoadingState message="Loading tables..." />
        </div>
      ) : tables && tables.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell className="font-bold">Name</TableCell>
              <TableCell className="font-bold">ID</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.map((table) => (
              <TableRow key={table.id}>
                <TableCell>{table.name}</TableCell>
                <TableCell>
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                    {table.id}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="p-8 text-center">
          <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
            No tables found.
          </Typography>
        </div>
      )}
    </CardWithHeader>
  );
};

export default TablesSection;
