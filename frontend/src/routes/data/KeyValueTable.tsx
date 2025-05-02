import React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Button,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { KeyValuePair } from '../../types';
import { useKeyValuePairs } from '../../hooks/useApi';

interface KeyValueTableProps {
  table: string;
  prefix: string;
  onDeletePair: (key: string) => void;
}

const KeyValueTable: React.FC<KeyValueTableProps> = ({ table, prefix, onDeletePair }) => {
  const {
    data: pairs,
    isLoading,
    isError,
    error,
    refetch
  } = useKeyValuePairs(table, prefix);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error
            ? error.message
            : 'Failed to fetch key-value pairs. Please try again later.'}
        </Alert>
        <Button variant="contained" onClick={() => refetch()} color="primary">
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Key</TableCell>
            <TableCell>Value</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!pairs || pairs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} align="center">
                No data found
              </TableCell>
            </TableRow>
          ) : (
            pairs.map((pair: KeyValuePair) => (
              <TableRow key={pair.key}>
                <TableCell>{pair.key}</TableCell>
                <TableCell>{pair.value}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="error"
                    onClick={() => onDeletePair(pair.key)}
                    aria-label="delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default KeyValueTable;

