import { RotateCw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Button } from '../ui';

interface RefreshButtonProps {
  onClick: () => void;
  isRefreshing?: boolean;
  variant?: 'icon' | 'button' | 'header';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MIN_VISIBLE_MS = 800;

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  isRefreshing = false,
  variant = 'icon',
  label = 'Refresh',
  size = 'sm',
  className,
}) => {
  const [show, setShow] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [, tick] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasRefreshingRef = useRef(false);

  useEffect(() => {
    if (isRefreshing) {
      if (timerRef.current) clearTimeout(timerRef.current);
      startRef.current = Date.now();
      setShow(true);
      wasRefreshingRef.current = true;
    } else if (show) {
      if (wasRefreshingRef.current) {
        setLastRefreshedAt(new Date());
        wasRefreshingRef.current = false;
      }
      const elapsed = startRef.current ? Date.now() - startRef.current : MIN_VISIBLE_MS;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
      timerRef.current = setTimeout(() => setShow(false), remaining);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRefreshing]);

  // Re-render every 10 s so the relative timestamp stays current
  useEffect(() => {
    const interval = setInterval(() => tick((n) => n + 1), 10_000);
    return () => clearInterval(interval);
  }, []);

  const icon = (
    <RotateCw
      className={`shrink-0 ${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} ${show ? 'animate-spin' : ''}`}
    />
  );

  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        disabled={show}
        title={show ? 'Refreshing…' : 'Refresh'}
        className={`p-2 rounded-md border border-slate-600 text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {icon}
      </button>
    );
  }

  if (variant === 'header') {
    return (
      <button
        onClick={onClick}
        disabled={show}
        title={show ? 'Refreshing…' : 'Refresh'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {icon}
        <span>{show ? 'Refreshing…' : label}</span>
        {!show && lastRefreshedAt && (
          <span className="text-slate-500 text-xs">· {formatRelativeTime(lastRefreshedAt)}</span>
        )}
      </button>
    );
  }

  return (
    <Button variant="outline" size={size} onClick={onClick} disabled={show} className={className}>
      {icon}
      <span className="ml-2">{show ? 'Refreshing…' : label}</span>
    </Button>
  );
};
