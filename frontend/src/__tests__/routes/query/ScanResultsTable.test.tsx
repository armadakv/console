import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import ScanResultsTable from '../../../routes/query/components/ScanResultsTable';

vi.mock('@/shared', () => ({
  CodeHighlighter: ({ content }: any) => <pre data-testid="code">{content}</pre>,
  useContentViewer: vi.fn(),
  ViewModeButtons: () => <div data-testid="view-modes" />,
}));

vi.mock('@/shared/CopyButton', () => ({
  CopyButton: () => <button>Copy</button>,
}));

vi.mock('lucide-react', () => ({
  ChevronDown: () => <span />,
  ChevronRight: () => <span />,
}));

import { useContentViewer } from '@/shared';

const mockUseContentViewer = useContentViewer as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockUseContentViewer.mockReturnValue({
    viewMode: 'text',
    setViewMode: vi.fn(),
    contentValidation: { isValidJson: false, isValidXml: false, isValidBase64: false },
    contentTypeLabel: 'Text',
    formattedContent: 'hello',
    shouldUseSyntaxHighlighter: false,
  });
});

describe('ScanResultsTable', () => {
  it('renders empty state when pairs=[]', () => {
    render(<ScanResultsTable pairs={[]} />);
    expect(screen.getByText(/No keys found/i)).toBeInTheDocument();
  });

  it('renders empty state when pairs is undefined', () => {
    render(<ScanResultsTable />);
    expect(screen.getByText(/No keys found/i)).toBeInTheDocument();
  });

  it('renders a row per pair', () => {
    const pairs = [
      { key: 'foo', value: 'bar' },
      { key: 'baz', value: 'qux' },
    ];
    render(<ScanResultsTable pairs={pairs} />);
    expect(screen.getByText('foo')).toBeInTheDocument();
    expect(screen.getByText('baz')).toBeInTheDocument();
  });

  it('shows key text in row', () => {
    render(<ScanResultsTable pairs={[{ key: 'my-key', value: 'my-value' }]} />);
    expect(screen.getByText('my-key')).toBeInTheDocument();
  });

  it('clicking a row expands to show value via CodeHighlighter', async () => {
    const user = userEvent.setup();
    render(<ScanResultsTable pairs={[{ key: 'k1', value: 'expanded-value' }]} />);
    expect(screen.queryByTestId('code')).not.toBeInTheDocument();
    // Click the row (the <tr> element)
    await user.click(screen.getByText('k1'));
    expect(screen.getByTestId('code')).toBeInTheDocument();
  });

  it('collapses on second click', async () => {
    const user = userEvent.setup();
    render(<ScanResultsTable pairs={[{ key: 'k1', value: 'val' }]} />);
    await user.click(screen.getByText('k1'));
    expect(screen.getByTestId('code')).toBeInTheDocument();
    await user.click(screen.getByText('k1'));
    expect(screen.queryByTestId('code')).not.toBeInTheDocument();
  });

  it('shows pair count in header', () => {
    render(
      <ScanResultsTable
        pairs={[
          { key: 'a', value: '1' },
          { key: 'b', value: '2' },
        ]}
      />,
    );
    expect(screen.getByText(/2 keys/i)).toBeInTheDocument();
  });
});
