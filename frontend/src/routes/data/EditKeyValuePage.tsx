import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import KeyValueForm from './components/KeyValueForm';

import { useKeyValuePair } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Breadcrumb } from '@/shared/Breadcrumb';
import { Alert } from '@/ui/Alert';

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

  const { data } = useKeyValuePair(table || '', key || '');

  // If no table or key is specified in the URL, show an error message
  if (!table || !key) {
    return (
      <Alert variant="error" className="mt-4">
        Missing table or key parameter. Please select a key-value pair to edit.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Data', href: '/data' },
          { label: table, href: `/data/${table}` },
          { label: `Edit: ${key}`, current: true },
        ]}
      />
      <KeyValueForm
        selectedTable={table}
        initialKey={key}
        initialValue={data?.value}
        isEdit
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default EditKeyValuePage;
