import React, { useState } from 'react';

import NodeDetailPanel from './components/NodeDetailPanel';
import RaftClusterView from './components/RaftClusterView';

import { useNavigation } from '@/context/NavigationContext';
import { useClusterInfo, useStatus } from '@/hooks/useApi';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import { ErrorState } from '@/shared/ErrorState';
import { LoadingState } from '@/shared/LoadingState';
import { RefreshButton } from '@/shared/RefreshButton';

const ClusterPage: React.FC = () => {
  useBreadcrumbs([{ label: 'Cluster', current: true }]);
  const { setPageAction, resetPageAction } = useNavigation();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const {
    data: status,
    isLoading: statusLoading,
    isFetching: statusFetching,
    error: statusError,
    refetch: refetchStatus,
  } = useStatus();

  const {
    data: clusterInfo,
    isLoading: clusterLoading,
    isFetching: clusterFetching,
    error: clusterError,
    refetch: refetchCluster,
  } = useClusterInfo();

  const isFetching = statusFetching || clusterFetching;

  const handleRefresh = React.useCallback(() => {
    refetchStatus();
    refetchCluster();
  }, [refetchStatus, refetchCluster]);

  React.useEffect(() => {
    setPageAction(
      <RefreshButton onClick={handleRefresh} isRefreshing={isFetching} variant="header" />,
    );
    return () => resetPageAction();
  }, [setPageAction, resetPageAction, handleRefresh, isFetching]);

  const isLoading = statusLoading || clusterLoading;
  const hasError = statusError || clusterError;

  if (isLoading) return <LoadingState />;
  if (hasError) {
    return <ErrorState error={statusError || clusterError} onRetry={handleRefresh} />;
  }

  const memberCount = clusterInfo?.members?.length ?? status?.servers?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Members</span>
          <span className="font-semibold text-slate-100">{memberCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Connected to</span>
          <span className="font-mono text-slate-300 text-xs">
            {clusterInfo?.nodeAddress || '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Status</span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              status?.servers?.every((s) => s.status === 'ok') ? 'text-green-400' : 'text-red-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status?.servers?.every((s) => s.status === 'ok') ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            {status?.servers?.every((s) => s.status === 'ok') ? 'Healthy' : 'Degraded'}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative rounded-xl border border-slate-800 overflow-hidden"
        style={{ height: 'calc(100vh - 14rem)' }}
      >
        <RaftClusterView
          status={status}
          clusterInfo={clusterInfo}
          selectedNodeId={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
        />
        <NodeDetailPanel
          nodeId={selectedNodeId}
          status={status}
          clusterInfo={clusterInfo}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <svg width="24" height="10" className="shrink-0">
            <line
              x1="0"
              y1="5"
              x2="24"
              y2="5"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          </svg>
          Peer connection
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="24" height="10" className="shrink-0">
            <defs>
              <marker
                id="legend-arrow"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" />
              </marker>
            </defs>
            <line
              x1="0"
              y1="5"
              x2="20"
              y2="5"
              stroke="#3b82f6"
              strokeWidth="1.5"
              markerEnd="url(#legend-arrow)"
            />
          </svg>
          Raft replication
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded border border-blue-500 bg-slate-800" />
          Connected node
        </div>
      </div>
    </div>
  );
};

export default ClusterPage;
