// Copyright JAMF Software, LLC

import { render, screen } from '@testing-library/react';
import React from 'react';

import { SuccessState } from '../../../components/shared/SuccessState';

vi.mock('@/ui', () => ({
  Alert: ({
    children,
    variant,
    action,
  }: {
    children: React.ReactNode;
    variant: string;
    action?: React.ReactNode;
  }) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
      {action}
    </div>
  ),
}));

describe('SuccessState', () => {
  it('renders default title and message', () => {
    render(<SuccessState />);
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully!')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<SuccessState message="Table created." />);
    expect(screen.getByText('Table created.')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<SuccessState title="Done!" />);
    expect(screen.getByText('Done!')).toBeInTheDocument();
  });

  it('passes variant="success" to Alert', () => {
    render(<SuccessState />);
    expect(screen.getByTestId('alert')).toHaveAttribute('data-variant', 'success');
  });

  it('renders an action when provided', () => {
    render(<SuccessState action={<button>View</button>} />);
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
  });
});
