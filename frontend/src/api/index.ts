import {ClusterInfo, KeyValuePair, MetricsQueryResponse, StatusResponse, Table} from '../types';

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
): Promise<KeyValuePair[]> => {
    const url = new URL(`${API_URL}/kv/${table}`, window.location.origin);
    if (prefix) {
        url.searchParams.append('prefix', prefix);
    }
    if (start && end) {
        url.searchParams.append('start', start);
        url.searchParams.append('end', end);
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
        body: JSON.stringify({key, value}),
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
        body: JSON.stringify({name}),
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

export const queryMetricsRange = async (
    query: string,
    start: string,
    end: string,
    step?: string
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
