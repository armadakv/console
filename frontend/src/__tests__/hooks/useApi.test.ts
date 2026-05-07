import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';

import {
  queryKeys,
  useStatus,
  useClusterInfo,
  useTables,
  useKeyValuePairs,
  useKeyValuePair,
  useMetricsQuery,
  useMetricsRangeQuery,
  useAddKeyValuePair,
  useDeleteKeyValuePair,
  useCreateTable,
  useDeleteTable,
  useDebounce,
} from '../../hooks/useApi';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false, error: null }),
  useMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false, error: null }),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn(),
    cancelQueries: vi.fn(),
    getQueriesData: vi.fn().mockReturnValue([]),
    setQueriesData: vi.fn(),
    setQueryData: vi.fn(),
  }),
  keepPreviousData: undefined,
}));

vi.mock('../../api', () => ({
  getStatus: vi.fn(),
  getClusterInfo: vi.fn(),
  getTables: vi.fn(),
  getKeyValuePairs: vi.fn(),
  getKeyValue: vi.fn(),
  putKeyValuePair: vi.fn(),
  deleteKeyValuePair: vi.fn(),
  createTable: vi.fn(),
  deleteTable: vi.fn(),
  queryMetrics: vi.fn(),
  queryMetricsRange: vi.fn(),
}));

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>;
const mockUseMutation = useMutation as ReturnType<typeof vi.fn>;
const mockUseQueryClient = useQueryClient as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
  mockUseMutation.mockReturnValue({ mutateAsync: vi.fn(), isPending: false, error: null });
  mockUseQueryClient.mockReturnValue({
    invalidateQueries: vi.fn(),
    cancelQueries: vi.fn(),
    getQueriesData: vi.fn().mockReturnValue([]),
    setQueriesData: vi.fn(),
    setQueryData: vi.fn(),
  });
});

describe('queryKeys', () => {
  it('has static status key', () => {
    expect(queryKeys.status).toEqual(['status']);
  });

  it('has static clusterInfo key', () => {
    expect(queryKeys.clusterInfo).toEqual(['clusterInfo']);
  });

  it('has static tables key', () => {
    expect(queryKeys.tables).toEqual(['tables']);
  });

  it('builds keyValuePair key', () => {
    expect(queryKeys.keyValuePair('users', 'key1')).toEqual(['keyValuePair', 'users', 'key1']);
  });

  it('builds keyValuePairs key with defaults', () => {
    expect(queryKeys.keyValuePairs('users')).toEqual(['keyValuePairs', 'users', '', '', '']);
  });

  it('builds keyValuePairs key with all params', () => {
    expect(queryKeys.keyValuePairs('users', 'pre', 'a', 'z')).toEqual([
      'keyValuePairs',
      'users',
      'pre',
      'a',
      'z',
    ]);
  });

  it('builds metrics key without time', () => {
    expect(queryKeys.metrics('cpu_usage')).toEqual(['metrics', 'cpu_usage', undefined]);
  });

  it('builds metrics key with time', () => {
    expect(queryKeys.metrics('cpu_usage', '2024-01-01')).toEqual([
      'metrics',
      'cpu_usage',
      '2024-01-01',
    ]);
  });

  it('builds metricsRange key with all params', () => {
    expect(queryKeys.metricsRange('cpu', 'start', 'end', '1m')).toEqual([
      'metrics-range',
      'cpu',
      'start',
      'end',
      '1m',
    ]);
  });

  it('builds metricsRange key without step', () => {
    expect(queryKeys.metricsRange('cpu', 'start', 'end')).toEqual([
      'metrics-range',
      'cpu',
      'start',
      'end',
      undefined,
    ]);
  });
});

describe('useStatus', () => {
  it('calls useQuery', () => {
    renderHook(() => useStatus());
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.status }),
    );
  });

  it('returns query result', () => {
    mockUseQuery.mockReturnValue({ data: { status: 'ok' }, isLoading: false, error: null });
    const { result } = renderHook(() => useStatus());
    expect(result.current.data).toEqual({ status: 'ok' });
  });
});

describe('useClusterInfo', () => {
  it('calls useQuery with clusterInfo key', () => {
    renderHook(() => useClusterInfo());
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.clusterInfo }),
    );
  });
});

describe('useTables', () => {
  it('calls useQuery with tables key', () => {
    renderHook(() => useTables());
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.tables }),
    );
  });
});

describe('useKeyValuePairs', () => {
  it('calls useQuery', () => {
    renderHook(() => useKeyValuePairs('myTable'));
    expect(mockUseQuery).toHaveBeenCalled();
  });

  it('passes enabled: false when table is empty', () => {
    renderHook(() => useKeyValuePairs(''));
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('passes enabled: true when table is provided', () => {
    renderHook(() => useKeyValuePairs('myTable'));
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });
});

describe('useKeyValuePair', () => {
  it('calls useQuery', () => {
    renderHook(() => useKeyValuePair('myTable', 'myKey'));
    expect(mockUseQuery).toHaveBeenCalled();
  });

  it('passes enabled: false when table or key is empty', () => {
    renderHook(() => useKeyValuePair('', ''));
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('passes enabled: true when table and key provided', () => {
    renderHook(() => useKeyValuePair('myTable', 'myKey'));
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });
});

describe('useMetricsQuery', () => {
  it('calls useQuery with metrics key', () => {
    renderHook(() => useMetricsQuery('cpu_usage'));
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.metrics('cpu_usage', undefined) }),
    );
  });

  it('passes enabled: false when query is empty', () => {
    renderHook(() => useMetricsQuery(''));
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});

describe('useMetricsRangeQuery', () => {
  it('calls useQuery', () => {
    renderHook(() => useMetricsRangeQuery('cpu', '2024-01-01', '2024-01-02'));
    expect(mockUseQuery).toHaveBeenCalled();
  });

  it('passes correct query key', () => {
    renderHook(() => useMetricsRangeQuery('cpu', 'start', 'end', '1m'));
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.metricsRange('cpu', 'start', 'end', '1m') }),
    );
  });

  it('passes enabled: false when any required param is empty', () => {
    renderHook(() => useMetricsRangeQuery('', 'start', 'end'));
    expect(mockUseQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});

describe('useAddKeyValuePair', () => {
  it('calls useMutation', () => {
    renderHook(() => useAddKeyValuePair());
    expect(mockUseMutation).toHaveBeenCalled();
  });
});

describe('useDeleteKeyValuePair', () => {
  it('calls useMutation', () => {
    renderHook(() => useDeleteKeyValuePair());
    expect(mockUseMutation).toHaveBeenCalled();
  });
});

describe('useCreateTable', () => {
  it('calls useMutation', () => {
    renderHook(() => useCreateTable());
    expect(mockUseMutation).toHaveBeenCalled();
  });
});

describe('useDeleteTable', () => {
  it('calls useMutation', () => {
    renderHook(() => useDeleteTable());
    expect(mockUseMutation).toHaveBeenCalled();
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update before delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });
    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');
  });

  it('updates after delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });
    rerender({ value: 'updated' });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
  });
});
