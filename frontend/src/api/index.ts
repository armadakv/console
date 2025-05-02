import { KeyValuePair, StatusResponse, ClusterInfo, Metrics, Table } from '../types';

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

export const getMetrics = async (): Promise<Metrics> => {
  const response = await fetch(`${API_URL}/metrics`);
  return handleApiError(response);
};

export const getTables = async (): Promise<Table[]> => {
  const response = await fetch(`${API_URL}/tables`);
  return handleApiError(response);
};

export const getKeyValuePairs = async (
  table: string,
  prefix: string = ''
): Promise<KeyValuePair[]> => {
  const url = new URL(`${API_URL}/kv/${table}`, window.location.origin);
  if (prefix) {
    url.searchParams.append('prefix', prefix);
  }
  
  const response = await fetch(url.toString());
  return handleApiError(response);
};

export const putKeyValuePair = async (
  table: string,
  key: string,
  value: string
): Promise<void> => {
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

export const deleteKeyValuePair = async (
  table: string,
  key: string
): Promise<void> => {
  const url = new URL(`${API_URL}/kv/${table}`, window.location.origin);
  url.searchParams.append('key', key);
  
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });
  
  return handleApiError(response);
};