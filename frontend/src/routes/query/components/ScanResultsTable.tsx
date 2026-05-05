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
          <td colSpan={4} className="px-4 py-3">
            <ExpandedValue value={pair.value} />
          </td>
        </tr>
      )}
    </>
  );
};

interface ScanResultsTableProps {
  pairs?: KeyValuePair[];
}

const ScanResultsTable: React.FC<ScanResultsTableProps> = ({ pairs }) => {
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
    <div>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-800/20">
        <span className="text-xs text-slate-400">
          {pairs.length} {pairs.length === 1 ? 'key' : 'keys'} · click a row to expand
        </span>
        <CopyButton text={copyAllJson} variant="button" label="Copy all as JSON" size="sm" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/40">
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
      </div>
    </div>
  );
};

export default ScanResultsTable;
