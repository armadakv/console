import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/shared/PageHeader';
import KeyValueForm from './KeyValueForm';
import { Alert } from '@mui/material';

const AddKeyValuePage: React.FC = () => {
  const { table } = useParams<{ table: string }>();
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back to the data page after successful addition
    // Include the table in the path to maintain context
    setTimeout(() => {
      navigate(`/data/${table}`);
    }, 1500);
  };

  // If no table is specified in the URL, show an error message
  if (!table) {
    return (
      <>
        <PageHeader title="Add Key-Value Pair" />
        <Alert severity="error" sx={{ mt: 2 }}>
          No table specified. Please select a table from the Data page first.
        </Alert>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Add Key-Value Pair to ${table}`} />
      <KeyValueForm selectedTable={table} onSuccess={handleSuccess} />
    </>
  );
};

export default AddKeyValuePage;
