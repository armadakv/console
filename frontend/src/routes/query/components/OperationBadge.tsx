import React from 'react';

import type { Operation } from '../QueryPage';

export const OPERATION_META: Record<
  Operation,
  { active: string; inactive: string; badge: string; badgeText: string; dot: string }
> = {
  GET: {
    active: 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-900/40',
    inactive: 'border-slate-700 text-blue-400 hover:border-blue-700 hover:bg-blue-950/40',
    badge: 'bg-blue-500/15',
    badgeText: 'text-blue-400',
    dot: 'bg-blue-500',
  },
  SCAN: {
    active: 'bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-900/40',
    inactive: 'border-slate-700 text-violet-400 hover:border-violet-700 hover:bg-violet-950/40',
    badge: 'bg-violet-500/15',
    badgeText: 'text-violet-400',
    dot: 'bg-violet-500',
  },
  PUT: {
    active: 'bg-green-600 border-green-600 text-white shadow-sm shadow-green-900/40',
    inactive: 'border-slate-700 text-green-400 hover:border-green-700 hover:bg-green-950/40',
    badge: 'bg-green-500/15',
    badgeText: 'text-green-400',
    dot: 'bg-green-500',
  },
  DELETE: {
    active: 'bg-red-600 border-red-600 text-white shadow-sm shadow-red-900/40',
    inactive: 'border-slate-700 text-red-400 hover:border-red-700 hover:bg-red-950/40',
    badge: 'bg-red-500/15',
    badgeText: 'text-red-400',
    dot: 'bg-red-500',
  },
};

interface OperationBadgeProps {
  op: Operation;
  size?: 'xs' | 'sm';
}

export const OperationBadge: React.FC<OperationBadgeProps> = ({ op, size = 'sm' }) => {
  const meta = OPERATION_META[op];
  return (
    <span
      className={`inline-flex items-center rounded font-bold font-mono ${meta.badge} ${meta.badgeText} ${
        size === 'xs' ? 'px-1 py-px text-[10px]' : 'px-1.5 py-0.5 text-xs'
      }`}
    >
      {op}
    </span>
  );
};
