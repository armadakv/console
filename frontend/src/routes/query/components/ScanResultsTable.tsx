import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

import { CodeHighlighter, useContentViewer, ViewModeButtons } from '@/shared';
import { CopyButton } from '@/shared/CopyButton';
import type { KeyValuePair } from '@/types/index';

const VALUE_PREVIEW_LENGTH = 100;

const ExpandedValue: React.FC<{ value: string }> = ({ value }) => {
  const {
    viewMode,
    setViewMode,
    contentValidation,
    contentTypeLabel,
    formattedContent,
    shouldUseSyntaxHighlighter,
  } = useContentViewer({ content: value, autoDetect: true });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 uppercase tracking-wide">
          {contentTypeLabel} · {value.length} chars
        </span>
        <ViewModeButtons
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          contentValidation={contentValidation}
        />
      </div>
      {shouldUseSyntaxHighlighter ? (
        <CodeHighlighter
          content={formattedContent}
          language={viewMode}
          density="compact"
          showCopyButton
        />
      ) : (
        <CodeHighlighter content={value} language="text" density="compact" showCopyButton />
      )}
    </div>
  );
};

interface ScanRowProps {
  pair: KeyValuePair;
}

const ScanRow: React.FC<ScanRowProps> = ({ pair }) => {
  const [expanded, setExpanded] = useState(false);

  const preview =
    pair.value.length > VALUE_PREVIEW_LENGTH
      ? pair.value.substring(0, VALUE_PREVIEW_LENGTH) + '…'
      : pair.value;

  return (
    <>
      <tr
        className="border-t border-slate-800 hover:bg-slate-800/40 cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-2 py-2.5 align-middle w-8 text-slate-500">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </td>
        <td className="px-3 py-2.5 align-middle w-2/5">
          <div className="flex items-center gap-2 min-w-0">
            <code className="text-xs font-mono text-slate-200 truncate">{pair.key}</code>
            <span onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
              <CopyButton text={pair.key} variant="icon" size="sm" label="key" />
            </span>
          </div>
        </td>
        <td className="px-3 py-2.5 align-middle max-w-0">
          <code className="text-xs font-mono text-slate-400 block truncate">{preview}</code>
        </td>
        <td className="px-2 py-2.5 align-middle w-8" onClick={(e) => e.stopPropagation()}>
          <CopyButton text={pair.value} variant="icon" size="sm" label="value" />
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-slate-700/50 bg-slate-800/20">
          <td colSpan={4} className="px-4 py-3 max-w-0">
            <div className="overflow-x-auto">
              <ExpandedValue value={pair.value} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

interface ScanResultsTableProps {
  pairs?: KeyValuePair[];
  more?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

const ScanResultsTable: React.FC<ScanResultsTableProps> = ({
  pairs,
  more,
  isLoadingMore,
  onLoadMore,
}) => {
  if (!pairs || pairs.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-400">No keys found matching the query.</p>
        <p className="text-xs text-slate-500 mt-1">
          Try a different prefix, range, or leave the prefix empty to scan all keys.
        </p>
      </div>
    );
  }

  const copyAllJson = JSON.stringify(
    pairs.reduce<Record<string, string>>((acc, p) => {
      acc[p.key] = p.value;
      return acc;
    }, {}),
    null,
    2,
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-800/20 flex-shrink-0">
        <span className="text-xs text-slate-400 flex items-center gap-2">
          {pairs.length} {pairs.length === 1 ? 'key' : 'keys'} · click a row to expand
          {more && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-xs font-medium">
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              more results available
            </span>
          )}
        </span>
        <CopyButton text={copyAllJson} variant="button" label="Copy all as JSON" size="sm" />
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full table-fixed">
          <thead>
            <tr className="bg-slate-900 sticky top-0 z-10 shadow-[0_1px_0_0_rgb(30_41_59)]">
              <th className="w-8 px-2 py-2" />
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide w-2/5">
                Key
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                Value
              </th>
              <th className="w-8 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair) => (
              <ScanRow key={pair.key} pair={pair} />
            ))}
          </tbody>
        </table>
        {more && (
          <div className="flex items-center justify-center px-4 py-4 border-t border-slate-800">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-lg hover:bg-blue-400/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
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
                  Loading…
                </>
              ) : (
                'Load more'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanResultsTable;
