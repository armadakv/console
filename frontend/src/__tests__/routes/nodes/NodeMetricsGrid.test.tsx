import { render, screen } from '@testing-library/react';
import React from 'react';

import NodeMetricsGrid from '../../../routes/nodes/components/NodeMetricsGrid';

vi.mock('recharts', () => ({
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock('@/hooks/useApi', () => ({
  useMetricsRangeQuery: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
}));

import { useMetricsRangeQuery } from '@/hooks/useApi';

const mockUseMetricsRangeQuery = useMetricsRangeQuery as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockUseMetricsRangeQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false });
});

describe('NodeMetricsGrid', () => {
  it('renders without crashing for a nodeId', () => {
    render(<NodeMetricsGrid nodeId="node-42" />);
    // Should render 5 metric labels (updated when disk metrics were added)
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('Memory Alloc')).toBeInTheDocument();
    expect(screen.getByText('Table Disk')).toBeInTheDocument();
    expect(screen.getByText('Raft Disk')).toBeInTheDocument();
    expect(screen.getByText('gRPC Rate')).toBeInTheDocument();
  });

  it('shows loader when isLoading=true', () => {
    mockUseMetricsRangeQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<NodeMetricsGrid nodeId="node-42" />);
    expect(screen.getAllByTestId('loader').length).toBeGreaterThan(0);
  });

  it('shows "No data" when isError=true', () => {
    mockUseMetricsRangeQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<NodeMetricsGrid nodeId="node-42" />);
    expect(screen.getAllByText('No data').length).toBeGreaterThan(0);
  });

  it('shows "No data" placeholder when data is undefined', () => {
    render(<NodeMetricsGrid nodeId="node-42" />);
    expect(screen.getAllByText('No data').length).toBe(5);
  });

  it('renders charts when data is available with matrix format', () => {
    const now = Math.floor(Date.now() / 1000);
    const matrixData = {
      status: 'success',
      data: {
        resultType: 'matrix',
        result: [
          {
            metric: {},
            values: [
              [now - 60, '1.5'],
              [now - 30, '2.0'],
              [now, '2.5'],
            ],
          },
        ],
      },
    };
    mockUseMetricsRangeQuery.mockReturnValue({
      data: matrixData,
      isLoading: false,
      isError: false,
    });
    render(<NodeMetricsGrid nodeId="node-42" />);
    expect(screen.getAllByTestId('area-chart').length).toBe(5);
  });
});
