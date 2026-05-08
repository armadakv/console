import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import NodeDetailPanel from '../../../routes/cluster/components/NodeDetailPanel';

import type { ClusterInfo, StatusResponse } from '@/types';

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));

vi.mock('@/hooks/useApi', () => ({
  useMetricsQuery: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}));

vi.mock('lucide-react', () => ({
  X: () => <span />,
  ExternalLink: () => <span />,
  ArrowRight: () => <span />,
}));

const makeStatus = (overrides: Partial<StatusResponse> = {}): StatusResponse => ({
  servers: [
    {
      id: 'n1',
      name: 'alpha',
      status: 'ok',
      message: '',
      tables: {},
      errors: [],
    },
  ],
  ...overrides,
});

const makeClusterInfo = (overrides: Partial<ClusterInfo> = {}): ClusterInfo => ({
  nodeId: 'n1',
  nodeAddress: 'localhost:2379',
  members: [
    {
      id: 'n1',
      name: 'alpha',
      clientURLs: ['http://localhost:2379'],
      peerURLs: ['http://localhost:2380'],
    },
  ],
  ...overrides,
});

describe('NodeDetailPanel', () => {
  it('returns null when nodeId is null', () => {
    const { container } = render(
      <NodeDetailPanel
        nodeId={null}
        status={undefined}
        clusterInfo={undefined}
        onClose={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nodeId when no server/member data found', () => {
    render(
      <NodeDetailPanel
        nodeId="unknown-node"
        status={makeStatus()}
        clusterInfo={makeClusterInfo()}
        onClose={vi.fn()}
      />,
    );
    // nodeId appears both as the fallback name and the subtitle — at least one should exist
    expect(screen.getAllByText('unknown-node').length).toBeGreaterThan(0);
  });

  it('renders member name from clusterInfo', () => {
    render(
      <NodeDetailPanel
        nodeId="n1"
        status={makeStatus()}
        clusterInfo={makeClusterInfo()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('alpha')).toBeInTheDocument();
  });

  it('close button calls onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <NodeDetailPanel
        nodeId="n1"
        status={makeStatus()}
        clusterInfo={makeClusterInfo()}
        onClose={onClose}
      />,
    );
    // The close button has no accessible name (icon-only), so find by title-less button among siblings
    const buttons = screen.getAllByRole('button');
    // The last button is the X close button
    await user.click(buttons[buttons.length - 1]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows table entries from server.tables', () => {
    const status = makeStatus({
      servers: [
        {
          id: 'n1',
          name: 'alpha',
          status: 'ok',
          message: '',
          errors: [],
          tables: {
            orders: {
              logSize: 1024,
              dbSize: 2048,
              leader: 'n1',
              raftIndex: 10,
              raftTerm: 2,
              raftAppliedIndex: 10,
            },
          },
        },
      ],
    });
    render(
      <NodeDetailPanel
        nodeId="n1"
        status={status}
        clusterInfo={makeClusterInfo()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('orders')).toBeInTheDocument();
    expect(screen.getByText('LEADER')).toBeInTheDocument();
  });

  it('shows client URL from clusterInfo', () => {
    render(
      <NodeDetailPanel
        nodeId="n1"
        status={makeStatus()}
        clusterInfo={makeClusterInfo()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('http://localhost:2379')).toBeInTheDocument();
  });
});
