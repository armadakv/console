// Copyright JAMF Software, LLC

import { render, screen, fireEvent } from '@testing-library/react';

import { ConfirmDialog } from '../../../components/shared/ConfirmDialog';

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="icon-alert" />,
}));

vi.mock('@/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

const baseProps = {
  open: true,
  title: 'Delete item',
  message: 'Are you sure you want to delete this item?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ConfirmDialog', () => {
  it('renders nothing when open=false', () => {
    const { container } = render(<ConfirmDialog {...baseProps} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title and message when open=true', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByText('Delete item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('renders default Confirm and Cancel labels', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders custom confirm and cancel labels', () => {
    render(<ConfirmDialog {...baseProps} confirmLabel="Delete" cancelLabel="Go back" />);
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Go back')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...baseProps} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(baseProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmDialog {...baseProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(baseProps.onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when backdrop is clicked', () => {
    render(<ConfirmDialog {...baseProps} />);
    // The backdrop is the absolute overlay div (first child of the dialog container)
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.querySelector('.absolute.inset-0');
    fireEvent.click(backdrop!);
    expect(baseProps.onCancel).toHaveBeenCalledOnce();
  });

  it('has accessible dialog role and label', () => {
    render(<ConfirmDialog {...baseProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
  });
});
