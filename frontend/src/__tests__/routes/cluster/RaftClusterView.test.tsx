import { render, screen, fireEvent } from '@testing-library/react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import React from 'react';

import RaftClusterView from '../../../routes/cluster/components/RaftClusterView';

import type { ClusterInfo, StatusResponse } from '@/types';

vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children, onNodeClick, onPaneClick }: any) => (
    <div
      data-testid="react-flow"
      onClick={() => onNodeClick?.({} as MouseEvent, { id: 'node1' })}
      onContextMenu={() => onPaneClick?.()}
    >
      {children}
    </div>
  ),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  useNodesState: vi.fn().mockReturnValue([[], vi.fn(), vi.fn()]),
  useEdgesState: vi.fn().mockReturnValue([[], vi.fn(), vi.fn()]),
  MarkerType: { ArrowClosed: 'arrowclosed' },
  BackgroundVariant: { Dots: 'dots' },
  ConnectionMode: { Loose: 'loose' },
}));

vi.mock('../../../routes/cluster/components/FloatingEdge', () => ({ default: () => null }));
vi.mock('../../../routes/cluster/components/RaftMemberNode', () => ({ default: () => null }));
vi.mock('@xyflow/react/dist/style.css', () => ({}));

const mockUseNodesState = useNodesState as ReturnType<typeof vi.fn>;
const mockUseEdgesState = useEdgesState as ReturnType<typeof vi.fn>;

const makeStatus = (overrides: Partial<StatusResponse> = {}): StatusResponse => ({
  servers: [],
  ...overrides,
});

const makeClusterInfo = (overrides: Partial<ClusterInfo> = {}): ClusterInfo => ({
  nodeId: 'node-1',
  nodeAddress: 'localhost:5000',
  members: [],
  ...overrides,
});

const defaultProps = {
  status: undefined,
  clusterInfo: undefined,
  selectedNodeId: null,
  onNodeSelect: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  const setNodes = vi.fn();
  const setEdges = vi.fn();
  mockUseNodesState.mockReturnValue([[], setNodes, vi.fn()]);
  mockUseEdgesState.mockReturnValue([[], setEdges, vi.fn()]);
});

describe('RaftClusterView', () => {
  it('renders without crash with no status or clusterInfo', () => {
    render(<RaftClusterView {...defaultProps} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders ReactFlow component', () => {
    render(<RaftClusterView {...defaultProps} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders Background inside ReactFlow', () => {
    render(<RaftClusterView {...defaultProps} />);
    expect(screen.getByTestId('background')).toBeInTheDocument();
  });

  it('renders Controls inside ReactFlow', () => {
    render(<RaftClusterView {...defaultProps} />);
    expect(screen.getByTestId('controls')).toBeInTheDocument();
  });

  it('calls onNodeSelect when a node is clicked', () => {
    const onNodeSelect = vi.fn();
    render(<RaftClusterView {...defaultProps} onNodeSelect={onNodeSelect} />);
    fireEvent.click(screen.getByTestId('react-flow'));
    expect(onNodeSelect).toHaveBeenCalled();
  });

  it('calls onNodeSelect with null when same node is clicked again (deselect)', () => {
    const onNodeSelect = vi.fn();
    render(
      <RaftClusterView {...defaultProps} selectedNodeId="node1" onNodeSelect={onNodeSelect} />,
    );
    fireEvent.click(screen.getByTestId('react-flow'));
    expect(onNodeSelect).toHaveBeenCalledWith(null);
  });

  it('calls onNodeSelect with node id when different node is clicked', () => {
    const onNodeSelect = vi.fn();
    render(
      <RaftClusterView {...defaultProps} selectedNodeId="other-node" onNodeSelect={onNodeSelect} />,
    );
    fireEvent.click(screen.getByTestId('react-flow'));
    expect(onNodeSelect).toHaveBeenCalledWith('node1');
  });

  it('renders with status containing servers', () => {
    const status = makeStatus({
      servers: [
        {
          id: 'srv-1',
          name: 'server-1',
          status: 'ok',
          message: '',
          tables: {},
          errors: [],
        },
      ],
    });
    render(<RaftClusterView {...defaultProps} status={status} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders with clusterInfo containing members', () => {
    const clusterInfo = makeClusterInfo({
      nodeId: 'node-1',
      members: [
        {
          id: 'node-1',
          name: 'Node 1',
          clientURLs: ['http://localhost:2379'],
          peerURLs: ['http://localhost:2380'],
        },
        {
          id: 'node-2',
          name: 'Node 2',
          clientURLs: ['http://localhost:2479'],
          peerURLs: ['http://localhost:2480'],
        },
      ],
    });
    render(<RaftClusterView {...defaultProps} clusterInfo={clusterInfo} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders with both status and clusterInfo', () => {
    const status = makeStatus({
      servers: [
        {
          id: 'node-1',
          name: 'Node 1',
          status: 'ok',
          message: '',
          tables: {
            myTable: {
              raftTerm: 5,
              raftIndex: 100,
              leader: 'node-1',
              logSize: 0,
              dbSize: 0,
              raftAppliedIndex: 100,
            },
          },
          errors: [],
        },
        {
          id: 'node-2',
          name: 'Node 2',
          status: 'ok',
          message: '',
          tables: {
            myTable: {
              raftTerm: 5,
              raftIndex: 99,
              leader: 'node-1',
              logSize: 0,
              dbSize: 0,
              raftAppliedIndex: 99,
            },
          },
          errors: [],
        },
      ],
    });
    const clusterInfo = makeClusterInfo({
      nodeId: 'node-1',
      members: [
        { id: 'node-1', name: 'Node 1', clientURLs: [], peerURLs: [] },
        { id: 'node-2', name: 'Node 2', clientURLs: [], peerURLs: [] },
      ],
    });
    render(<RaftClusterView {...defaultProps} status={status} clusterInfo={clusterInfo} />);
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });
});
