import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
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
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Add New Key-Value Pair
        </Typography>
        
        {!selectedTable && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please select a table first to add key-value pairs.
          </Alert>
        )}
        
        {addMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {addMutation.error instanceof Error 
              ? addMutation.error.message 
              : 'Failed to add key-value pair. Please try again.'}
          </Alert>
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
                disabled={!selectedTable}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Value"
                variant="outlined"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                required
                disabled={!selectedTable}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!selectedTable || addMutation.isLoading}
                fullWidth
                sx={{ height: '100%' }}
              >
                {addMutation.isLoading ? <CircularProgress size={24} /> : 'Add'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddKeyValueForm;
