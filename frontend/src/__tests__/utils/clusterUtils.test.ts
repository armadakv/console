import { formatBytes } from '../../routes/cluster/utils';

describe('formatBytes', () => {
  it('returns "0 Bytes" for 0', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
  });

  it('returns "1 Bytes" for 1', () => {
    expect(formatBytes(1)).toBe('1 Bytes');
  });

  it('returns "1 KB" for 1024', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('returns "1 MB" for 1024 * 1024', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });

  it('respects custom decimals: formatBytes(1500, 1) → "1.5 KB"', () => {
    expect(formatBytes(1500, 1)).toBe('1.5 KB');
  });

  it('treats negative decimals as 0', () => {
    expect(formatBytes(1536, -1)).toBe('2 KB');
  });
});
