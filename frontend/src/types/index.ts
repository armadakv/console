// Server status types
export interface ServerStatus {
  id: string;
  name: string;
  status: string;
  message: string;
  config?: Record<string, any>;
}

export interface StatusResponse {
  servers: ServerStatus[];
}

// Cluster info types
export interface ClusterInfo {
  nodeId: string;
  nodeAddress: string;
  leader: string;
  followers: string[];
  term: number;
}

// Metrics types
export interface Metrics {
  requestCount: number;
  keyCount: number;
  diskUsage: number;
  memoryUsage: number;
  upTime: number;
  requestLatency: number;
}

// Table types
export interface Table {
  id: string;
  name: string;
}

// Key-value pair types
export interface KeyValuePair {
  key: string;
  value: string;
}

// Table management types
export interface CreateTableRequest {
  name: string;
}

export interface CreateTableResponse {
  id: string;
}
