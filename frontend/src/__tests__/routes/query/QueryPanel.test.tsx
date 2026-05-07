import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import QueryPanel from '../../../routes/query/components/QueryPanel';

vi.mock('@/hooks/useApi', () => ({
  useTables: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Play: () => <span />,
  Clock: () => <span />,
  ChevronDown: () => <span />,
  ChevronUp: () => <span />,
}));

vi.mock('../../../routes/query/components/OperationBadge', () => ({
  OperationBadge: ({ op }: { op: string }) => <span>{op}</span>,
  OPERATION_META: {
    GET: { active: 'bg-blue-500', inactive: '' },
    SCAN: { active: 'bg-violet-600', inactive: '' },
    PUT: { active: 'bg-green-500', inactive: '' },
    DELETE: { active: 'bg-red-500', inactive: '' },
  },
}));

import { useTables } from '@/hooks/useApi';

const mockUseTables = useTables as ReturnType<typeof vi.fn>;

const defaultProps = {
  table: '',
  onTableChange: vi.fn(),
  operation: 'GET' as const,
  onOperationChange: vi.fn(),
  queryKey: '',
  onKeyChange: vi.fn(),
  scanMode: 'prefix' as const,
  onScanModeChange: vi.fn(),
  prefix: '',
  onPrefixChange: vi.fn(),
  rangeStart: '',
  onRangeStartChange: vi.fn(),
  rangeEnd: '',
  onRangeEndChange: vi.fn(),
  putValue: '',
  onPutValueChange: vi.fn(),
  isLoading: false,
  onExecute: vi.fn(),
  history: [],
  onLoadFromHistory: vi.fn(),
};

beforeEach(() => {
  mockUseTables.mockReturnValue({
    data: [{ id: '1', name: 'users' }],
    isLoading: false,
  });
  vi.clearAllMocks();
});

const executeButton = () => screen.getByRole('button', { name: /Execute/i });

describe('QueryPanel', () => {
  it('execute button is disabled when no table selected', () => {
    render(<QueryPanel {...defaultProps} table="" queryKey="" />);
    expect(executeButton()).toBeDisabled();
  });

  it('shows "Select a table" hint when no table', () => {
    render(<QueryPanel {...defaultProps} table="" />);
    expect(screen.getByText(/Select a table to enable execution/i)).toBeInTheDocument();
  });

  it('execute button is disabled for GET with empty key', () => {
    render(<QueryPanel {...defaultProps} table="users" operation="GET" queryKey="" />);
    expect(executeButton()).toBeDisabled();
  });

  it('shows "Enter a key" hint for GET with empty key', () => {
    render(<QueryPanel {...defaultProps} table="users" operation="GET" queryKey="" />);
    expect(screen.getByText(/Enter a key to execute/i)).toBeInTheDocument();
  });

  it('execute button is enabled for GET with key', () => {
    render(<QueryPanel {...defaultProps} table="users" operation="GET" queryKey="foo" />);
    expect(executeButton()).not.toBeDisabled();
  });

  it('execute button is enabled for SCAN with no key', () => {
    render(<QueryPanel {...defaultProps} table="users" operation="SCAN" queryKey="" />);
    expect(executeButton()).not.toBeDisabled();
  });

  it('execute button is disabled for PUT with empty key', () => {
    render(<QueryPanel {...defaultProps} table="users" operation="PUT" queryKey="" />);
    expect(executeButton()).toBeDisabled();
  });

  it('execute button is disabled for DELETE with empty key', () => {
    render(<QueryPanel {...defaultProps} table="users" operation="DELETE" queryKey="" />);
    expect(executeButton()).toBeDisabled();
  });

  it('calls onExecute when execute button clicked with valid state', async () => {
    const onExecute = vi.fn();
    const user = userEvent.setup();
    render(
      <QueryPanel
        {...defaultProps}
        table="users"
        operation="GET"
        queryKey="foo"
        onExecute={onExecute}
      />,
    );
    await user.click(executeButton());
    expect(onExecute).toHaveBeenCalledOnce();
  });

  it('does not call onExecute on Ctrl+Enter when canExecute is false', () => {
    const onExecute = vi.fn();
    const { container } = render(
      <QueryPanel {...defaultProps} table="" queryKey="" onExecute={onExecute} />,
    );
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Enter', ctrlKey: true });
    expect(onExecute).not.toHaveBeenCalled();
  });

  it('calls onExecute on Ctrl+Enter when canExecute is true', () => {
    const onExecute = vi.fn();
    const { container } = render(
      <QueryPanel
        {...defaultProps}
        table="users"
        operation="GET"
        queryKey="foo"
        onExecute={onExecute}
      />,
    );
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Enter', ctrlKey: true });
    expect(onExecute).toHaveBeenCalledOnce();
  });
});
