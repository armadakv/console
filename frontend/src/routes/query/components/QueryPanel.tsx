import { ChevronDown, ChevronUp, Clock, Play } from 'lucide-react';
import React, { useState } from 'react';

import type { Operation, QueryHistoryEntry, QueryParams, ScanMode } from '../QueryPage';

import { OPERATION_META, OperationBadge } from './OperationBadge';

import { useTables } from '@/hooks/useApi';
import { Input } from '@/ui/Input';

const getParamsSummary = (operation: Operation, params: QueryParams): string => {
  switch (operation) {
    case 'GET':
    case 'DELETE':
    case 'PUT': {
      const k = params.key || '';
      return k ? `"${k.length > 28 ? k.substring(0, 25) + '…' : k}"` : '';
    }
    case 'SCAN':
      if (params.scanMode === 'prefix') {
        const p = params.prefix || '';
        return `prefix:${p ? `"${p.substring(0, 20)}"` : '*'}`;
      }
      return `"${(params.rangeStart || '').substring(0, 12)}" → "${(params.rangeEnd || '').substring(0, 12)}"`;
    default:
      return '';
  }
};

interface QueryPanelProps {
  table: string;
  onTableChange: (t: string) => void;
  operation: Operation;
  onOperationChange: (op: Operation) => void;
  queryKey: string;
  onKeyChange: (k: string) => void;
  scanMode: ScanMode;
  onScanModeChange: (m: ScanMode) => void;
  prefix: string;
  onPrefixChange: (p: string) => void;
  rangeStart: string;
  onRangeStartChange: (s: string) => void;
  rangeEnd: string;
  onRangeEndChange: (e: string) => void;
  putValue: string;
  onPutValueChange: (v: string) => void;
  isLoading: boolean;
  onExecute: () => void;
  history: QueryHistoryEntry[];
  onLoadFromHistory: (entry: QueryHistoryEntry) => void;
}

const QueryPanel: React.FC<QueryPanelProps> = ({
  table,
  onTableChange,
  operation,
  onOperationChange,
  queryKey,
  onKeyChange,
  scanMode,
  onScanModeChange,
  prefix,
  onPrefixChange,
  rangeStart,
  onRangeStartChange,
  rangeEnd,
  onRangeEndChange,
  putValue,
  onPutValueChange,
  isLoading,
  onExecute,
  history,
  onLoadFromHistory,
}) => {
  const { data: tables, isLoading: tablesLoading } = useTables();
  const [historyOpen, setHistoryOpen] = useState(true);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const shortcutLabel = isMac ? '⌘↵' : 'Ctrl+↵';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (table && !isLoading) onExecute();
    }
  };

  const canExecute = !!table && !isLoading;

  return (
    <div
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/50">
        <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-slate-400" />
          Query Builder
        </h2>
      </div>

      <div className="p-4 space-y-5">
        {/* Table selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
            Table
          </label>
          <select
            value={table}
            onChange={(e) => onTableChange(e.target.value)}
            disabled={tablesLoading || isLoading}
            className="block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">— Select a table —</option>
            {tables?.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Operation selector */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
            Operation
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['GET', 'SCAN', 'PUT', 'DELETE'] as Operation[]).map((op) => {
              const meta = OPERATION_META[op];
              const isActive = operation === op;
              return (
                <button
                  key={op}
                  type="button"
                  onClick={() => onOperationChange(op)}
                  disabled={isLoading}
                  className={`py-1.5 rounded-lg border text-xs font-bold font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isActive ? meta.active : meta.inactive
                  }`}
                >
                  {op}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic form fields */}
        <div className="space-y-3">
          {/* GET / DELETE — key input */}
          {(operation === 'GET' || operation === 'DELETE') && (
            <Input
              label="Key"
              value={queryKey}
              onChange={(e) => onKeyChange(e.target.value)}
              placeholder="Enter key"
              disabled={isLoading}
              fullWidth
            />
          )}

          {/* SCAN */}
          {operation === 'SCAN' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  Scan mode
                </label>
                <div className="flex rounded-lg border border-slate-700 overflow-hidden">
                  {(['prefix', 'range'] as ScanMode[]).map((mode, i) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onScanModeChange(mode)}
                      disabled={isLoading}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 capitalize ${
                        i === 0 ? 'border-r border-slate-700' : ''
                      } ${
                        scanMode === mode
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {scanMode === 'prefix' ? (
                <Input
                  label="Prefix"
                  value={prefix}
                  onChange={(e) => onPrefixChange(e.target.value)}
                  placeholder="Leave empty to scan all keys"
                  disabled={isLoading}
                  fullWidth
                />
              ) : (
                <>
                  <Input
                    label="Start key (inclusive)"
                    value={rangeStart}
                    onChange={(e) => onRangeStartChange(e.target.value)}
                    placeholder="e.g. user:000"
                    disabled={isLoading}
                    fullWidth
                  />
                  <Input
                    label="End key (exclusive)"
                    value={rangeEnd}
                    onChange={(e) => onRangeEndChange(e.target.value)}
                    placeholder="e.g. user:zzz"
                    disabled={isLoading}
                    fullWidth
                  />
                </>
              )}
            </>
          )}

          {/* PUT — key + value */}
          {operation === 'PUT' && (
            <>
              <Input
                label="Key"
                value={queryKey}
                onChange={(e) => onKeyChange(e.target.value)}
                placeholder="Enter key"
                disabled={isLoading}
                fullWidth
              />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                  Value
                </label>
                <textarea
                  value={putValue}
                  onChange={(e) => onPutValueChange(e.target.value)}
                  placeholder={'{"key": "value"}'}
                  disabled={isLoading}
                  rows={6}
                  className="block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 font-mono resize-y"
                />
              </div>
            </>
          )}

          {/* DELETE warning */}
          {operation === 'DELETE' && queryKey && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-950/30 border border-red-900/40">
              <span className="text-red-400 text-sm mt-px">⚠</span>
              <p className="text-xs text-red-300 leading-relaxed">
                This will permanently delete{' '}
                <span className="font-mono font-medium">"{queryKey}"</span>. This action cannot be
                undone.
              </p>
            </div>
          )}
        </div>

        {/* Execute button */}
        <div>
          <button
            type="button"
            onClick={onExecute}
            disabled={!canExecute}
            className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              OPERATION_META[operation].active
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Executing…
              </>
            ) : (
              <>
                <span className="w-10 shrink-0" />
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Execute {operation}
                </span>
                <span className="w-10 shrink-0 flex justify-end">
                  <kbd className="inline-flex items-center rounded border border-current/30 bg-current/10 px-1.5 py-0.5 text-[11px] font-medium font-mono opacity-70 leading-none">
                    {shortcutLabel}
                  </kbd>
                </span>
              </>
            )}
          </button>
          {!table && (
            <p className="mt-1.5 text-xs text-slate-500 text-center">
              Select a table to enable execution
            </p>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-slate-800">
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              History
              <span className="bg-slate-700 text-slate-300 rounded-full px-1.5 py-px text-[10px] font-medium">
                {history.length}
              </span>
            </span>
            {historyOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {historyOpen && (
            <div className="max-h-56 overflow-y-auto">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onLoadFromHistory(entry)}
                  title="Click to reload this query"
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-800/60 transition-colors border-t border-slate-800/50"
                >
                  <OperationBadge op={entry.operation} size="xs" />
                  <span className="flex-1 truncate min-w-0 text-xs">
                    <span className="text-slate-300">{entry.table}</span>{' '}
                    <span className="text-slate-500">
                      {getParamsSummary(entry.operation, entry.params)}
                    </span>
                  </span>
                  <span
                    className={`text-[10px] flex-shrink-0 font-mono ${
                      entry.status === 'success' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {entry.status === 'success' ? '✓' : '✗'} {entry.duration}ms
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QueryPanel;
