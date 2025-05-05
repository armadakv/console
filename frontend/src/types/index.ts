// Server status types
export interface TableStatus {
  logSize: number;
  dbSize: number;
  leader: string;
  raftIndex: number;
  raftTerm: number;
  raftAppliedIndex: number;
}

export interface ServerStatus {
  id: string;
  name: string;
  status: string;
  message: string;
  config?: Record<string, any>;
  tables?: Record<string, TableStatus>;
  errors?: string[];
}

export interface StatusResponse {
  servers: ServerStatus[];
}

// Server info type
export interface Server {
  id: string;
  name: string;
  peerURLs: string[];
  clientURLs: string[];
}

// Cluster info types
export interface ClusterInfo {
  nodeId: string;
  nodeAddress: string;
  members: Server[];
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

// Splash screen types
declare global {
  interface Window {
    hideSplashScreen?: () => void;
  }
}
