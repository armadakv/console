import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as api from '../api';

// Query keys
export const queryKeys = {
  status: ['status'],
  clusterInfo: ['clusterInfo'],
  metrics: ['metrics'],
  tables: ['tables'],
  keyValuePairs: (table: string, prefix: string = '', start: string = '', end: string = '') => [
    'keyValuePairs',
    table,
    prefix,
    start,
    end,
  ],
  keyValuePair: (table: string, key: string) => ['keyValuePair', table, key],
};

// Status hook
export const useStatus = () => {
  return useQuery(queryKeys.status, api.getStatus, {
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

// Cluster info hook
export const useClusterInfo = () => {
  return useQuery(queryKeys.clusterInfo, api.getClusterInfo, {
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

// Metrics hook
export const useMetrics = () => {
  return useQuery(queryKeys.metrics, api.getMetrics, {
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

// Tables hook
export const useTables = () => {
  return useQuery(queryKeys.tables, api.getTables);
};

// Key-value pairs hook
export const useKeyValuePairs = (
  table: string,
  prefix: string = '',
  start: string = '',
  end: string = '',
) => {
  return useQuery(
    queryKeys.keyValuePairs(table, prefix, start, end),
    () => api.getKeyValuePairs(table, prefix, start, end),
    {
      enabled: !!table, // Only run the query if table is provided
    },
  );
};

// Individual key-value pair hook
export const useKeyValuePair = (table: string, key: string) => {
  return useQuery(
    queryKeys.keyValuePair(table, key),
    async () => {
      // Get a single key-value pair
      if (!table || !key) {
        return null;
      }

      // Use our new direct API function to get a specific key-value pair
      try {
        return await api.getKeyValue(table, key);
      } catch (_) {
        throw new Error(`Key-value pair not found: ${key}`);
      }
    },
    {
      enabled: !!table && !!key,
    },
  );
};

// Add/update key-value pair hook
export const useAddKeyValuePair = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ table, key, value }: { table: string; key: string; value: string }) =>
      api.putKeyValuePair(table, key, value),
    {
      onSuccess: (_, { table, key }) => {
        // Invalidate the key-value pairs query to refetch the data
        queryClient.invalidateQueries(queryKeys.keyValuePairs(table));
        // Also invalidate the specific key-value pair if editing
        queryClient.invalidateQueries(queryKeys.keyValuePair(table, key));
      },
    },
  );
};

// Delete key-value pair hook
export const useDeleteKeyValuePair = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ table, key }: { table: string; key: string }) => api.deleteKeyValuePair(table, key),
    {
      onSuccess: (_, { table }) => {
        // Invalidate the key-value pairs query to refetch the data
        queryClient.invalidateQueries(queryKeys.keyValuePairs(table));
      },
    },
  );
};

// Create table hook
export const useCreateTable = () => {
  const queryClient = useQueryClient();

  return useMutation((name: string) => api.createTable(name), {
    onSuccess: () => {
      // Invalidate the tables query to refetch the data
      queryClient.invalidateQueries(queryKeys.tables);
    },
  });
};

// Delete table hook
export const useDeleteTable = () => {
  const queryClient = useQueryClient();

  return useMutation((name: string) => api.deleteTable(name), {
    onSuccess: () => {
      // Invalidate the tables query to refetch the data
      queryClient.invalidateQueries(queryKeys.tables);
    },
  });
};
