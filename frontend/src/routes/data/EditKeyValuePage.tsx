import { Box, Alert, CircularProgress } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import PageHeader from '../../components/shared/PageHeader';
import { useKeyValuePair } from '../../hooks/useApi';

import KeyValueForm from './components/KeyValueForm';

const EditKeyValuePage: React.FC = () => {
  const { table, key } = useParams<{ table: string; key: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState<string>('');

  const { data, isError, isLoading: isQueryLoading } = useKeyValuePair(table || '', key || '');

  useEffect(() => {
    if (!table || !key) {
      setError('Missing required parameters');
      setIsLoading(false);
      return;
    }

    if (isQueryLoading) {
      return;
    }

    if (isError || !data) {
      setError('Failed to load key-value pair');
      setIsLoading(false);
      return;
    }

    setValue(data.value);
    setIsLoading(false);
  }, [table, key, data, isError, isQueryLoading]);

  const handleSuccess = () => {
    // Navigate back to the data page after successful edit
    // Using path parameter for table
    setTimeout(() => {
      navigate(`/data/${table}`);
    }, 1500);
  };

  return (
    <>
      <PageHeader title="Edit Key-Value Pair" />

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <KeyValueForm
          selectedTable={table || ''}
          initialKey={key || ''}
          initialValue={value}
          isEdit={true}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default EditKeyValuePage;
