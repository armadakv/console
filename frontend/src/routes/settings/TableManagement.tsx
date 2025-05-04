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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTables, useCreateTable, useDeleteTable } from '../../hooks/useApi';
import type { Table as TableType } from '../../types';

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
    refetch 
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
  const isLoading = isTablesLoading || createTableMutation.isLoading || deleteTableMutation.isLoading;
  const errorMessage = tablesError 
    ? 'Failed to fetch tables' 
    : createTableMutation.error 
      ? 'Failed to create table' 
      : deleteTableMutation.error 
        ? 'Failed to delete table' 
        : null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Table Management</Typography>
        <Tooltip title="Refresh tables list">
          <IconButton onClick={() => refetch()} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* New Table Form */}
      <Paper component="form" onSubmit={handleCreateTable} sx={{ p: 2, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Create New Table
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Table Name"
            variant="outlined"
            size="small"
            fullWidth
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            disabled={isLoading}
            sx={{ mr: 2 }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={!newTableName.trim() || isLoading}
            startIcon={createTableMutation.isLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Create
          </Button>
        </Box>
      </Paper>

      {/* Tables List */}
      <Typography variant="subtitle1" gutterBottom>
        Existing Tables
      </Typography>
      
      {isTablesLoading && tables.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading tables...
          </Typography>
        </Box>
      ) : tables.length === 0 ? (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No tables found. Create one to get started.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Table Name</TableCell>
                <TableCell>Table ID</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell>{table.name}</TableCell>
                  <TableCell>{table.id}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete table">
                      <IconButton 
                        color="error" 
                        onClick={() => confirmDeleteTable(table)}
                        disabled={isLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>
          Confirm Table Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the table "{tableToDelete?.name}"?
            This action cannot be undone and all data in this table will be permanently lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteTable} 
            color="error" 
            variant="contained"
            disabled={deleteTableMutation.isLoading}
            startIcon={deleteTableMutation.isLoading && <CircularProgress size={20} />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TableManagement;

