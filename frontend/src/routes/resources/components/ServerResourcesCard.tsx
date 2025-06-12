import { ChevronDown } from 'lucide-react';
import React from 'react';

import ResourceMetricsGrid from './ResourceMetricsGrid';

import { CardWithHeader } from '@/shared/CardWithHeader';

interface ServerResourcesCardProps {
  servers: Array<{
    id: string;
    name?: string;
    status?: string;
    isCurrent?: boolean;
    address?: string;
  }>;
}

const ServerResourcesCard: React.FC<ServerResourcesCardProps> = ({ servers }) => {
  const [expanded, setExpanded] = React.useState<string | false>(false);

  const handleToggle = (serverId: string) => {
    setExpanded(expanded === serverId ? false : serverId);
  };

  return (
    <CardWithHeader title="Server Resources">
      {servers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No server information available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {servers.map((server) => (
            <div
              key={server.id}
              className={`border rounded-lg overflow-hidden border-l-4 ${
                server.isCurrent ? 'border-l-blue-500' : 'border-l-gray-300 dark:border-l-gray-600'
              } border-gray-200 dark:border-gray-700`}
            >
              <button
                onClick={() => handleToggle(server.id)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-expanded={expanded === server.id}
                aria-controls={`${server.id}-content`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {server.name || server.id.substring(0, 8)}
                      {server.isCurrent && (
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                          (current)
                        </span>
                      )}
                    </h3>
                    {server.address && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ({server.address})
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        server.status === 'ok'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {server.status === 'ok' ? 'Online' : 'Offline'}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expanded === server.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {expanded === server.id && (
                <div id={`${server.id}-content`} className="p-6 bg-white dark:bg-gray-900">
                  <ResourceMetricsGrid serverId={server.id} serverAddress={server.address} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </CardWithHeader>
  );
};

export default ServerResourcesCard;
