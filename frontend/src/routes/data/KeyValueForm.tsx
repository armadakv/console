import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import {
  TextField,
  Button,
  Grid,
  CircularProgress,
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
} from '@mui/material';
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import ErrorState from '../../components/shared/ErrorState';
import SuccessState from '../../components/shared/SuccessState';
import { useAddKeyValuePair } from '../../hooks/useApi';

interface KeyValueFormProps {
  selectedTable: string;
  initialKey?: string;
  initialValue?: string;
  isEdit?: boolean;
  onSuccess?: () => void;
}

const KeyValueForm: React.FC<KeyValueFormProps> = ({
  selectedTable,
  initialKey = '',
  initialValue = '',
  isEdit = false,
  onSuccess,
}) => {
  const [key, setKey] = useState<string>(initialKey);
  const [value, setValue] = useState<string>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const mutation = useAddKeyValuePair();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedTable || !key || !value) {
      return;
    }

    try {
      await mutation.mutateAsync({
        table: selectedTable,
        key,
        value,
      });

      setSuccess(true);

      if (!isEdit) {
        // If adding a new KV pair, clear the form
        setKey('');
        setValue('');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to save key-value pair');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton
          component={RouterLink}
          to={`/data/${selectedTable}`}
          sx={{ mr: 2 }}
          aria-label="back to data page"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          {isEdit ? 'Edit Key-Value Pair' : 'Add New Key-Value Pair'}
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <CardHeader
          title={isEdit ? 'Edit Value' : 'Enter Key-Value Details'}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
            px: 3,
            py: 2,
          }}
        />
        <CardContent sx={{ p: 3 }}>
          {success && (
            <SuccessState
              message={`Key-value pair ${isEdit ? 'updated' : 'added'} successfully!`}
              sx={{ mb: 3 }}
            />
          )}

          {error && <ErrorState message={error} sx={{ mb: 3 }} />}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Key"
                  variant="outlined"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  required
                  disabled={isEdit || mutation.isLoading}
                  fullWidth
                  InputProps={{
                    readOnly: isEdit,
                    sx: {
                      fontFamily: '"Roboto Mono", "Courier New", monospace',
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Value"
                  variant="outlined"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  disabled={mutation.isLoading}
                  fullWidth
                  multiline
                  minRows={8}
                  maxRows={15}
                  InputProps={{
                    sx: {
                      fontFamily: '"Roboto Mono", "Courier New", monospace',
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!key || !value || mutation.isLoading}
                  startIcon={
                    mutation.isLoading ? (
                      <CircularProgress size={20} />
                    ) : isEdit ? (
                      <SaveIcon />
                    ) : (
                      <AddIcon />
                    )
                  }
                  sx={{
                    textTransform: 'none',
                    borderRadius: 1,
                    px: 3,
                  }}
                >
                  {mutation.isLoading
                    ? 'Saving...'
                    : isEdit
                      ? 'Save Changes'
                      : 'Add Key-Value Pair'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default KeyValueForm;
