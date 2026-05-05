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
