import { ChevronDown, HardDrive, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

import { useStatus } from '@/hooks/useApi';
import { CardWithHeader } from '@/shared/CardWithHeader';
import { ErrorState } from '@/shared/ErrorState';
import { LoadingState } from '@/shared/LoadingState';
import { StatusChip } from '@/shared/StatusChip';
import { Typography } from '@/ui/Typography';

const ServerConfig: React.FC = () => {
  const { data: statusData, isLoading, error, refetch } = useStatus();
  const [expandedServer, setExpandedServer] = useState<string | false>(false);

  const handleServerToggle = (serverId: string) => {
    setExpandedServer(expandedServer === serverId ? false : serverId);
  };

  // Helper function to format configuration values
  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Helper function to render config data as a table
  const renderConfigTable = (config: Record<string, any> | undefined) => {
    if (!config || Object.keys(config).length === 0) {
      return (
        <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
          No configuration data available
        </Typography>
      );
    }

    return (
      <div className="max-h-96 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900">
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Key
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(config)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, value]) => (
                <tr key={key} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-mono text-sm">
                    {key}
                  </td>
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-mono text-sm break-all">
                    {formatValue(value)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  };
  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading server configuration..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState error={error} message="Error loading server configuration" onRetry={refetch} />
      </div>
    );
  }

  const servers = statusData?.servers || [];

  return (
    <div className="p-6 space-y-6">
      {/* Section Header */}
      <div className="flex justify-between items-center">
        <Typography variant="h6">Server Configuration</Typography>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Refresh server configuration"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {servers.length === 0 ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            No server configuration data available
          </Typography>
        </div>
      ) : (
        <div className="space-y-4">
          {servers.map((server) => (
            <CardWithHeader
              key={server.id}
              title={
                <div className="flex items-center">
                  <HardDrive className="w-5 h-5 mr-2 text-blue-500" />
                  <span>Server: {server.name || server.id}</span>
                  <StatusChip status={server.status} className="ml-3" />
                </div>
              }
            >
              <div className="p-4 space-y-4">
                {/* Server Status */}
                <div>
                  <Typography variant="subtitle2" className="mb-2">
                    Status
                  </Typography>
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Status: </span>
                      <StatusChip status={server.status} />
                    </div>
                    {server.message && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Message: </span>
                        <span className="text-sm">{server.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Server Configuration */}
                {server.config && (
                  <div>
                    <button
                      onClick={() => handleServerToggle(server.id)}
                      className="flex items-center justify-between w-full p-3 text-left bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center">
                        <HardDrive className="w-4 h-4 mr-2 text-blue-500" />
                        <Typography variant="subtitle2">
                          Server Configuration ({Object.keys(server.config).length} items)
                        </Typography>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedServer === server.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {expandedServer === server.id && (
                      <div className="mt-3">{renderConfigTable(server.config)}</div>
                    )}
                  </div>
                )}

                {/* Server Tables */}
                {server.tables && Object.keys(server.tables).length > 0 && (
                  <div>
                    <Typography variant="subtitle2" className="mb-3">
                      Tables ({Object.keys(server.tables).length})
                    </Typography>
                    <div className="space-y-2">
                      {Object.entries(server.tables).map(([tableName, tableStatus]) => (
                        <div
                          key={tableName}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Typography variant="body2" className="font-medium">
                              {tableName}
                            </Typography>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Leader: {tableStatus.leader}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Log Size: </span>
                              <span>{Math.round(tableStatus.logSize / 1024)} KB</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">DB Size: </span>
                              <span>{Math.round(tableStatus.dbSize / 1024)} KB</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Raft Index: </span>
                              <span>{tableStatus.raftIndex}</span>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Raft Term: </span>
                              <span>{tableStatus.raftTerm}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Server Errors */}
                {server.errors && server.errors.length > 0 && (
                  <div>
                    <Typography variant="subtitle2" className="mb-2 text-red-600 dark:text-red-400">
                      Errors ({server.errors.length})
                    </Typography>
                    <div className="space-y-2">
                      {server.errors.map((err, index) => (
                        <div
                          key={index}
                          className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-3"
                        >
                          <Typography variant="body2" className="text-red-800 dark:text-red-200">
                            {err}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardWithHeader>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServerConfig;
