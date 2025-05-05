import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTables, useCreateTable, useDeleteTable } from '../../hooks/useApi';
import type { Table as TableType } from '../../types';
import CardWithHeader from '../../components/shared/CardWithHeader';
import StyledTable from '../../components/shared/StyledTable';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import SuccessState from '../../components/shared/SuccessState';
import RefreshButton from '../../components/shared/RefreshButton';

const TableManagement: React.FC = () => {
  // State for form and dialogs
  const [newTableName, setNewTableName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<TableType | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // React Query hooks
  const {
    data: tables = [],
    isLoading: isTablesLoading,
    error: tablesError,
    refetch,
  } = useTables();

  const createTableMutation = useCreateTable();
  const deleteTableMutation = useDeleteTable();

  // Form submission handler
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    try {
      const result = await createTableMutation.mutateAsync(newTableName);
      setSuccessMessage(`Table '${newTableName}' created successfully with ID: ${result.id}`);
      setNewTableName('');
    } catch (err) {
      console.error('Error creating table:', err);
    }

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  // Delete table handlers
  const confirmDeleteTable = (table: TableType) => {
    setTableToDelete(table);
    setOpenDialog(true);
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;

    setOpenDialog(false);

    try {
      await deleteTableMutation.mutateAsync(tableToDelete.name);
      setSuccessMessage(`Table '${tableToDelete.name}' deleted successfully`);
    } catch (err) {
      console.error('Error deleting table:', err);
    } finally {
      setTableToDelete(null);
    }

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  // Determine loading and error states
  const isLoading =
    isTablesLoading || createTableMutation.isLoading || deleteTableMutation.isLoading;
  const errorMessage = tablesError
    ? 'Failed to fetch tables'
    : createTableMutation.error
      ? 'Failed to create table'
      : deleteTableMutation.error
        ? 'Failed to delete table'
        : null;

  // Define table columns
  const columns = [
    { id: 'name', label: 'Table Name', minWidth: 150 },
    { id: 'id', label: 'Table ID', minWidth: 200 },
    { id: 'actions', label: 'Actions', align: 'right' as const, minWidth: 100 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle1">Table Management</Typography>
        <RefreshButton
          onClick={() => refetch()}
          disabled={isLoading}
          tooltipTitle="Refresh tables list"
        />
      </Box>

      {errorMessage && <ErrorState message={errorMessage} onRetry={refetch} />}

      {successMessage && <SuccessState message={successMessage} sx={{ mb: 3 }} />}

      {/* New Table Form */}
      <CardWithHeader title="Create New Table" sx={{ mb: 4 }} contentSx={{ p: 2 }}>
        <form onSubmit={handleCreateTable}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
            <TextField
              label="Table Name"
              variant="outlined"
              size="small"
              fullWidth
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              disabled={isLoading}
              placeholder="Enter table name"
              sx={{ flexGrow: 1 }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!newTableName.trim() || isLoading}
              startIcon={
                createTableMutation.isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AddIcon />
                )
              }
              sx={{ minWidth: '120px', px: 3 }}
            >
              {createTableMutation.isLoading ? 'Creating...' : 'Create'}
            </Button>
          </Stack>
        </form>
      </CardWithHeader>

      {/* Tables List */}
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Existing Tables
      </Typography>

      {isTablesLoading && tables.length === 0 ? (
        <LoadingState message="Loading tables..." height={150} />
      ) : tables.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }} variant="outlined">
          <Typography variant="body2" color="text.secondary">
            No tables found. Create one to get started.
          </Typography>
        </Paper>
      ) : (
        <StyledTable columns={columns}>
          {tables.map((table) => (
            <TableRow key={table.id} hover>
              <TableCell>
                <Typography fontWeight="medium">{table.name}</Typography>
              </TableCell>
              <TableCell>{table.id}</TableCell>
              <TableCell align="right">
                <Tooltip title="Delete table">
                  <IconButton
                    color="error"
                    onClick={() => confirmDeleteTable(table)}
                    disabled={isLoading}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </StyledTable>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Confirm Table Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the table <strong>"{tableToDelete?.name}"</strong>? This
            action cannot be undone and all data in this table will be permanently lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteTable}
            color="error"
            variant="contained"
            disabled={deleteTableMutation.isLoading}
            startIcon={
              deleteTableMutation.isLoading && <CircularProgress size={20} color="inherit" />
            }
          >
            {deleteTableMutation.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableManagement;
