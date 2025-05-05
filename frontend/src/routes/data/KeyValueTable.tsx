import React from 'react';
import { Box, IconButton, TableRow, TableCell, Typography, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Link as RouterLink } from 'react-router-dom';
import { useKeyValuePairs } from '../../hooks/useApi';
import KeyValueCells from './KeyValueCells';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import StyledTable from '../../components/shared/StyledTable';

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

  // Define table columns
  const columns = [
    { id: 'key', label: 'Key', minWidth: 150 },
    { id: 'value', label: 'Value', minWidth: 200 },
    { id: 'actions', label: 'Actions', align: 'center' as const, minWidth: 140 },
  ];

  if (isLoading) {
    return <LoadingState message="Loading key-value pairs..." height={150} />;
  }

  if (isError) {
    return <ErrorState message="Error loading key-value pairs." onRetry={refetch} sx={{ mt: 2 }} />;
  }

  if (!keyValuePairs || keyValuePairs.length === 0) {
    return (
      <Box sx={{ p: 2, mt: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No key-value pairs found with the current filter.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <StyledTable columns={columns}>
        {keyValuePairs.map((pair) => (
          <TableRow key={pair.key} hover>
            <KeyValueCells keyName={pair.key} value={pair.value} />
            <TableCell align="center">
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Tooltip title="Edit value">
                  <IconButton
                    component={RouterLink}
                    to={`/data/${table}/edit/${encodeURIComponent(pair.key)}`}
                    size="small"
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete key-value pair">
                  <IconButton size="small" onClick={() => onDeletePair(pair.key)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </StyledTable>
    </Box>
  );
};

export default KeyValueTable;
