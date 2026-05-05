import { Database, Settings, User } from 'lucide-react';
import React from 'react';

import ServerConfig from './components/ServerConfig';
import TableManagement from './components/TableManagement';
import UserPreferences from './components/UserPreferences';

import { useBreadcrumbs } from '@/hooks/usePageTitle';
import { Card, Tab, TabList, TabPanel, Tabs } from '@/ui';

const SettingsPage: React.FC = () => {
  const [value, setValue] = React.useState(0);

  useBreadcrumbs([{ label: 'Settings', current: true }]);

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <Tabs value={value} onChange={setValue}>
          <TabList>
            <Tab value={0} label="Tables" icon={<Database />} />
            <Tab value={1} label="System" icon={<Settings />} />
            <Tab value={2} label="User Preferences" icon={<User />} />
          </TabList>

          <TabPanel value={value} index={0}>
            <TableManagement />
          </TabPanel>

          <TabPanel value={value} index={1}>
            <ServerConfig />
          </TabPanel>

          <TabPanel value={value} index={2}>
            <UserPreferences />
          </TabPanel>
        </Tabs>
      </Card>
    </div>
  );
};

export default SettingsPage;
