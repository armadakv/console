import { useNavigate } from '@tanstack/react-router';
import { X, ExternalLink, ArrowRight } from 'lucide-react';
import React from 'react';

import { formatBytes } from '../utils';

import { ClusterInfo, StatusResponse } from '@/types';

interface NodeDetailPanelProps {
  nodeId: string | null;
  status: StatusResponse | undefined;
  clusterInfo: ClusterInfo | undefined;
  onClose: () => void;
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-800">
    <span className="text-slate-500 text-xs shrink-0">{label}</span>
    <span className="text-slate-200 text-xs text-right font-mono break-all">{value}</span>
  </div>
);

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  nodeId,
  status,
  clusterInfo,
  onClose,
}) => {
  const navigate = useNavigate();
  if (!nodeId) return null;

  const server = status?.servers?.find((s) => s.id === nodeId);
  const member = clusterInfo?.members?.find((m) => m.id === nodeId);

  const name = member?.name || server?.name || nodeId;
  const clientURL = member?.clientURLs?.[0] ?? '';
  const peerURL = member?.peerURLs?.[0] ?? '';
  const tables = server?.tables ?? {};
  const errors = server?.errors ?? [];

  const tableEntries = Object.entries(tables).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-10 shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate">{name}</p>
          <p className="text-xs text-slate-500 font-mono truncate mt-0.5">{nodeId}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              onClose();
              navigate({ to: '/nodes/$nodeId', params: { nodeId } });
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Open node page"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Connection info */}
        <section>
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Connection
          </h3>
          {clientURL && (
            <div className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-xs text-slate-500">Client URL</span>
              <a
                href={clientURL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-mono truncate"
              >
                {clientURL}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          )}
          {peerURL && (
            <div className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-xs text-slate-500">Peer URL</span>
              <span className="text-xs text-slate-300 font-mono truncate">{peerURL}</span>
            </div>
          )}
          {clusterInfo?.nodeId === nodeId && (
            <p className="mt-1 text-xs text-blue-400">← Connected via this node</p>
          )}
        </section>

        {/* Errors */}
        {errors.length > 0 && (
          <section>
            <h3 className="text-[10px] font-semibold text-red-500 uppercase tracking-widest mb-2">
              Errors ({errors.length})
            </h3>
            <div className="space-y-1">
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400 bg-red-950/50 rounded px-2 py-1">
                  {e}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Tables */}
        {tableEntries.length > 0 && (
          <section>
            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Raft Groups ({tableEntries.length})
            </h3>
            <div className="space-y-3">
              {tableEntries.map(([tableName, ts]) => {
                const isLeader = ts.leader === nodeId;
                return (
                  <div
                    key={tableName}
                    className="rounded-lg border border-slate-800 overflow-hidden"
                  >
                    <div
                      className={`px-3 py-2 flex items-center justify-between ${
                        isLeader ? 'bg-amber-500/10' : 'bg-slate-800/50'
                      }`}
                    >
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {tableName}
                      </span>
                      <span
                        className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isLeader
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {isLeader ? 'LEADER' : 'FOLLOWER'}
                      </span>
                    </div>
                    <div className="px-3 divide-y divide-slate-800/60">
                      <Row label="Term" value={ts.raftTerm} />
                      <Row label="Index" value={ts.raftIndex.toLocaleString()} />
                      <Row label="Applied" value={ts.raftAppliedIndex.toLocaleString()} />
                      <Row label="Log size" value={formatBytes(ts.logSize)} />
                      <Row label="DB size" value={formatBytes(ts.dbSize)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tableEntries.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-4">No table data available</p>
        )}
      </div>
    </div>
  );
};

export default NodeDetailPanel;
