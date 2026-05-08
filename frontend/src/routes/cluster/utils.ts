import type { MetricsQueryResponse } from '@/types';

/**
 * Extract a vector metric result into a Map<labelValue, bytes>.
 * Useful for indexing per-node or per-table Prometheus instant query results.
 */
export function extractVectorMap(
  data: MetricsQueryResponse | undefined,
  labelKey: string,
): Map<string, number> {
  const map = new Map<string, number>();
  if (!data?.data) return map;
  const { resultType, result } = data.data;
  if (resultType !== 'vector' || !Array.isArray(result)) return map;
  for (const r of result) {
    const item = r as { metric: Record<string, string>; value: [number, string] };
    const key = item.metric?.[labelKey];
    if (key) map.set(key, parseFloat(item.value?.[1] ?? '0') || 0);
  }
  return map;
}

/**
 * Format bytes to a human-readable string with appropriate unit
 * @param bytes - The number of bytes to format
 * @param decimals - Number of decimal places to include
 * @returns Formatted string with appropriate unit (e.g. "1.5 MB")
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
