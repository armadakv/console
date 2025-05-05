import AddIcon from '@mui/icons-material/Add';
import { TextField, Button, Grid, CircularProgress } from '@mui/material';
import React, { useState } from 'react';

import ErrorState from '../../components/shared/ErrorState';
import SuccessState from '../../components/shared/SuccessState';
import { useAddKeyValuePair } from '../../hooks/useApi';

interface AddKeyValueFormProps {
  selectedTable: string;
}

const AddKeyValueForm: React.FC<AddKeyValueFormProps> = ({ selectedTable }) => {
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const addMutation = useAddKeyValuePair();

  const addKeyValuePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) {
      return;
    }

    if (!newKey || !newValue) {
      return;
    }

    try {
      await addMutation.mutateAsync({
        table: selectedTable,
        key: newKey,
        value: newValue,
      });
      // Clear form
      setNewKey('');
      setNewValue('');
    } catch (error) {
      console.error('Error adding key-value pair:', error);
    }
  };

  return (
    <>
      {!selectedTable && (
        <ErrorState
          title="No Table Selected"
          message="Please select a table first to add key-value pairs."
          sx={{ mb: 2 }}
        />
      )}

      {addMutation.isError && (
        <ErrorState
          error={addMutation.error}
          message="Failed to add key-value pair. Please try again."
          sx={{ mb: 2 }}
        />
      )}

      {addMutation.isSuccess && (
        <SuccessState message="Key-value pair added successfully!" sx={{ mb: 2 }} />
      )}

      <form onSubmit={addKeyValuePair}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Key"
              variant="outlined"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              required
              disabled={!selectedTable || addMutation.isLoading}
              fullWidth
              size="medium"
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Value"
              variant="outlined"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              required
              disabled={!selectedTable || addMutation.isLoading}
              fullWidth
              size="medium"
              multiline
              minRows={1}
              maxRows={3}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!selectedTable || !newKey || !newValue || addMutation.isLoading}
              fullWidth
              sx={{ height: '100%' }}
              startIcon={addMutation.isLoading ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {addMutation.isLoading ? 'Adding...' : 'Add'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  );
};

export default AddKeyValueForm;
