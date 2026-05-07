import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import TableManagement from '../../../routes/settings/components/TableManagement';

vi.mock('@/context/NavigationContext', () => ({
  useNavigation: () => ({ setPageAction: vi.fn(), resetPageAction: vi.fn() }),
}));

vi.mock('@/hooks/useApi', () => ({
  useTables: vi.fn(),
  useCreateTable: vi.fn(),
  useDeleteTable: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Database: () => <span />,
  Plus: () => <span />,
  Trash2: () => <span />,
  X: () => <span />,
  RefreshCw: () => <span />,
  Loader2: () => <span />,
}));

vi.mock('@/shared/RefreshButton', () => ({
  RefreshButton: () => <button>Refresh</button>,
}));

vi.mock('@/shared/LoadingState', () => ({
  LoadingState: () => <div data-testid="loading-state">Loading…</div>,
}));

vi.mock('@/shared/ErrorState', () => ({
  ErrorState: ({ title }: { title?: string }) => (
    <div data-testid="error-state">{title ?? 'Error'}</div>
  ),
}));

vi.mock('@/shared/ConfirmDialog', () => ({
  ConfirmDialog: ({
    open,
    onConfirm,
    onCancel,
    title,
  }: {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
  }) =>
    open ? (
      <div data-testid="confirm-dialog">
        <span>{title}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

import { useCreateTable, useDeleteTable, useTables } from '@/hooks/useApi';

const mockUseTables = useTables as ReturnType<typeof vi.fn>;
const mockUseCreateTable = useCreateTable as ReturnType<typeof vi.fn>;
const mockUseDeleteTable = useDeleteTable as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockUseTables.mockReturnValue({
    data: [],
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: vi.fn(),
  });
  mockUseCreateTable.mockReturnValue({ mutateAsync: vi.fn(), isPending: false, error: null });
  mockUseDeleteTable.mockReturnValue({ mutateAsync: vi.fn(), isPending: false, error: null });
});

describe('TableManagement', () => {
  it('shows loading state when isLoading=true', () => {
    mockUseTables.mockReturnValue({
      data: [],
      isLoading: true,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<TableManagement />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('shows error state when error is set', () => {
    mockUseTables.mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
      error: new Error('fetch failed'),
      refetch: vi.fn(),
    });
    render(<TableManagement />);
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
  });

  it('shows empty state message when tables=[]', () => {
    render(<TableManagement />);
    expect(screen.getByText(/No tables found/i)).toBeInTheDocument();
  });

  it('shows table rows when tables have data', () => {
    mockUseTables.mockReturnValue({
      data: [{ id: 'tbl-1', name: 'users' }],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<TableManagement />);
    expect(screen.getByText('users')).toBeInTheDocument();
    expect(screen.getByText('tbl-1')).toBeInTheDocument();
  });

  it('"New Table" button toggles create form visibility', async () => {
    const user = userEvent.setup();
    render(<TableManagement />);
    expect(screen.queryByPlaceholderText(/Enter table name/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /New Table/i }));
    expect(screen.getByPlaceholderText(/Enter table name/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByPlaceholderText(/Enter table name/i)).not.toBeInTheDocument();
  });

  it('create form submit button is disabled when name is empty', async () => {
    const user = userEvent.setup();
    render(<TableManagement />);
    await user.click(screen.getByRole('button', { name: /New Table/i }));
    expect(screen.getByRole('button', { name: /Create/i })).toBeDisabled();
  });

  it('create form submit calls mutateAsync with table name', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseCreateTable.mockReturnValue({ mutateAsync, isPending: false, error: null });
    const user = userEvent.setup();
    render(<TableManagement />);
    await user.click(screen.getByRole('button', { name: /New Table/i }));
    await user.type(screen.getByPlaceholderText(/Enter table name/i), 'orders');
    await user.click(screen.getByRole('button', { name: /Create/i }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('orders'));
  });

  it('delete button click shows ConfirmDialog', async () => {
    mockUseTables.mockReturnValue({
      data: [{ id: '1', name: 'users' }],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<TableManagement />);
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    await user.click(screen.getByTitle('Delete table'));
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('confirm delete calls deleteTableMutation.mutateAsync', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUseDeleteTable.mockReturnValue({ mutateAsync, isPending: false, error: null });
    mockUseTables.mockReturnValue({
      data: [{ id: '1', name: 'users' }],
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();
    render(<TableManagement />);
    await user.click(screen.getByTitle('Delete table'));
    await user.click(screen.getByRole('button', { name: /Confirm/i }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('users'));
  });
});
