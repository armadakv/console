import { Handle, NodeProps, Position } from '@xyflow/react';
import React from 'react';

export interface RaftMemberNodeData {
  label: string;
  nodeId: string;
  status: string;
  isCurrent: boolean;
  clientURL: string;
  peerURL: string;
  totalTables: number;
  highestRaftTerm: number;
  highestRaftIndex: number;
  errors: string[];
  [key: string]: unknown;
}

const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  const color =
    status === 'ok'
      ? 'bg-green-400 shadow-green-400/50'
      : status === 'error'
        ? 'bg-red-400 shadow-red-400/50'
        : 'bg-amber-400 shadow-amber-400/50';
  return <span className={`inline-block w-2 h-2 rounded-full ${color} shadow-sm`} />;
};

const RaftMemberNode: React.FC<NodeProps> = ({ data, selected }) => {
  const d = data as RaftMemberNodeData;

  return (
    <div
      className={`w-52 rounded-xl border text-xs font-sans transition-all ${
        selected
          ? 'border-blue-500 shadow-lg shadow-blue-500/20 bg-slate-800'
          : 'border-slate-700 bg-slate-800/80'
      }`}
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-700 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <StatusDot status={d.status} />
          <span className="font-semibold text-slate-100 truncate">{d.label}</span>
        </div>
        {d.isCurrent && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
            YOU
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-1.5">
        {d.clientURL && (
          <p className="text-slate-500 font-mono truncate text-[10px]">{d.clientURL}</p>
        )}

        <div className="flex justify-between text-slate-400">
          <span>Tables</span>
          <span className="text-slate-200 font-medium">{d.totalTables}</span>
        </div>

        {d.highestRaftTerm > 0 && (
          <div className="flex justify-between text-slate-400">
            <span>Term / Index</span>
            <span className="text-slate-200 font-mono">
              {d.highestRaftTerm} / {d.highestRaftIndex.toLocaleString()}
            </span>
          </div>
        )}

        {d.errors.length > 0 && (
          <div className="pt-1 border-t border-red-900/50">
            <p className="text-red-400 text-[10px]">
              ⚠ {d.errors.length} error{d.errors.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Invisible handles on all 4 sides — floating edges use border intersection, not handle positions */}
      <Handle type="source" position={Position.Top} style={{ opacity: 0, pointerEvents: 'none' }} />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
    </div>
  );
};

export default RaftMemberNode;
