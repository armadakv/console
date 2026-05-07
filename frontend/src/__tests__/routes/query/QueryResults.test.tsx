import { render, screen } from '@testing-library/react';
import React from 'react';

import QueryResults from '../../../routes/query/components/QueryResults';

vi.mock('../../../routes/query/components/OperationBadge', () => ({
  OperationBadge: ({ op }: any) => <span data-testid="op-badge">{op}</span>,
}));

vi.mock('../../../routes/query/components/ScanResultsTable', () => ({
  default: ({ pairs }: any) => <div data-testid="scan-table">{pairs?.length ?? 0} pairs</div>,
}));

vi.mock('@/shared', () => ({
  CodeHighlighter: ({ content }: any) => <pre data-testid="code-highlighter">{content}</pre>,
  useContentViewer: vi.fn().mockReturnValue({
    viewMode: 'text',
    setViewMode: vi.fn(),
    contentValidation: { isValidJson: false, isValidXml: false, isValidBase64: false },
    contentTypeLabel: 'Plain text',
    formattedContent: 'formatted',
    shouldUseSyntaxHighlighter: false,
  }),
  ViewModeButtons: () => <div data-testid="view-mode-buttons" />,
}));

vi.mock('@/shared/CopyButton', () => ({
  CopyButton: () => <button data-testid="copy-btn">Copy</button>,
}));

vi.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-icon" />,
  CheckCircle: () => <span data-testid="check-icon" />,
  Search: () => <span data-testid="search-icon" />,
  XCircle: () => <span data-testid="xcircle-icon" />,
}));

const makeResult = (overrides: any = {}): any => ({
  data: { key: 'foo', value: 'bar' },
  ...overrides,
  // entry must come after ...overrides so that the merged entry always has timestamp etc.
  entry: {
    id: '1',
    operation: 'GET',
    table: 'users',
    params: { key: 'foo' },
    status: 'success',
    duration: 2.5,
    timestamp: new Date('2024-01-01T12:00:00'),
    resultCount: 1,
    error: undefined,
    ...overrides.entry,
  },
});

describe('QueryResults', () => {
  it('shows empty state when result=null and not loading', () => {
    render(<QueryResults result={null} isLoading={false} />);
    expect(screen.getByText('Run a query to see results')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading=true', () => {
    render(<QueryResults result={null} isLoading={true} />);
    expect(screen.getByText('Executing query…')).toBeInTheDocument();
  });

  it('shows CheckCircle icon in StatusBar for success result', () => {
    render(<QueryResults result={makeResult()} isLoading={false} />);
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('shows XCircle icon in StatusBar for error result', () => {
    const result = makeResult({ entry: { status: 'error', error: 'boom' } });
    render(<QueryResults result={result} isLoading={false} />);
    expect(screen.getByTestId('xcircle-icon')).toBeInTheDocument();
  });

  it('shows GET result with key, CodeHighlighter, and copy button', () => {
    render(<QueryResults result={makeResult()} isLoading={false} />);
    expect(screen.getByText('foo')).toBeInTheDocument();
    expect(screen.getByTestId('code-highlighter')).toBeInTheDocument();
    expect(screen.getByTestId('copy-btn')).toBeInTheDocument();
  });

  it('shows ScanResultsTable for SCAN success result', () => {
    const result = makeResult({
      entry: { operation: 'SCAN', params: {}, resultCount: 2 },
      data: [
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
      ],
    });
    render(<QueryResults result={result} isLoading={false} />);
    expect(screen.getByTestId('scan-table')).toBeInTheDocument();
    expect(screen.getByTestId('scan-table')).toHaveTextContent('2 pairs');
  });

  it('shows "Key written successfully" for PUT success', () => {
    const result = makeResult({ entry: { operation: 'PUT', params: { key: 'mykey' } } });
    render(<QueryResults result={result} isLoading={false} />);
    expect(screen.getByText('Key written successfully')).toBeInTheDocument();
    expect(screen.getByText('"mykey"')).toBeInTheDocument();
  });

  it('shows "Key deleted successfully" for DELETE success', () => {
    const result = makeResult({ entry: { operation: 'DELETE', params: { key: 'mykey' } } });
    render(<QueryResults result={result} isLoading={false} />);
    expect(screen.getByText('Key deleted successfully')).toBeInTheDocument();
  });

  it('shows error display on error status', () => {
    const result = makeResult({ entry: { status: 'error', error: 'something went wrong' } });
    render(<QueryResults result={result} isLoading={false} />);
    expect(screen.getByText('Query failed')).toBeInTheDocument();
    expect(screen.getByText('something went wrong')).toBeInTheDocument();
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  it('shows OperationBadge with correct operation in StatusBar', () => {
    const result = makeResult({ entry: { operation: 'SCAN', params: {} } });
    render(<QueryResults result={result} isLoading={false} />);
    expect(screen.getByTestId('op-badge')).toHaveTextContent('SCAN');
  });

  it('shows singular "result" when resultCount=1', () => {
    render(<QueryResults result={makeResult({ entry: { resultCount: 1 } })} isLoading={false} />);
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('shows plural "results" when resultCount=2', () => {
    const result = makeResult({
      entry: { operation: 'SCAN', params: {}, resultCount: 2 },
      data: [
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
      ],
    });
    render(<QueryResults result={result} isLoading={false} />);
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('does not show resultCount section when resultCount is undefined', () => {
    const result = makeResult({ entry: { resultCount: undefined } });
    render(<QueryResults result={result} isLoading={false} />);
    expect(screen.queryByText(/\d+ results?$/)).not.toBeInTheDocument();
  });

  it('does not show result body while loading even if result is present', () => {
    const result = makeResult();
    render(<QueryResults result={result} isLoading={true} />);
    expect(screen.queryByTestId('op-badge')).not.toBeInTheDocument();
    expect(screen.getByText('Executing query…')).toBeInTheDocument();
  });
});

// ── LatencyBadge tests (via StatusBar) ───────────────────────────────────────

const renderWithDuration = (ms: number) =>
  render(<QueryResults result={makeResult({ entry: { duration: ms } })} isLoading={false} />);

describe('LatencyBadge', () => {
  it('shows 3-decimal format when <1ms', () => {
    renderWithDuration(0.456);
    expect(screen.getByText('0.456ms')).toBeInTheDocument();
  });

  it('shows 2-decimal format when 1-5ms', () => {
    renderWithDuration(2.5);
    expect(screen.getByText('2.50ms')).toBeInTheDocument();
  });

  it('shows 1-decimal format when 5-50ms', () => {
    renderWithDuration(12.3);
    expect(screen.getByText('12.3ms')).toBeInTheDocument();
  });

  it('shows rounded integer when ≥50ms', () => {
    renderWithDuration(73.7);
    expect(screen.getByText('74ms')).toBeInTheDocument();
  });
});
