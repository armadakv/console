import {
  ClusterInfo,
  KeyValuePair,
  MetricsQueryResponse,
  ScanResult,
  StatusResponse,
  Table,
} from '../types';

// Base API URL
const API_URL = '/api';

// Helper function to handle API errors
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      message: errorData.message || 'An error occurred',
      status: response.status,
    };
  }
  return response.json();
};

// API functions
export const getStatus = async (): Promise<StatusResponse> => {
  const response = await fetch(`${API_URL}/status`);
  return handleApiError(response);
};

export const getClusterInfo = async (): Promise<ClusterInfo> => {
  const response = await fetch(`${API_URL}/cluster`);
  return handleApiError(response);
};

export const getTables = async (): Promise<Table[]> => {
  const response = await fetch(`${API_URL}/tables`);
  return handleApiError(response);
};

export const getKeyValuePairs = async (
  table: string,
  prefix: string = '',
  start: string = '',
  end: string = '',
  cursor: string = '',
): Promise<ScanResult> => {
  const url = new URL(`${API_URL}/kv/${table}`, window.location.origin);
  if (prefix) {
    url.searchParams.append('prefix', prefix);
  }
  if (start && end) {
    url.searchParams.append('start', start);
    url.searchParams.append('end', end);
  }
  if (cursor) {
    url.searchParams.append('cursor', cursor);
  }

  const response = await fetch(url.toString());
  return handleApiError(response);
};

export const getKeyValue = async (table: string, key: string): Promise<KeyValuePair> => {
  const response = await fetch(`${API_URL}/kv/${table}/${encodeURIComponent(key)}`);
  return handleApiError(response);
};

export const putKeyValuePair = async (table: string, key: string, value: string): Promise<void> => {
  const url = new URL(`${API_URL}/kv/${table}`, window.location.origin);

  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key, value }),
  });

  return handleApiError(response);
};

export const deleteKeyValuePair = async (table: string, key: string): Promise<void> => {
  const url = new URL(`${API_URL}/kv/${table}`, window.location.origin);
  url.searchParams.append('key', key);

  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });

  return handleApiError(response);
};

export const createTable = async (name: string): Promise<{ id: string }> => {
  const response = await fetch(`${API_URL}/tables`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  return handleApiError(response);
};

export const deleteTable = async (name: string): Promise<void> => {
  const response = await fetch(`${API_URL}/tables/${name}`, {
    method: 'DELETE',
  });

  return handleApiError(response);
};

export const queryMetrics = async (query: string, time?: string): Promise<MetricsQueryResponse> => {
  const url = new URL(`${API_URL}/metrics/query`, window.location.origin);
  url.searchParams.append('query', query);
  if (time) {
    url.searchParams.append('time', time);
  }

  const response = await fetch(url.toString());
  return handleApiError(response);
};

// Helper to parse the server-side query duration from the response header.
const parseQueryDuration = (response: Response): number => {
  const raw = response.headers.get('X-Query-Duration-Ms');
  return raw ? parseFloat(raw) : 0;
};

// Timed API functions for the Query workbench — return server-measured duration alongside data.

export interface TimedResult<T> {
  data: T;
  queryDurationMs: number;
}

export const timedGetKeyValue = async (
  table: string,
  key: string,
): Promise<TimedResult<KeyValuePair>> => {
  const response = await fetch(`${API_URL}/kv/${table}/${encodeURIComponent(key)}`);
  const queryDurationMs = parseQueryDuration(response);
  const data = await handleApiError(response);
  return { data, queryDurationMs };
};

export const timedGetKeyValuePairs = async (
  table: string,
  prefix: string = '',
  start: string = '',
  end: string = '',
  cursor: string = '',
): Promise<TimedResult<ScanResult>> => {
  const url = new URL(`${API_URL}/kv/${table}`, window.location.origin);
  if (prefix) url.searchParams.append('prefix', prefix);
  if (start && end) {
    url.searchParams.append('start', start);
    url.searchParams.append('end', end);
  }
  if (cursor) url.searchParams.append('cursor', cursor);
  const response = await fetch(url.toString());
  const queryDurationMs = parseQueryDuration(response);
  const data = await handleApiError(response);
  return { data, queryDurationMs };
};

export const timedPutKeyValuePair = async (
  table: string,
  key: string,
  value: string,
): Promise<TimedResult<void>> => {
  const url = new URL(`${API_URL}/kv/${table}`, window.location.origin);
  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  const queryDurationMs = parseQueryDuration(response);
  await handleApiError(response);
  return { data: undefined, queryDurationMs };
};

export const timedDeleteKeyValuePair = async (
  table: string,
  key: string,
): Promise<TimedResult<void>> => {
  const url = new URL(`${API_URL}/kv/${table}`, window.location.origin);
  url.searchParams.append('key', key);
  const response = await fetch(url.toString(), { method: 'DELETE' });
  const queryDurationMs = parseQueryDuration(response);
  await handleApiError(response);
  return { data: undefined, queryDurationMs };
};

export const queryMetricsRange = async (
  query: string,
  start: string,
  end: string,
  step?: string,
): Promise<MetricsQueryResponse> => {
  const url = new URL(`${API_URL}/metrics/query_range`, window.location.origin);
  url.searchParams.append('query', query);
  url.searchParams.append('start', start);
  url.searchParams.append('end', end);
  if (step) {
    url.searchParams.append('step', step);
  }

  const response = await fetch(url.toString());
  return handleApiError(response);
};
