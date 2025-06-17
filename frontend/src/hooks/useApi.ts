import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';

import * as api from '../api';

// Debounce utility function
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Query keys
export const queryKeys = {
  status: ['status'],
  clusterInfo: ['clusterInfo'],
  tables: ['tables'],
  keyValuePairs: (table: string, prefix: string = '', start: string = '', end: string = '') => [
    'keyValuePairs',
    table,
    prefix,
    start,
    end,
  ],
  keyValuePair: (table: string, key: string) => ['keyValuePair', table, key],
  metrics: (query: string, time?: string) => ['metrics', query, time],
  metricsRange: (query: string, start: string, end: string, step?: string) => [
    'metrics-range',
    query,
    start,
    end,
    step,
  ],
};

// Status hook with caching
export const useStatus = () => {
  return useQuery(queryKeys.status, api.getStatus, {
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// Cluster info hook
export const useClusterInfo = () => {
  return useQuery(queryKeys.clusterInfo, api.getClusterInfo, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Tables hook
export const useTables = () => {
  return useQuery(queryKeys.tables, api.getTables);
};

// Key-value pairs hook with debouncing and optimizations
export const useKeyValuePairs = (
  table: string,
  prefix: string = '',
  start: string = '',
  end: string = '',
) => {
  // Debounce filter values to avoid excessive API calls
  const debouncedPrefix = useDebounce(prefix, 300);
  const debouncedStart = useDebounce(start, 300);
  const debouncedEnd = useDebounce(end, 300);

  // Memoize query key to prevent unnecessary re-renders
  const queryKey = useMemo(
    () => queryKeys.keyValuePairs(table, debouncedPrefix, debouncedStart, debouncedEnd),
    [table, debouncedPrefix, debouncedStart, debouncedEnd],
  );

  return useQuery(
    queryKey,
    () => api.getKeyValuePairs(table, debouncedPrefix, debouncedStart, debouncedEnd),
    {
      enabled: !!table, // Only run the query if table is provided
      staleTime: 10 * 1000, // Consider data fresh for 10 seconds
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      keepPreviousData: true, // Keep previous data while fetching new data
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
      } catch {
        throw new Error(`Key-value pair not found: ${key}`);
      }
    },
    {
      enabled: !!table && !!key,
    },
  );
};

// Metrics query hook
export const useMetricsQuery = (query: string, time?: string) => {
  return useQuery(queryKeys.metrics(query, time), () => api.queryMetrics(query, time), {
    enabled: !!query,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

// Metrics range query hook
export const useMetricsRangeQuery = (query: string, start: string, end: string, step?: string) => {
  return useQuery(
    queryKeys.metricsRange(query, start, end, step),
    () => api.queryMetricsRange(query, start, end, step),
    {
      enabled: !!query && !!start && !!end,
    },
  );
};

// Add/update key-value pair hook with optimizations
export const useAddKeyValuePair = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ table, key, value }: { table: string; key: string; value: string }) =>
      api.putKeyValuePair(table, key, value),
    {
      onSuccess: (_, { table }) => {
        // Invalidate all key-value pairs queries for this table
        queryClient.invalidateQueries(['keyValuePairs', table]);
        // Invalidate table metadata to update counts
        queryClient.invalidateQueries(queryKeys.status);
      },
      onError: (error) => {
        console.error('Failed to add/update key-value pair:', error);
      },
    },
  );
};

// Delete key-value pair hook with optimizations
export const useDeleteKeyValuePair = () => {
  const queryClient = useQueryClient();

  return useMutation(
    ({ table, key }: { table: string; key: string }) => api.deleteKeyValuePair(table, key),
    {
      onMutate: async ({ table, key }) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries(['keyValuePairs', table]);

        // Snapshot the previous value
        const previousKeyValuePairs = queryClient.getQueriesData(['keyValuePairs', table]);

        // Optimistically remove the item from all relevant queries
        queryClient.setQueriesData(['keyValuePairs', table], (old: any) => {
          if (!old || !Array.isArray(old)) return old;
          return old.filter((item: any) => item.key !== key);
        });

        // Return a context object with the snapshotted value
        return { previousKeyValuePairs };
      },
      onError: (err, _variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousKeyValuePairs) {
          context.previousKeyValuePairs.forEach(([queryKey, data]) => {
            queryClient.setQueryData(queryKey, data);
          });
        }
        console.error('Failed to delete key-value pair:', err);
      },
      onSettled: (_, __, { table }) => {
        // Always refetch after error or success to ensure consistency
        queryClient.invalidateQueries(['keyValuePairs', table]);
        queryClient.invalidateQueries(queryKeys.status);
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

// Optimized search hook with memoization
export const useKeyValueSearch = (
  table: string,
  searchTerm: string,
  searchType: 'key' | 'value' | 'both' = 'both',
) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  const { data: allKeyValuePairs, isLoading, error } = useKeyValuePairs(table);

  const filteredResults = useMemo(() => {
    if (!allKeyValuePairs || !debouncedSearchTerm) {
      return allKeyValuePairs || [];
    }

    const lowercaseSearchTerm = debouncedSearchTerm.toLowerCase();

    return allKeyValuePairs.filter((pair) => {
      switch (searchType) {
        case 'key':
          return pair.key.toLowerCase().includes(lowercaseSearchTerm);
        case 'value':
          return pair.value.toLowerCase().includes(lowercaseSearchTerm);
        case 'both':
          return (
            pair.key.toLowerCase().includes(lowercaseSearchTerm) ||
            pair.value.toLowerCase().includes(lowercaseSearchTerm)
          );
        default:
          return true;
      }
    });
  }, [allKeyValuePairs, debouncedSearchTerm, searchType]);

  return {
    data: filteredResults,
    isLoading,
    error,
    totalCount: allKeyValuePairs?.length || 0,
    filteredCount: filteredResults.length,
  };
};

// Export the debounce hook for use in other components
export { useDebounce };
