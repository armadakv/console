import React from 'react';

import TableManagement from './components/TableManagement';

import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';

const SettingsPage: React.FC = () => {
  useBreadcrumbs([{ label: 'Settings', current: true }]);

  return <TableManagement />;
};

export default SettingsPage;
