import { ChevronDown, Database } from 'lucide-react';
import React, { useState } from 'react';

import { formatBytes } from '../utils';

import { TableStatus } from '@/types';
import { Chip } from '@/ui/Chip';
import { Table, TableRow, TableHeader, TableBody, TableCell } from '@/ui/Table';
import { Typography } from '@/ui/Typography';

interface TableAccordionProps {
  tables: Record<string, TableStatus>;
}

/**
 * Component for displaying tables in an expandable accordion
 */
const TableAccordion: React.FC<TableAccordionProps> = ({ tables }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!tables || Object.keys(tables).length === 0) {
    return null;
  }

  const tableCount = Object.keys(tables).length;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center">
          <Database className="w-4 h-4 text-blue-500 mr-2" />
          <Typography variant="body2" className="font-medium text-blue-600 dark:text-blue-400">
            {tableCount} {tableCount === 1 ? 'Table' : 'Tables'}
          </Typography>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="font-bold">Table Name</TableCell>
                <TableCell className="font-bold">Log Size</TableCell>
                <TableCell className="font-bold">DB Size</TableCell>
                <TableCell className="font-bold">Leader</TableCell>
                <TableCell className="font-bold">Raft Status</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(tables).map(([name, status]) => (
                <TableRow key={name}>
                  <TableCell>{name}</TableCell>
                  <TableCell>{formatBytes(status.logSize)}</TableCell>
                  <TableCell>{formatBytes(status.dbSize)}</TableCell>
                  <TableCell>{status.leader}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Chip
                        variant="default"
                        className="text-xs"
                        title={`Raft Index: ${status.raftIndex}`}
                      >
                        Index: {status.raftIndex}
                      </Chip>
                      <Chip
                        variant="default"
                        className="text-xs"
                        title={`Raft Term: ${status.raftTerm}`}
                      >
                        Term: {status.raftTerm}
                      </Chip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TableAccordion;
