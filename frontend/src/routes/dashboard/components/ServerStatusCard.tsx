import React from 'react';

import ErrorAccordion from './ErrorAccordion';
import TableAccordion from './TableAccordion';

import { StatusChip } from '@/shared/StatusChip';
import { ServerStatus } from '@/types';
import { Typography } from '@/ui/Typography';

interface ServerStatusCardProps {
  server: ServerStatus;
}

/**
 * Component for displaying detailed information about a single server
 */
const ServerStatusCard: React.FC<ServerStatusCardProps> = ({ server }) => {
  // Determine the border color based on server status and errors
  const getBorderColor = () => {
    if (server.status !== 'ok') {
      return 'border-red-500';
    }

    if (server.errors && server.errors.length > 0) {
      return 'border-yellow-500';
    }

    return 'border-green-500';
  };

  return (
    <div
      className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg border-l-4 ${getBorderColor()}`}
    >
      <div className="flex justify-between items-center mb-2">
        <Typography variant="subtitle1" className="font-medium">
          {server.name || server.id}
        </Typography>
        <StatusChip status={server.status} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

      <div className="space-y-2">
        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
          <strong>Message:</strong> {server.message || 'No status message available'}
        </Typography>
        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
          <strong>ID:</strong> {server.id}
        </Typography>

        {/* Display errors if any */}
        {server.errors && <ErrorAccordion errors={server.errors} />}

        {/* Display tables */}
        {server.tables && <TableAccordion tables={server.tables} />}
      </div>
    </div>
  );
};

export default ServerStatusCard;
