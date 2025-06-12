import React from 'react';

import { CardWithHeader } from '@/shared/CardWithHeader';
import { Typography } from '@/ui/Typography';

interface ClusterSummaryProps {
  status: string;
  message: string;
  totalServers: number;
  totalTables: number;
}

/**
 * Section for displaying cluster health summary and statistics
 */
const ClusterSummarySection: React.FC<ClusterSummaryProps> = ({
  status,
  message,
  totalServers,
  totalTables,
}) => {
  // Determine status colors
  const getStatusColor = () => {
    switch (status) {
      case 'Healthy':
        return 'border-green-500';
      case 'Warning':
        return 'border-yellow-500';
      case 'Error':
      case 'Unknown':
      default:
        return 'border-red-500';
    }
  };

  return (
    <CardWithHeader title="Cluster Summary" className="h-full">
      <div className="p-6">
        <div
          className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg border-l-4 ${getStatusColor()} mb-4`}
        >
          <Typography variant="subtitle1" className="font-medium">
            Status: {status}
          </Typography>
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mt-2">
            {message}
          </Typography>
        </div>

        <Typography variant="subtitle2" className="font-medium mb-3">
          Cluster Statistics
        </Typography>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Typography variant="body2" className="font-medium">
                Total Servers
              </Typography>
            </div>
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
              {totalServers}
            </Typography>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Typography variant="body2" className="font-medium">
                Total Tables
              </Typography>
            </div>
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
              {totalTables}
            </Typography>
          </div>
          <div className="flex justify-between items-center py-2">
            <div>
              <Typography variant="body2" className="font-medium">
                Health Status
              </Typography>
            </div>
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
              {status}
            </Typography>
          </div>
        </div>
      </div>
    </CardWithHeader>
  );
};

export default ClusterSummarySection;
