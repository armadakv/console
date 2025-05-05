import { Alert } from '@mui/material';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import usePageTitle from '../../hooks/usePageTitle';
import KeyValueForm from './components/KeyValueForm';

const AddKeyValuePage: React.FC = () => {
  const { table } = useParams<{ table: string }>();
  const navigate = useNavigate();

  // Use the usePageTitle hook instead of PageHeader component
  usePageTitle(table ? `Add Key-Value Pair to ${table}` : 'Add Key-Value Pair');

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
      <Alert severity="error" sx={{ mt: 2 }}>
        No table specified. Please select a table from the Data page first.
      </Alert>
    );
  }

  return <KeyValueForm selectedTable={table} onSuccess={handleSuccess} />;
};

export default AddKeyValuePage;
