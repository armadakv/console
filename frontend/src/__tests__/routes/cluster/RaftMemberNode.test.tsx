import { render, screen } from '@testing-library/react';
import React from 'react';

import RaftMemberNode from '../../../routes/cluster/components/RaftMemberNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

const makeProps = (overrides: Record<string, unknown> = {}) =>
  ({
    data: {
      label: 'node-1',
      nodeId: 'n1',
      status: 'ok',
      isCurrent: false,
      clientURL: 'http://localhost:2379',
      peerURL: 'http://localhost:2380',
      totalTables: 3,
      highestRaftTerm: 5,
      highestRaftIndex: 100,
      errors: [],
    },
    selected: false,
    ...overrides,
  }) as any;

describe('RaftMemberNode', () => {
  it('renders node label', () => {
    render(<RaftMemberNode {...makeProps()} />);
    expect(screen.getByText('node-1')).toBeInTheDocument();
  });

  it('shows "YOU" badge when isCurrent=true', () => {
    render(<RaftMemberNode {...makeProps({ data: { ...makeProps().data, isCurrent: true } })} />);
    expect(screen.getByText('YOU')).toBeInTheDocument();
  });

  it('does not show "YOU" badge when isCurrent=false', () => {
    render(<RaftMemberNode {...makeProps()} />);
    expect(screen.queryByText('YOU')).not.toBeInTheDocument();
  });

  it('shows error count when errors are non-empty', () => {
    render(
      <RaftMemberNode
        {...makeProps({ data: { ...makeProps().data, errors: ['err1', 'err2'] } })}
      />,
    );
    expect(screen.getByText(/2 errors/i)).toBeInTheDocument();
  });

  it('has border-blue-500 class when selected=true', () => {
    const { container } = render(<RaftMemberNode {...makeProps({ selected: true })} />);
    expect(container.firstChild).toHaveClass('border-blue-500');
  });

  it('does not have border-blue-500 class when selected=false', () => {
    const { container } = render(<RaftMemberNode {...makeProps({ selected: false })} />);
    expect(container.firstChild).not.toHaveClass('border-blue-500');
  });

  it('status dot has green class for status=ok', () => {
    const { container } = render(<RaftMemberNode {...makeProps()} />);
    const dot = container.querySelector('.bg-green-400');
    expect(dot).toBeInTheDocument();
  });

  it('status dot has red class for status=error', () => {
    const { container } = render(
      <RaftMemberNode {...makeProps({ data: { ...makeProps().data, status: 'error' } })} />,
    );
    const dot = container.querySelector('.bg-red-400');
    expect(dot).toBeInTheDocument();
  });

  it('status dot has amber class for unknown status', () => {
    const { container } = render(
      <RaftMemberNode {...makeProps({ data: { ...makeProps().data, status: 'degraded' } })} />,
    );
    const dot = container.querySelector('.bg-amber-400');
    expect(dot).toBeInTheDocument();
  });

  it('renders totalTables count', () => {
    render(<RaftMemberNode {...makeProps()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders term/index when highestRaftTerm > 0', () => {
    render(<RaftMemberNode {...makeProps()} />);
    expect(screen.getByText(/Term \/ Index/i)).toBeInTheDocument();
    expect(screen.getByText('5 / 100')).toBeInTheDocument();
  });

  it('does not render term/index when highestRaftTerm is 0', () => {
    render(
      <RaftMemberNode {...makeProps({ data: { ...makeProps().data, highestRaftTerm: 0 } })} />,
    );
    expect(screen.queryByText(/Term \/ Index/i)).not.toBeInTheDocument();
  });
});
