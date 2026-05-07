// Copyright JAMF Software, LLC

import { render, screen } from '@testing-library/react';
import React from 'react';

import { StatusChip } from '../../../components/shared/StatusChip';

vi.mock('@/ui', () => ({
  Chip: ({ children, variant }: { children: React.ReactNode; variant: string }) => (
    <span data-testid="chip" data-variant={variant}>
      {children}
    </span>
  ),
}));

describe('StatusChip', () => {
  it('renders the status text', () => {
    render(<StatusChip status="ok" />);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('maps "ok" to variant="success"', () => {
    render(<StatusChip status="ok" />);
    expect(screen.getByTestId('chip')).toHaveAttribute('data-variant', 'success');
  });

  it('maps "error" to variant="error"', () => {
    render(<StatusChip status="error" />);
    expect(screen.getByTestId('chip')).toHaveAttribute('data-variant', 'error');
  });

  it('maps "warning" to variant="warning"', () => {
    render(<StatusChip status="warning" />);
    expect(screen.getByTestId('chip')).toHaveAttribute('data-variant', 'warning');
  });

  it('maps "unknown" to variant="default"', () => {
    render(<StatusChip status="unknown" />);
    expect(screen.getByTestId('chip')).toHaveAttribute('data-variant', 'default');
  });

  it('is case-insensitive: "OK" → variant="success"', () => {
    render(<StatusChip status="OK" />);
    expect(screen.getByTestId('chip')).toHaveAttribute('data-variant', 'success');
  });

  it('falls back to defaultColor for unknown status', () => {
    render(<StatusChip status="purple" />);
    expect(screen.getByTestId('chip')).toHaveAttribute('data-variant', 'default');
  });

  it('uses custom colorMapping to override defaults', () => {
    render(<StatusChip status="ok" colorMapping={{ ok: 'warning' }} />);
    expect(screen.getByTestId('chip')).toHaveAttribute('data-variant', 'warning');
  });

  it('uses custom defaultColor when status is not mapped', () => {
    render(<StatusChip status="noop" defaultColor="info" />);
    expect(screen.getByTestId('chip')).toHaveAttribute('data-variant', 'info');
  });
});
