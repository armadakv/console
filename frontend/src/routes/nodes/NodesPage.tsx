import { useNavigate } from '@tanstack/react-router';
import { CheckCircle2, XCircle, Server } from 'lucide-react';
import React from 'react';

import { formatBytes } from '../dashboard/utils';

import { useNavigation } from '@/context/NavigationContext';
import { useClusterInfo, useStatus } from '@/hooks/useApi';
import { useBreadcrumbs } from '@/hooks/usePageTitle';
import { ErrorState } from '@/shared/ErrorState';
import { LoadingState } from '@/shared/LoadingState';
import { RefreshButton } from '@/shared/RefreshButton';

const NodesPage: React.FC = () => {
  useBreadcrumbs([{ label: 'Nodes', current: true }]);
  const navigate = useNavigate();
  const { setPageAction, resetPageAction } = useNavigation();

  const {
    data: status,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useStatus();

  const {
    data: clusterInfo,
    isLoading: clusterLoading,
    error: clusterError,
    refetch: refetchCluster,
  } = useClusterInfo();

  const handleRefresh = React.useCallback(() => {
    refetchStatus();
    refetchCluster();
  }, [refetchStatus, refetchCluster]);

  React.useEffect(() => {
    setPageAction(<RefreshButton onClick={handleRefresh} variant="header" label="Refresh" />);
    return () => resetPageAction();
  }, [setPageAction, resetPageAction, handleRefresh]);

  if (statusLoading || clusterLoading) return <LoadingState />;
  if (statusError || clusterError) {
    return <ErrorState error={statusError || clusterError} onRetry={handleRefresh} />;
  }

  const members = clusterInfo?.members ?? [];
  const servers = status?.servers ?? [];

  const nodes = members.map((m) => {
    const server = servers.find((s) => s.id === m.id);
    const tableEntries = Object.entries(server?.tables ?? {});
    const leaderCount = tableEntries.filter(([, ts]) => ts.leader === m.id).length;
    const totalLogSize = tableEntries.reduce((acc, [, ts]) => acc + ts.logSize, 0);
    const totalDbSize = tableEntries.reduce((acc, [, ts]) => acc + ts.dbSize, 0);
    return {
      id: m.id,
      name: m.name || m.id,
      status: server?.status ?? 'unknown',
      message: server?.message ?? '',
      clientURL: m.clientURLs?.[0] ?? '',
      peerURL: m.peerURLs?.[0] ?? '',
      tableCount: tableEntries.length,
      leaderCount,
      totalLogSize,
      totalDbSize,
      isConnected: clusterInfo?.nodeId === m.id,
    };
  });

  const healthyCount = nodes.filter((n) => n.status === 'ok').length;

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Total</span>
          <span className="font-semibold text-slate-100">{nodes.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Healthy</span>
          <span className="font-semibold text-green-400">{healthyCount}</span>
        </div>
        {healthyCount < nodes.length && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Unhealthy</span>
            <span className="font-semibold text-red-400">{nodes.length - healthyCount}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Node
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                Client URL
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Raft Groups
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                Leading
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                DB Size
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {nodes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500 text-xs">
                  No nodes found
                </td>
              </tr>
            )}
            {nodes.map((node) => (
              <tr
                key={node.id}
                onClick={() => navigate({ to: '/nodes/$nodeId', params: { nodeId: node.id } })}
                className="cursor-pointer bg-slate-900 hover:bg-slate-800/70 transition-colors"
              >
                {/* Node identity */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Server className="w-4 h-4 text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-100 font-medium truncate">{node.name}</span>
                        {node.isConnected && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                            CONNECTED
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-mono truncate block">
                        {node.id}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {node.status === 'ok' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Healthy
                    </span>
                  ) : node.status === 'unknown' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <XCircle className="w-3.5 h-3.5" />
                      Unreachable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                      <XCircle className="w-3.5 h-3.5" />
                      {node.status}
                    </span>
                  )}
                </td>

                {/* Client URL */}
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-slate-400 font-mono truncate block max-w-[200px]">
                    {node.clientURL || node.peerURL || '—'}
                  </span>
                </td>

                {/* Table count */}
                <td className="px-4 py-3 text-right">
                  <span className="text-slate-200">{node.tableCount}</span>
                </td>

                {/* Leader count */}
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <span className="text-amber-400">{node.leaderCount}</span>
                </td>

                {/* DB Size */}
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <span className="text-slate-400 font-mono text-xs">
                    {node.totalDbSize > 0 ? formatBytes(node.totalDbSize) : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NodesPage;
