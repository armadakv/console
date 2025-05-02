// API response types
export interface ServerStatus {
  id: string;
  name: string;
  status: string;
  message: string;
}

export interface StatusResponse {
  servers: ServerStatus[];
}

export interface ClusterInfo {
  nodeId: string;
  nodeAddress: string;
  leader: string;
  followers: string[];
  term: number;
}

export interface Metrics {
  requestCount: number;
  keyCount: number;
  diskUsage: number;
  memoryUsage: number;
  upTime: number;
  requestLatency: number;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface Table {
  name: string;
  id: string;
}

// API error type
export interface ApiError {
  message: string;
  status?: number;
}
