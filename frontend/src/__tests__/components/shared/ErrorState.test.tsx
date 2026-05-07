// Copyright JAMF Software, LLC

import { render, screen, fireEvent } from '@testing-library/react';

import { ErrorState } from '../../../components/shared/ErrorState';

vi.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="icon-alert-circle" />,
  RotateCcw: () => <span data-testid="icon-rotate" />,
}));

describe('ErrorState', () => {
  it('renders default title when none provided', () => {
    render(<ErrorState />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<ErrorState title="Load failed" />);
    expect(screen.getByText('Load failed')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<ErrorState message="Network error" />);
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders error.message from an Error instance', () => {
    render(<ErrorState error={new Error('Connection refused')} />);
    expect(screen.getByText('Connection refused')).toBeInTheDocument();
  });

  it('renders fallback message when error is not an Error instance', () => {
    render(<ErrorState error="some string error" />);
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders the alert icon', () => {
    render(<ErrorState />);
    expect(screen.getByTestId('icon-alert-circle')).toBeInTheDocument();
  });
});
