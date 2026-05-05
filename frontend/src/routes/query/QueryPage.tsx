import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useState } from 'react';

import QueryPanel from './components/QueryPanel';
import QueryResults from './components/QueryResults';

import * as api from '@/api';
import { useBreadcrumbs } from '@/hooks/useBreadcrumbs';
import type { KeyValuePair } from '@/types/index';

export type Operation = 'GET' | 'SCAN' | 'PUT' | 'DELETE';
export type ScanMode = 'prefix' | 'range';

export interface QueryParams {
  key?: string;
  scanMode?: ScanMode;
  prefix?: string;
  rangeStart?: string;
  rangeEnd?: string;
  putValue?: string;
}

export interface QueryHistoryEntry {
  id: string;
  timestamp: Date;
  operation: Operation;
  table: string;
  params: QueryParams;
  status: 'success' | 'error';
  duration: number;
  resultCount?: number;
  error?: string;
}

export interface QueryResultState {
  entry: QueryHistoryEntry;
  data?: KeyValuePair | KeyValuePair[];
}

const QueryPage: React.FC = () => {
  // Form state
  const [table, setTable] = useState('');
  const [operation, setOperation] = useState<Operation>('GET');
  const [key, setKey] = useState('');
  const [scanMode, setScanMode] = useState<ScanMode>('prefix');
  const [prefix, setPrefix] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [putValue, setPutValue] = useState('');

  // Execution state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResultState | null>(null);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);

  const queryClient = useQueryClient();
  useBreadcrumbs([{ label: 'Query', current: true }]);

  const executeQuery = useCallback(async () => {
    if (!table) return;

    setIsLoading(true);
    const startTime = Date.now();

    const params: QueryParams = {};
    switch (operation) {
      case 'GET':
      case 'DELETE':
        params.key = key;
        break;
      case 'SCAN':
        params.scanMode = scanMode;
        params.prefix = prefix;
        params.rangeStart = rangeStart;
        params.rangeEnd = rangeEnd;
        break;
      case 'PUT':
        params.key = key;
        params.putValue = putValue;
        break;
    }

    try {
      let data: KeyValuePair | KeyValuePair[] | undefined;
      let queryDurationMs: number;

      switch (operation) {
        case 'GET': {
          const r = await api.timedGetKeyValue(table, key);
          data = r.data;
          queryDurationMs = r.queryDurationMs;
          break;
        }
        case 'SCAN': {
          const r = await api.timedGetKeyValuePairs(
            table,
            scanMode === 'prefix' ? prefix : '',
            scanMode === 'range' ? rangeStart : '',
            scanMode === 'range' ? rangeEnd : '',
          );
          data = r.data;
          queryDurationMs = r.queryDurationMs;
          break;
        }
        case 'PUT': {
          const r = await api.timedPutKeyValuePair(table, key, putValue);
          queryDurationMs = r.queryDurationMs;
          queryClient.invalidateQueries({ queryKey: ['keyValuePairs', table] });
          break;
        }
        case 'DELETE': {
          const r = await api.timedDeleteKeyValuePair(table, key);
          queryDurationMs = r.queryDurationMs;
          queryClient.invalidateQueries({ queryKey: ['keyValuePairs', table] });
          break;
        }
      }

      const entry: QueryHistoryEntry = {
        id: Math.random().toString(36).slice(2),
        timestamp: new Date(),
        operation,
        table,
        params,
        status: 'success',
        duration: queryDurationMs!,
        resultCount: Array.isArray(data) ? data.length : data ? 1 : undefined,
      };

      setResult({ entry, data });
      setHistory((prev) => [entry, ...prev].slice(0, 20));
    } catch (err) {
      const duration = parseFloat((Date.now() - startTime).toFixed(3));
      const errorMessage =
        err instanceof Error ? err.message : (err as any)?.message || 'An unknown error occurred';

      const entry: QueryHistoryEntry = {
        id: Math.random().toString(36).slice(2),
        timestamp: new Date(),
        operation,
        table,
        params,
        status: 'error',
        duration,
        error: errorMessage,
      };

      setResult({ entry });
      setHistory((prev) => [entry, ...prev].slice(0, 20));
    } finally {
      setIsLoading(false);
    }
  }, [table, operation, key, scanMode, prefix, rangeStart, rangeEnd, putValue, queryClient]);

  const loadFromHistory = (entry: QueryHistoryEntry) => {
    setTable(entry.table);
    setOperation(entry.operation);
    if (entry.params.key !== undefined) setKey(entry.params.key);
    if (entry.params.scanMode !== undefined) setScanMode(entry.params.scanMode);
    if (entry.params.prefix !== undefined) setPrefix(entry.params.prefix);
    if (entry.params.rangeStart !== undefined) setRangeStart(entry.params.rangeStart);
    if (entry.params.rangeEnd !== undefined) setRangeEnd(entry.params.rangeEnd);
    if (entry.params.putValue !== undefined) setPutValue(entry.params.putValue);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <div className="w-full lg:w-[420px] shrink-0">
        <QueryPanel
          table={table}
          onTableChange={setTable}
          operation={operation}
          onOperationChange={setOperation}
          queryKey={key}
          onKeyChange={setKey}
          scanMode={scanMode}
          onScanModeChange={setScanMode}
          prefix={prefix}
          onPrefixChange={setPrefix}
          rangeStart={rangeStart}
          onRangeStartChange={setRangeStart}
          rangeEnd={rangeEnd}
          onRangeEndChange={setRangeEnd}
          putValue={putValue}
          onPutValueChange={setPutValue}
          isLoading={isLoading}
          onExecute={executeQuery}
          history={history}
          onLoadFromHistory={loadFromHistory}
        />
      </div>
      <div className="w-full lg:flex-1 min-w-0">
        <QueryResults result={result} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default QueryPage;
