// Copyright JAMF Software, LLC

import { render, screen, fireEvent, act } from '@testing-library/react';

import { CopyButton } from '../../../components/shared/CopyButton';

vi.mock('lucide-react', () => ({
  Copy: () => <span data-testid="copy-icon" />,
  Check: () => <span data-testid="check-icon" />,
}));

const mockWriteText = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  mockWriteText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('CopyButton — icon variant (default)', () => {
  it('renders with default title', () => {
    render(<CopyButton text="hello" />);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Copy copy');
  });

  it('renders with custom label in title', () => {
    render(<CopyButton text="hello" label="Value" />);
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Copy value');
  });

  it('shows Copy icon initially', () => {
    render(<CopyButton text="hello" />);
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
  });

  it('writes text to clipboard on click', async () => {
    render(<CopyButton text="hello world" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(mockWriteText).toHaveBeenCalledWith('hello world');
  });

  it('shows Check icon and "Copied!" title after successful copy', async () => {
    render(<CopyButton text="hello" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('copy-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Copied!');
  });

  it('reverts to Copy icon after 2 seconds', async () => {
    render(<CopyButton text="hello" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
  });

  it('stays in copied state before 2 seconds have elapsed', async () => {
    render(<CopyButton text="hello" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    await act(async () => {
      vi.advanceTimersByTime(1999);
    });
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });
});

describe('CopyButton — button variant', () => {
  it('renders label text initially', () => {
    render(<CopyButton text="hello" variant="button" label="Copy Key" />);
    expect(screen.getByText('Copy Key')).toBeInTheDocument();
  });

  it('shows Copy icon initially', () => {
    render(<CopyButton text="hello" variant="button" label="Copy Key" />);
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
  });

  it('shows "Copied!" and Check icon after copy', async () => {
    render(<CopyButton text="hello" variant="button" label="Copy Key" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByText('Copied!')).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('reverts label after 2 seconds', async () => {
    render(<CopyButton text="hello" variant="button" label="Copy Key" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Copy Key')).toBeInTheDocument();
  });

  it('applies className to the button element', () => {
    render(<CopyButton text="x" variant="button" className="my-btn" />);
    expect(screen.getByRole('button')).toHaveClass('my-btn');
  });
});

describe('CopyButton — clipboard failure with fallback failure', () => {
  it('does not crash and stays un-copied when both clipboard and execCommand fail', async () => {
    mockWriteText.mockRejectedValue(new Error('denied'));
    // jsdom doesn't define execCommand; define it so we can make it throw
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn(() => {
        throw new Error('execCommand not supported');
      }),
      configurable: true,
      writable: true,
    });
    render(<CopyButton text="hello" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    // Both paths failed — stays in un-copied state
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
  });
});
