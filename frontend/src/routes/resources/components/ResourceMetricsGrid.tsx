import { Loader2 } from 'lucide-react';
import React from 'react';

import { useMetricsQuery } from '@/hooks/useApi';
import { ErrorState } from '@/shared/ErrorState';
import { MetricsQueryResponse } from '@/types';

type MetricCardProps = {
  title: string;
  value: string | number;
  unit?: string;
  color: string;
  loading?: boolean;
  error?: boolean;
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  color,
  loading = false,
  error = false,
}) => {
  const colorClasses = {
    'primary.main': 'border-l-blue-500',
    'warning.main': 'border-l-orange-500',
    'info.main': 'border-l-cyan-500',
    'success.main': 'border-l-green-500',
  };

  const borderClass = colorClasses[color as keyof typeof colorClasses] || 'border-l-gray-500';

  return (
    <div
      className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 border-l-4 ${borderClass} h-full`}
    >
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-2">
        {title}
      </h3>

      {loading ? (
        <div className="flex justify-center my-4">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <p className="text-red-600 dark:text-red-400 text-sm text-center my-4">
          Error loading data
        </p>
      ) : (
        <div className="text-center my-4">
          <span className="text-3xl font-medium text-gray-900 dark:text-white">{value}</span>
          {unit && <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">{unit}</span>}
        </div>
      )}
    </div>
  );
};

interface ResourceMetricsGridProps {
  serverId?: string;
  serverAddress?: string;
}

const ResourceMetricsGrid: React.FC<ResourceMetricsGridProps> = ({
  serverId,
  serverAddress: _serverAddress,
}) => {
  // Query for CPU usage as percentage
  const cpuQuery = `rate(process_cpu_seconds_total{node_id="${serverId}"}[1m]) * 100`;
  const { data: cpuData, isLoading: cpuLoading, isError: cpuError } = useMetricsQuery(cpuQuery);

  // Query for memory usage in MB
  const memoryQuery = `sum(increase(go_memstats_alloc_bytes_total{node_id="${serverId}"}[1m])) / 1024 / 1024`;
  const {
    data: memoryData,
    isLoading: memoryLoading,
    isError: memoryError,
  } = useMetricsQuery(memoryQuery);

  // Query for disk usage in MB
  const diskQuery = `sum(regatta_table_storage_disk_usage_bytes{node_id="${serverId}"}) / 1024 / 1024`;
  const { data: diskData, isLoading: diskLoading, isError: diskError } = useMetricsQuery(diskQuery);

  // Query for network throughput in MB/s
  const networkQuery = `network_throughput_mbps{node_id="${serverId}"}`;
  const {
    data: networkData,
    isLoading: networkLoading,
    isError: networkError,
  } = useMetricsQuery(networkQuery);

  const extractVectorMetricValue = (
    data?: MetricsQueryResponse,
    defaultValue: number = 0,
  ): number => {
    // Check if data exists and has the expected structure
    if (!data || !data.data) {
      return defaultValue;
    }

    const { resultType, result } = data.data;

    switch (resultType) {
      case 'vector':
        if (result.length === 0) {
          return defaultValue;
        }
        // The result is a scalar value, which is an array with two elements: [timestamp, value]
        return Number(result[0].value[1]) || defaultValue;
      default:
        console.error(`Wrong result type ${resultType}`);
        return defaultValue;
    }
  };

  // Format the values with appropriate precision
  const cpuValue = extractVectorMetricValue(cpuData);
  const formattedCpuValue = cpuValue.toFixed(1);

  const memoryValue = extractVectorMetricValue(memoryData);
  const formattedMemoryValue = memoryValue.toFixed(0);

  const diskValue = extractVectorMetricValue(diskData);
  const formattedDiskValue = diskValue.toFixed(1);

  const networkValue = extractVectorMetricValue(networkData);
  const formattedNetworkValue = networkValue.toFixed(2);

  // Check if all metrics had errors
  const allError = cpuError && memoryError && diskError && networkError;
  if (allError) {
    return <ErrorState message="Failed to load metrics data." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="CPU Usage"
        value={formattedCpuValue}
        unit="%"
        color="primary.main"
        loading={cpuLoading}
        error={cpuError}
      />
      <MetricCard
        title="Memory Usage"
        value={formattedMemoryValue}
        unit="MB"
        color="warning.main"
        loading={memoryLoading}
        error={memoryError}
      />
      <MetricCard
        title="Disk Usage"
        value={formattedDiskValue}
        unit="MB"
        color="info.main"
        loading={diskLoading}
        error={diskError}
      />
      <MetricCard
        title="Network Throughput"
        value={formattedNetworkValue}
        unit="MB/s"
        color="success.main"
        loading={networkLoading}
        error={networkError}
      />
    </div>
  );
};

export default ResourceMetricsGrid;
