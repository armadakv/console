import React, { ReactNode } from 'react';

import { Table, TableContainer, TableHeader, TableBody, TableRow, TableCell } from '../ui';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
}

interface StyledTableProps {
  columns: Column[];
  children: ReactNode;
  className?: string;
  isEmpty?: boolean;
  emptyContent?: ReactNode;
}

/**
 * A styled table component that follows the design language
 */
export const StyledTable: React.FC<StyledTableProps> = ({
  columns,
  children,
  className = '',
  isEmpty = false,
  emptyContent,
}) => {
  return (
    <TableContainer className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                isHeader
                className={
                  column.align === 'center'
                    ? 'text-center'
                    : column.align === 'right'
                      ? 'text-right'
                      : ''
                }
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{isEmpty && emptyContent ? emptyContent : children}</TableBody>
      </Table>
    </TableContainer>
  );
};
