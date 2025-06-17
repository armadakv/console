import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import KeyValueForm from './components/KeyValueForm';

import { usePageTitle } from '@/hooks/usePageTitle';
import { Breadcrumb } from '@/shared/Breadcrumb';
import { Alert } from '@/ui/Alert';

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
      <Alert variant="error" className="mt-4">
        No table specified. Please select a table from the Data page first.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Data', href: '/data' },
          { label: table, href: `/data/${table}` },
          { label: 'Add Key-Value', current: true },
        ]}
      />
      <KeyValueForm selectedTable={table} onSuccess={handleSuccess} />
    </div>
  );
};

export default AddKeyValuePage;
