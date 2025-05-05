import { Alert } from '@mui/material';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import usePageTitle from '../../hooks/usePageTitle';
import KeyValueForm from './components/KeyValueForm';

const EditKeyValuePage: React.FC = () => {
  const { table, key } = useParams<{ table: string; key: string }>();
  const navigate = useNavigate();

  // Use the usePageTitle hook instead of PageHeader component
  usePageTitle(table && key ? `Edit Key: ${key}` : 'Edit Key-Value Pair');

  const handleSuccess = () => {
    // Navigate back to the data page after successful update
    setTimeout(() => {
      navigate(`/data/${table}`);
    }, 1500);
  };

  // If no table or key is specified in the URL, show an error message
  if (!table || !key) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Missing table or key parameter. Please select a key-value pair to edit.
      </Alert>
    );
  }

  return <KeyValueForm selectedTable={table} selectedKey={key} isEditing onSuccess={handleSuccess} />;
};

export default EditKeyValuePage;
