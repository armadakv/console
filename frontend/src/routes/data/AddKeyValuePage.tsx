import { useNavigate, useParams } from '@tanstack/react-router';
import React from 'react';

import KeyValueForm from './components/KeyValueForm';

import { useBreadcrumbs } from '@/hooks/usePageTitle';
import { Alert } from '@/ui/Alert';

const AddKeyValuePage: React.FC = () => {
  const { table } = useParams({ strict: false }) as { table?: string };
  const navigate = useNavigate();

  useBreadcrumbs(
    table
      ? [
          { label: 'Data', href: '/data' },
          { label: table, href: `/data/${table}` },
          { label: 'Add Key-Value', current: true },
        ]
      : [
          { label: 'Data', href: '/data' },
          { label: 'Add Key-Value', current: true },
        ],
  );

  const handleSuccess = () => {
    setTimeout(() => {
      navigate({ to: '/data/$table', params: { table: table! } });
    }, 1500);
  };

  if (!table) {
    return (
      <Alert variant="error" className="mt-4">
        No table specified. Please select a table from the Data page first.
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <KeyValueForm selectedTable={table} onSuccess={handleSuccess} />
    </div>
  );
};

export default AddKeyValuePage;
