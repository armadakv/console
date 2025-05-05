import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from '@mui/material';
import React, { ReactNode } from 'react';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
}

interface StyledTableProps {
  columns: Column[];
  children: ReactNode;
  containerSx?: object;
  isEmpty?: boolean;
  emptyContent?: ReactNode;
}

/**
 * A styled table component that follows the design language
 */
const StyledTable: React.FC<StyledTableProps> = ({
  columns,
  children,
  containerSx = {},
  isEmpty = false,
  emptyContent,
}) => {
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ ...containerSx }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                style={{ minWidth: column.minWidth }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{isEmpty && emptyContent ? emptyContent : children}</TableBody>
      </Table>
    </TableContainer>
  );
};

export default StyledTable;
