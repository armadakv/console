import { AlertTriangle, CheckCircle, Search, XCircle } from 'lucide-react';
import React from 'react';

import type { QueryResultState } from '../QueryPage';

import { OperationBadge } from './OperationBadge';
import ScanResultsTable from './ScanResultsTable';

import { CodeHighlighter, useContentViewer, ViewModeButtons } from '@/shared';
import { CopyButton } from '@/shared/CopyButton';
import type { KeyValuePair } from '@/types/index';

// ── Latency badge ─────────────────────────────────────────────────────────────

const LatencyBadge: React.FC<{ ms: number }> = ({ ms }) => {
  let colorCls: string;
  let label: string;
  if (ms < 1) {
    colorCls = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    label = `${ms.toFixed(3)}ms`;
  } else if (ms < 5) {
    colorCls = 'text-green-400 bg-green-500/10 border-green-500/30';
    label = `${ms.toFixed(2)}ms`;
  } else if (ms < 50) {
    colorCls = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    label = `${ms.toFixed(1)}ms`;
  } else {
    colorCls = 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    label = `${Math.round(ms)}ms`;
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-px text-[11px] font-mono font-medium ${colorCls}`}
      title="Server-side gRPC query duration"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      {label}
    </span>
  );
};

// ── Status bar ────────────────────────────────────────────────────────────────

const StatusBar: React.FC<{ result: QueryResultState }> = ({ result }) => {
  const { entry } = result;
  const isSuccess = entry.status === 'success';

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-2.5 border-b text-sm flex-shrink-0 ${
        isSuccess ? 'bg-slate-800/50 border-slate-700' : 'bg-red-950/30 border-red-900/40'
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      )}
      <OperationBadge op={entry.operation} />
      <span className="text-slate-400 text-xs">{entry.table}</span>
      <span className="text-slate-600 text-xs">·</span>
      <LatencyBadge ms={entry.duration} />
      {entry.resultCount !== undefined && (
        <>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-xs text-slate-400">
            {entry.resultCount} {entry.resultCount === 1 ? 'result' : 'results'}
          </span>
        </>
      )}
      <div className="flex-1" />
      <span className="text-[10px] text-slate-500">{entry.timestamp.toLocaleTimeString()}</span>
    </div>
  );
};

// ── GET result — full key + value viewer ──────────────────────────────────────

const GetResult: React.FC<{ data: KeyValuePair }> = ({ data }) => {
  const {
    viewMode,
    setViewMode,
    contentValidation,
    contentTypeLabel,
    formattedContent,
    shouldUseSyntaxHighlighter,
  } = useContentViewer({ content: data.value, autoDetect: true });

  return (
    <div className="p-4 space-y-4">
      {/* Key */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Key</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 truncate">
            {data.key}
          </code>
          <CopyButton text={data.key} variant="icon" label="key" />
        </div>
      </div>

      {/* Value */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Value</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {contentTypeLabel} · {data.value.length} chars
            </span>
            <ViewModeButtons
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              contentValidation={contentValidation}
            />
          </div>
        </div>
        {shouldUseSyntaxHighlighter ? (
          <CodeHighlighter
            content={formattedContent}
            language={viewMode}
            density="comfortable"
            showCopyButton
          />
        ) : (
          <CodeHighlighter
            content={data.value}
            language="text"
            density="comfortable"
            showCopyButton
          />
        )}
      </div>
    </div>
  );
};

// ── PUT / DELETE success ──────────────────────────────────────────────────────

const MutationSuccess: React.FC<{ operation: 'PUT' | 'DELETE'; keyName: string }> = ({
  operation,
  keyName,
}) => (
  <div className="p-8 flex flex-col items-center gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
      <CheckCircle className="w-6 h-6 text-green-500" />
    </div>
    <div>
      <p className="text-slate-200 font-medium">
        {operation === 'PUT' ? 'Key written successfully' : 'Key deleted successfully'}
      </p>
      {keyName && <p className="text-sm text-slate-400 mt-1 font-mono">"{keyName}"</p>}
    </div>
  </div>
);

// ── Error display ─────────────────────────────────────────────────────────────

const ErrorDisplay: React.FC<{ error: string }> = ({ error }) => (
  <div className="p-4">
    <div className="flex items-start gap-3 rounded-lg bg-red-950/30 border border-red-900/40 px-4 py-3">
      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-red-300">Query failed</p>
        <p className="text-xs text-red-400 mt-1 font-mono break-all">{error}</p>
      </div>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

interface QueryResultsProps {
  result: QueryResultState | null;
  isLoading: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

const QueryResults: React.FC<QueryResultsProps> = ({
  result,
  isLoading,
  isLoadingMore,
  onLoadMore,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-h-[300px] flex flex-col lg:h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/50 flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-200">Results</h2>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Loading */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center p-12 gap-3">
            <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="none">
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
            <span className="text-sm text-slate-400">Executing query…</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !result && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Search className="w-7 h-7 text-slate-500" />
            </div>
            <div>
              <p className="text-slate-200 font-medium">Run a query to see results</p>
              <p className="text-sm text-slate-500 mt-1">
                Select a table, choose an operation, fill in the parameters, and click Execute.
              </p>
              <p className="text-xs text-slate-600 mt-2 font-mono">Ctrl+↵ · ⌘↵ to execute</p>
            </div>
          </div>
        )}

        {/* Result */}
        {!isLoading && result && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <StatusBar result={result} />
            {result.entry.status === 'error' && result.entry.error && (
              <div className="flex-1 overflow-auto">
                <ErrorDisplay error={result.entry.error} />
              </div>
            )}
            {result.entry.status === 'success' && (
              <>
                {result.entry.operation === 'GET' && (
                  <>
                    {result.data === null ? (
                      <div className="flex-1 flex items-center justify-center p-12 gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-slate-400">Key not found</span>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-auto">
                        <GetResult data={result.data as KeyValuePair} />
                      </div>
                    )}
                  </>
                )}
                {result.entry.operation === 'SCAN' && (
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <ScanResultsTable
                      pairs={result.data as KeyValuePair[] | undefined}
                      more={result.more}
                      isLoadingMore={isLoadingMore}
                      onLoadMore={onLoadMore}
                    />
                  </div>
                )}
                {(result.entry.operation === 'PUT' || result.entry.operation === 'DELETE') && (
                  <MutationSuccess
                    operation={result.entry.operation}
                    keyName={result.entry.params.key || ''}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryResults;
