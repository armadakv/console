import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  SelectChangeEvent
} from '@mui/material';
import { useTables } from '../../hooks/useApi';

interface TableSelectorProps {
  selectedTable: string;
  onTableChange: (event: SelectChangeEvent<string>) => void;
}

const TableSelector: React.FC<TableSelectorProps> = ({ selectedTable, onTableChange }) => {
  const {
    data: tables,
    isLoading,
    isError,
    error,
    refetch
  } = useTables();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography>Loading tables...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error
            ? error.message
            : 'Failed to fetch tables. Please try again later.'}
        </Alert>
        <Button variant="contained" onClick={() => refetch()} color="primary">
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
      <InputLabel id="table-select-label">Select Table</InputLabel>
      <Select
        labelId="table-select-label"
        id="table-select"
        value={selectedTable}
        onChange={onTableChange}
        label="Select Table"
      >
        <MenuItem value="">
          <em>-- Select a Table --</em>
        </MenuItem>
        {tables?.map((table) => (
          <MenuItem key={table.id} value={table.name}>
            {table.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TableSelector;
