import { useParams, useNavigate } from '@tanstack/react-router';
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import React, { useState } from 'react';

import { formatBytes } from '../dashboard/utils';

import NodeMetricsGrid from './components/NodeMetricsGrid';

import { useNavigation } from '@/context/NavigationContext';
import { useClusterInfo, useStatus } from '@/hooks/useApi';
import { useBreadcrumbs } from '@/hooks/usePageTitle';
import { ErrorState } from '@/shared/ErrorState';
import { LoadingState } from '@/shared/LoadingState';
import { RefreshButton } from '@/shared/RefreshButton';

// ─── small helpers ────────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-800 last:border-0">
    <span className="text-slate-500 text-xs shrink-0 w-28">{label}</span>
    <span className="text-slate-200 text-xs text-right font-mono break-all">{value}</span>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
    {children}
  </h3>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`rounded-xl border border-slate-800 bg-slate-900 p-4 ${className}`}>
    {children}
  </div>
);

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={copy}
      className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

const NodePage: React.FC = () => {
  const { nodeId } = useParams({ strict: false }) as { nodeId: string };
  const navigate = useNavigate();
  const { setPageAction, resetPageAction } = useNavigation();
  const [configOpen, setConfigOpen] = useState(false);

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

  // Compute name early so useBreadcrumbs can be called unconditionally before any return
  const memberEarly =
    !statusLoading && !clusterLoading
      ? clusterInfo?.members?.find((m) => m.id === nodeId)
      : undefined;
  const serverEarly =
    !statusLoading && !clusterLoading ? status?.servers?.find((s) => s.id === nodeId) : undefined;
  const nodeName = memberEarly?.name || serverEarly?.name || nodeId;
  useBreadcrumbs([
    { label: 'Nodes', href: '/nodes' },
    { label: nodeName, current: true },
  ]);

  if (statusLoading || clusterLoading) return <LoadingState />;
  if (statusError || clusterError) {
    return <ErrorState error={statusError || clusterError} onRetry={handleRefresh} />;
  }

  const member = clusterInfo?.members?.find((m) => m.id === nodeId);
  const server = status?.servers?.find((s) => s.id === nodeId);
  const name = member?.name || server?.name || nodeId;

  if (!member && !server) {
    return <div className="text-center py-16 text-slate-500 text-sm">Node not found.</div>;
  }

  const isConnected = clusterInfo?.nodeId === nodeId;
  const healthy = server?.status === 'ok';
  const clientURLs = member?.clientURLs ?? [];
  const peerURLs = member?.peerURLs ?? [];
  const tables = server?.tables ?? {};
  const errors = server?.errors ?? [];
  const config = server?.config;

  const tableEntries = Object.entries(tables).sort(([a], [b]) => a.localeCompare(b));
  const leaderCount = tableEntries.filter(([, ts]) => ts.leader === nodeId).length;
  const totalDbSize = tableEntries.reduce((acc, [, ts]) => acc + ts.dbSize, 0);
  const totalLogSize = tableEntries.reduce((acc, [, ts]) => acc + ts.logSize, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-100">{name}</h1>
            {isConnected && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                CONNECTED
              </span>
            )}
            {healthy ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Healthy
              </span>
            ) : server ? (
              <span className="inline-flex items-center gap-1 text-xs text-red-400">
                <XCircle className="w-3.5 h-3.5" />
                {server.status}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <XCircle className="w-3.5 h-3.5" />
                Unreachable
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{nodeId}</p>
        </div>

        {/* Quick stats */}
        <div className="ml-auto flex items-center gap-6 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-xs">Raft Groups</span>
            <span className="font-semibold text-slate-100">{tableEntries.length}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-xs">Leading</span>
            <span className="font-semibold text-amber-400">{leaderCount}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-xs">DB Size</span>
            <span className="font-semibold text-slate-100 font-mono text-xs">
              {totalDbSize > 0 ? formatBytes(totalDbSize) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Version / message */}
      {server?.message && (
        <p className="text-xs text-slate-400 font-mono bg-slate-900 rounded-lg border border-slate-800 px-4 py-2">
          {server.message}
        </p>
      )}

      {/* Two-column info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Connection */}
        <Card>
          <SectionTitle>Connection</SectionTitle>
          {clientURLs.length > 0 ? (
            clientURLs.map((url, i) => (
              <div
                key={i}
                className="flex justify-between items-center gap-2 py-2 border-b border-slate-800 last:border-0"
              >
                <span className="text-slate-500 text-xs w-28 shrink-0">
                  {clientURLs.length > 1 ? `Client URL ${i + 1}` : 'Client URL'}
                </span>
                <div className="flex items-center gap-1 min-w-0">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 font-mono truncate flex items-center gap-1"
                  >
                    {url}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <CopyButton text={url} />
                </div>
              </div>
            ))
          ) : (
            <Row label="Client URL" value="—" />
          )}
          {peerURLs.length > 0 ? (
            peerURLs.map((url, i) => (
              <div
                key={i}
                className="flex justify-between items-center gap-2 py-2 border-b border-slate-800 last:border-0"
              >
                <span className="text-slate-500 text-xs w-28 shrink-0">
                  {peerURLs.length > 1 ? `Peer URL ${i + 1}` : 'Peer URL'}
                </span>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs text-slate-300 font-mono truncate">{url}</span>
                  <CopyButton text={url} />
                </div>
              </div>
            ))
          ) : (
            <Row label="Peer URL" value="—" />
          )}
        </Card>

        {/* Storage summary */}
        <Card>
          <SectionTitle>Storage</SectionTitle>
          <Row label="DB Size" value={totalDbSize > 0 ? formatBytes(totalDbSize) : '—'} />
          <Row label="Log Size" value={totalLogSize > 0 ? formatBytes(totalLogSize) : '—'} />
          <Row label="Raft Groups" value={tableEntries.length} />
          <Row label="Leading" value={leaderCount} />
        </Card>
      </div>

      {/* Resource Metrics */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Resource Metrics
          </span>
        </div>
        <div className="p-4 bg-slate-900">
          <NodeMetricsGrid nodeId={nodeId} />
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <Card>
          <SectionTitle>Errors ({errors.length})</SectionTitle>
          <div className="space-y-1">
            {errors.map((e, i) => (
              <p key={i} className="text-xs text-red-400 bg-red-950/50 rounded px-3 py-2">
                {e}
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Raft Groups table */}
      {tableEntries.length > 0 && (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Raft Groups
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">
                  Table
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Role</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">
                  Term
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500">
                  Index
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 hidden md:table-cell">
                  Applied
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 hidden lg:table-cell">
                  Log Size
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 hidden lg:table-cell">
                  DB Size
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tableEntries.map(([tableName, ts]) => {
                const isLeader = ts.leader === nodeId;
                return (
                  <tr
                    key={tableName}
                    className="bg-slate-900 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        onClick={() =>
                          navigate({ to: '/data/$table', params: { table: tableName } })
                        }
                        className="text-blue-400 hover:text-blue-300 cursor-pointer font-mono text-xs"
                      >
                        {tableName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isLeader
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {isLeader ? 'LEADER' : 'FOLLOWER'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-300 font-mono">
                      {ts.raftTerm}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-300 font-mono">
                      {ts.raftIndex.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-300 font-mono hidden md:table-cell">
                      {ts.raftAppliedIndex.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400 font-mono hidden lg:table-cell">
                      {formatBytes(ts.logSize)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400 font-mono hidden lg:table-cell">
                      {formatBytes(ts.dbSize)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Config (collapsible) */}
      {config && Object.keys(config).length > 0 && (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <button
            onClick={() => setConfigOpen((o) => !o)}
            className="w-full px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Configuration
            </span>
            {configOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>
          {configOpen && (
            <div className="bg-slate-950 p-4">
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NodePage;
