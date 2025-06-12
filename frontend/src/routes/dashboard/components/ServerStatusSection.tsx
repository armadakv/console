import React from 'react';

import ServerStatusCard from './ServerStatusCard';

import { CardWithHeader } from '@/shared/CardWithHeader';
import { ServerStatus } from '@/types';
import { Typography } from '@/ui/Typography';

interface ServerStatusSectionProps {
  servers: ServerStatus[];
}

/**
 * Section that displays all server status cards
 */
const ServerStatusSection: React.FC<ServerStatusSectionProps> = ({ servers }) => {
  return (
    <CardWithHeader title="Server Status">
      {servers && servers.length > 0 ? (
        <div className="space-y-4">
          {servers.map((server) => (
            <div key={server.id}>
              <ServerStatusCard server={server} />
            </div>
          ))}
        </div>
      ) : (
        <Typography variant="body1" className="text-gray-600 dark:text-gray-400 text-center py-6">
          No servers found. Please check your connection to the Armada cluster.
        </Typography>
      )}
    </CardWithHeader>
  );
};

export default ServerStatusSection;
