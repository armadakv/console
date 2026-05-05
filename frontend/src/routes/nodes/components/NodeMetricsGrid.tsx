import { Loader2 } from 'lucide-react';
import React, { useMemo } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useMetricsRangeQuery } from '@/hooks/useApi';
import { MetricsQueryResponse } from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function extractMatrixSeries(data?: MetricsQueryResponse): { t: number; v: number }[] {
  if (!data?.data) return [];
  const { resultType, result } = data.data;
  // Accept 'matrix' explicitly, or fall back when resultType is missing but result looks like a matrix
  if (resultType !== 'matrix' && resultType !== ('' as string)) return [];
  if (!Array.isArray(result) || result.length === 0) return [];
  const first = result[0] as { values?: [number, string][] };
  if (!first?.values?.length) return [];
  return first.values.map(([ts, val]) => ({ t: ts * 1000, v: parseFloat(val) || 0 }));
}

function lastValue(series: { t: number; v: number }[]): number {
  return series.length ? series[series.length - 1].v : 0;
}

function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── types ────────────────────────────────────────────────────────────────────

interface MetricConfig {
  label: string;
  unit: string;
  decimals: number;
  color: string;
  gradientId: string;
}

const METRICS: MetricConfig[] = [
  { label: 'CPU Usage', unit: '%', decimals: 1, color: '#3b82f6', gradientId: 'cpuGrad' },
  { label: 'Memory Alloc', unit: 'MB', decimals: 0, color: '#f97316', gradientId: 'memGrad' },
  { label: 'Disk Usage', unit: 'MB', decimals: 1, color: '#06b6d4', gradientId: 'diskGrad' },
  { label: 'Network', unit: 'MB/s', decimals: 2, color: '#22c55e', gradientId: 'netGrad' },
];

// ─── single chart card ────────────────────────────────────────────────────────

interface MetricChartCardProps {
  config: MetricConfig;
  series: { t: number; v: number }[];
  loading: boolean;
  error: boolean;
}

const MetricChartCard: React.FC<MetricChartCardProps> = ({ config, series, loading, error }) => {
  const current = lastValue(series).toFixed(config.decimals);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-500">{config.label}</span>
        {!loading && !error && (
          <span className="text-sm font-semibold font-mono text-slate-100">
            {current}
            <span className="text-xs font-normal text-slate-500 ml-0.5">{config.unit}</span>
          </span>
        )}
      </div>

      <div className="h-20">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          </div>
        ) : error || series.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-slate-600">No data</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatTime}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={[0, 'auto']}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={32}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toFixed(config.decimals > 1 ? 1 : 0)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#e2e8f0',
                }}
                labelFormatter={(ms) => formatTime(Number(ms))}
                formatter={(v) => [
                  `${Number(v).toFixed(config.decimals)} ${config.unit}`,
                  config.label,
                ]}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={config.color}
                strokeWidth={1.5}
                fill={`url(#${config.gradientId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

interface NodeMetricsGridProps {
  nodeId: string;
}

const NodeMetricsGrid: React.FC<NodeMetricsGridProps> = ({ nodeId }) => {
  // 30-minute window, 30s step — computed once on mount
  const { start, end, step } = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return { start: String(now - 30 * 60), end: String(now), step: '30' };
  }, []);

  const cpuQ = `rate(process_cpu_seconds_total{node_id="${nodeId}"}[1m]) * 100`;
  const memQ = `sum(increase(go_memstats_alloc_bytes_total{node_id="${nodeId}"}[1m])) / 1024 / 1024`;
  const diskQ = `sum(regatta_table_storage_disk_usage_bytes{node_id="${nodeId}"}) / 1024 / 1024`;
  const netQ = `network_throughput_mbps{node_id="${nodeId}"}`;

  const {
    data: cpuData,
    isLoading: cpuL,
    isError: cpuE,
  } = useMetricsRangeQuery(cpuQ, start, end, step);
  const {
    data: memData,
    isLoading: memL,
    isError: memE,
  } = useMetricsRangeQuery(memQ, start, end, step);
  const {
    data: diskData,
    isLoading: diskL,
    isError: diskE,
  } = useMetricsRangeQuery(diskQ, start, end, step);
  const {
    data: netData,
    isLoading: netL,
    isError: netE,
  } = useMetricsRangeQuery(netQ, start, end, step);

  const series = [
    extractMatrixSeries(cpuData),
    extractMatrixSeries(memData),
    extractMatrixSeries(diskData),
    extractMatrixSeries(netData),
  ];
  const loadings = [cpuL, memL, diskL, netL];
  const errors = [cpuE, memE, diskE, netE];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {METRICS.map((cfg, i) => (
        <MetricChartCard
          key={cfg.gradientId}
          config={cfg}
          series={series[i]}
          loading={loadings[i]}
          error={errors[i]}
        />
      ))}
    </div>
  );
};

export default NodeMetricsGrid;
