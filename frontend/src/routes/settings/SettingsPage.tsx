import { Database, Settings, User } from 'lucide-react';
import React from 'react';

import ServerConfig from './components/ServerConfig';
import TableManagement from './components/TableManagement';

import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, Tab, TabList, TabPanel, Tabs } from '@/ui';

const SettingsPage: React.FC = () => {
  const [value, setValue] = React.useState(0);

  // Use the usePageTitle hook instead of PageHeader component
  usePageTitle('Settings');

  const handleChange = (newValue: number) => {
    setValue(newValue);
  };

  return (
    <Card className="w-full">
      <Tabs value={value} onChange={handleChange}>
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
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Preferences
            </h2>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center border-l-4 border-l-blue-500">
              <p className="text-gray-600 dark:text-gray-400">
                User preferences settings coming soon.
              </p>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </Card>
  );
};

export default SettingsPage;
