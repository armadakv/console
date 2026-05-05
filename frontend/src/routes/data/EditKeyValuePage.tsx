import { useNavigate, useParams } from '@tanstack/react-router';
import React from 'react';

import KeyValueForm from './components/KeyValueForm';

import { useKeyValuePair } from '@/hooks/useApi';
import { useBreadcrumbs } from '@/hooks/usePageTitle';
import { Alert } from '@/ui/Alert';

const EditKeyValuePage: React.FC = () => {
  const { table, key } = useParams({ strict: false }) as { table?: string; key?: string };
  const navigate = useNavigate();

  useBreadcrumbs(
    table && key
      ? [
          { label: 'Data', href: '/data' },
          { label: table, href: `/data/${table}` },
          { label: `Edit: ${key}`, current: true },
        ]
      : [
          { label: 'Data', href: '/data' },
          { label: 'Edit Key-Value', current: true },
        ],
  );

  const handleSuccess = () => {
    setTimeout(() => {
      navigate({ to: '/data/$table', params: { table: table! } });
    }, 1500);
  };

  const { data } = useKeyValuePair(table || '', key || '');

  if (!table || !key) {
    return (
      <Alert variant="error" className="mt-4">
        Missing table or key parameter. Please select a key-value pair to edit.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
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
