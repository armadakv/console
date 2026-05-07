// Copyright JAMF Software, LLC

import { render, screen, fireEvent, act } from '@testing-library/react';

import { RefreshButton } from '../../../components/shared/RefreshButton';

vi.mock('lucide-react', () => ({
  RotateCw: ({ className }: { className?: string }) => (
    <span data-testid="icon-rotate-cw" className={className} />
  ),
}));

vi.mock('@/ui', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RefreshButton — icon variant (default)', () => {
  it('renders an enabled button when not refreshing', () => {
    render(<RefreshButton onClick={() => {}} />);
    const btn = screen.getByRole('button');
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute('title', 'Refresh');
  });

  it('is disabled while refreshing', () => {
    render(<RefreshButton onClick={() => {}} isRefreshing />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('icon has animate-spin class while refreshing', () => {
    render(<RefreshButton onClick={() => {}} isRefreshing />);
    expect(screen.getByTestId('icon-rotate-cw').className).toContain('animate-spin');
  });

  it('icon does not have animate-spin when not refreshing', () => {
    render(<RefreshButton onClick={() => {}} isRefreshing={false} />);
    expect(screen.getByTestId('icon-rotate-cw').className).not.toContain('animate-spin');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<RefreshButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('RefreshButton — button variant', () => {
  it('shows label when not refreshing', () => {
    render(<RefreshButton onClick={() => {}} variant="button" label="Reload" />);
    expect(screen.getByText('Reload')).toBeInTheDocument();
  });

  it('shows Refreshing… text while spinner is visible', () => {
    render(<RefreshButton onClick={() => {}} variant="button" isRefreshing />);
    expect(screen.getByText('Refreshing…')).toBeInTheDocument();
  });

  it('is disabled while spinner is visible', () => {
    render(<RefreshButton onClick={() => {}} variant="button" isRefreshing />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('RefreshButton — header variant', () => {
  it('shows label when not refreshing', () => {
    render(<RefreshButton onClick={() => {}} variant="header" label="Sync" />);
    expect(screen.getByText('Sync')).toBeInTheDocument();
  });

  it('shows Refreshing… while spinner is visible', () => {
    render(<RefreshButton onClick={() => {}} variant="header" isRefreshing />);
    expect(screen.getByText('Refreshing…')).toBeInTheDocument();
  });

  it('shows "· just now" after refresh completes and MIN_VISIBLE_MS elapses', async () => {
    const { rerender } = render(
      <RefreshButton onClick={() => {}} variant="header" isRefreshing={true} />,
    );

    rerender(<RefreshButton onClick={() => {}} variant="header" isRefreshing={false} />);

    await act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByText(/·\s*just now/)).toBeInTheDocument();
  });

  it('does not show last-refreshed time before any refresh', () => {
    render(<RefreshButton onClick={() => {}} variant="header" />);
    expect(screen.queryByText(/just now/)).not.toBeInTheDocument();
  });
});
