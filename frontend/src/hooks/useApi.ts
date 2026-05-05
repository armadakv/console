import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: api.getStatus,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 1000,
  });
};

// Cluster info hook
export const useClusterInfo = () => {
  return useQuery({
    queryKey: queryKeys.clusterInfo,
    queryFn: api.getClusterInfo,
    refetchInterval: 30000,
  });
};

// Tables hook
export const useTables = () => {
  return useQuery({ queryKey: queryKeys.tables, queryFn: api.getTables });
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

  return useQuery({
    queryKey,
    queryFn: () => api.getKeyValuePairs(table, debouncedPrefix, debouncedStart, debouncedEnd),
    enabled: !!table,
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

// Individual key-value pair hook
export const useKeyValuePair = (table: string, key: string) => {
  return useQuery({
    queryKey: queryKeys.keyValuePair(table, key),
    queryFn: async () => {
      if (!table || !key) return null;
      try {
        return await api.getKeyValue(table, key);
      } catch {
        throw new Error(`Key-value pair not found: ${key}`);
      }
    },
    enabled: !!table && !!key,
  });
};

export const useMetricsQuery = (query: string, time?: string) => {
  return useQuery({
    queryKey: queryKeys.metrics(query, time),
    queryFn: () => api.queryMetrics(query, time),
    enabled: !!query,
    refetchInterval: 10000,
  });
};

export const useMetricsRangeQuery = (query: string, start: string, end: string, step?: string) => {
  return useQuery({
    queryKey: queryKeys.metricsRange(query, start, end, step),
    queryFn: () => api.queryMetricsRange(query, start, end, step),
    enabled: !!query && !!start && !!end,
  });
};

export const useAddKeyValuePair = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ table, key, value }: { table: string; key: string; value: string }) =>
      api.putKeyValuePair(table, key, value),
    onSuccess: (_, { table }) => {
      queryClient.invalidateQueries({ queryKey: ['keyValuePairs', table] });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
    onError: (error) => {
      console.error('Failed to add/update key-value pair:', error);
    },
  });
};

export const useDeleteKeyValuePair = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ table, key }: { table: string; key: string }) =>
      api.deleteKeyValuePair(table, key),
    onMutate: async ({ table, key }) => {
      await queryClient.cancelQueries({ queryKey: ['keyValuePairs', table] });
      const previousKeyValuePairs = queryClient.getQueriesData({
        queryKey: ['keyValuePairs', table],
      });

      queryClient.setQueriesData({ queryKey: ['keyValuePairs', table] }, (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((item: any) => item.key !== key);
      });

      return { previousKeyValuePairs };
    },
    onError: (err, _variables, context) => {
      if (context?.previousKeyValuePairs) {
        context.previousKeyValuePairs.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error('Failed to delete key-value pair:', err);
    },
    onSettled: (_, __, { table }) => {
      queryClient.invalidateQueries({ queryKey: ['keyValuePairs', table] });
      queryClient.invalidateQueries({ queryKey: queryKeys.status });
    },
  });
};

export const useCreateTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.createTable(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.deleteTable(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables });
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
