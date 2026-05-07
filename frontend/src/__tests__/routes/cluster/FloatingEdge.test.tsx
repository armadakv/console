import { render, screen } from '@testing-library/react';
import { getStraightPath, useInternalNode } from '@xyflow/react';
import React from 'react';

import FloatingEdge from '../../../routes/cluster/components/FloatingEdge';

vi.mock('@xyflow/react', () => ({
  getStraightPath: vi.fn().mockReturnValue(['M 0 0 L 100 100', 50, 50]),
  useInternalNode: vi.fn(),
  MarkerType: { ArrowClosed: 'arrowclosed' },
}));

const mockGetStraightPath = getStraightPath as ReturnType<typeof vi.fn>;
const mockUseInternalNode = useInternalNode as ReturnType<typeof vi.fn>;

const makeNode = (x: number, y: number, w = 200, h = 100) => ({
  internals: { positionAbsolute: { x, y } },
  measured: { width: w, height: h },
});

const defaultProps: any = {
  id: 'edge-1',
  source: 'source-id',
  target: 'target-id',
  sourceX: 10,
  sourceY: 10,
  targetX: 110,
  targetY: 110,
  markerEnd: undefined,
  markerStart: undefined,
  style: undefined,
  animated: false,
  data: {},
};

const renderEdge = (props: Partial<typeof defaultProps> = {}) =>
  render(
    <svg>
      <FloatingEdge {...defaultProps} {...props} />
    </svg>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockGetStraightPath.mockReturnValue(['M 0 0 L 100 100', 50, 50]);
  mockUseInternalNode.mockImplementation((id: string) =>
    id === 'source-id' ? makeNode(0, 0) : makeNode(300, 200),
  );
});

describe('FloatingEdge', () => {
  it('still renders a path when source node is not found', () => {
    mockUseInternalNode.mockReturnValue(undefined);
    const { container } = renderEdge();
    // falls back to prop-based coords, getStraightPath is still called
    expect(mockGetStraightPath).toHaveBeenCalled();
    expect(container.querySelector('path')).toBeInTheDocument();
  });

  it('renders a path element when both nodes are found', () => {
    const { container } = renderEdge();
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M 0 0 L 100 100');
  });

  it('renders forward label when data.forwardLabel is set', () => {
    renderEdge({ data: { forwardLabel: 'table1' } });
    expect(screen.getByText('→ table1')).toBeInTheDocument();
  });

  it('renders both forward and reverse labels when both are set', () => {
    renderEdge({ data: { forwardLabel: 'table1', reverseLabel: 'table2', bidirectional: true } });
    expect(screen.getByText('→ table1')).toBeInTheDocument();
    expect(screen.getByText('← table2')).toBeInTheDocument();
  });

  it('does not render label when data has no forwardLabel', () => {
    renderEdge({ data: { reverseLabel: 'table2' } });
    expect(screen.queryByText(/←/)).not.toBeInTheDocument();
  });

  it('renders animated class on path when animated=true', () => {
    const { container } = renderEdge({ animated: true });
    expect(container.querySelector('path')).toHaveClass('animated');
  });

  it('renders no animated class when animated=false', () => {
    const { container } = renderEdge({ animated: false });
    expect(container.querySelector('path')).not.toHaveClass('animated');
  });
});

// ── truncateTableList (tested via rendered label) ───────────────────────────

describe('truncateTableList (via rendered output)', () => {
  beforeEach(() => {
    mockUseInternalNode.mockReturnValue(undefined);
  });

  it('returns same string when ≤2 items', () => {
    renderEdge({ data: { forwardLabel: 'a, b' } });
    expect(screen.getByText('→ a, b')).toBeInTheDocument();
  });

  it('truncates with +N suffix when >2 items', () => {
    renderEdge({ data: { forwardLabel: 'a, b, c, d' } });
    expect(screen.getByText('→ a, b +2')).toBeInTheDocument();
  });

  it('truncates exactly 3 items to first 2 with +1', () => {
    renderEdge({ data: { forwardLabel: 'x, y, z' } });
    expect(screen.getByText('→ x, y +1')).toBeInTheDocument();
  });
});

// ── getBorderIntersection (tested via getStraightPath call args) ────────────

describe('getBorderIntersection (via getStraightPath args)', () => {
  it('uses prop coords when nodes lack measured dimensions', () => {
    mockUseInternalNode.mockImplementation((_id: string) => ({
      internals: { positionAbsolute: { x: 0, y: 0 } },
      measured: { width: undefined, height: undefined }, // no measured.width
    }));
    renderEdge();
    expect(mockGetStraightPath).toHaveBeenCalledWith(
      expect.objectContaining({ sourceX: 10, sourceY: 10, targetX: 110, targetY: 110 }),
    );
  });

  it('computes border intersection and passes adjusted coords to getStraightPath', () => {
    // Nodes with known sizes — intersection should differ from raw props
    mockUseInternalNode.mockImplementation((id: string) =>
      id === 'source-id' ? makeNode(0, 0, 200, 100) : makeNode(400, 0, 200, 100),
    );
    renderEdge();
    const callArgs = mockGetStraightPath.mock.calls[0][0];
    // source center is (100,50), target center is (500,50) — horizontal line
    // border intersection on source: cx + dx*scale = 100 + 98 = 198, y = 50
    expect(callArgs.sourceX).toBeCloseTo(198, 0);
    expect(callArgs.targetX).toBeCloseTo(402, 0);
  });
});
