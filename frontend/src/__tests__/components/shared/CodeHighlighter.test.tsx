// Copyright JAMF Software, LLC

import { render, screen, fireEvent } from '@testing-library/react';

import { CodeHighlighter } from '../../../components/shared/CodeHighlighter';

vi.mock('react-syntax-highlighter', () => ({
  PrismAsyncLight: Object.assign(
    ({ children, ...props }: any) => (
      <pre data-testid="syntax-highlighter" data-language={props.language}>
        {children}
      </pre>
    ),
    { registerLanguage: vi.fn() },
  ),
}));

vi.mock('react-syntax-highlighter/dist/esm/languages/prism/json', () => ({
  default: {},
}));

vi.mock('react-syntax-highlighter/dist/esm/languages/prism/markup', () => ({
  default: {},
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}));

describe('CodeHighlighter — readOnly (default)', () => {
  it('renders syntax highlighter with content', () => {
    render(<CodeHighlighter content='{"a":1}' language="json" />);
    expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument();
    expect(screen.getByTestId('syntax-highlighter')).toHaveTextContent('{"a":1}');
  });

  it('does not render a textarea when readOnly=true', () => {
    render(<CodeHighlighter content="hello" language="text" />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('passes language to the highlighter', () => {
    render(<CodeHighlighter content="<root/>" language="xml" />);
    expect(screen.getByTestId('syntax-highlighter')).toHaveAttribute('data-language', 'xml');
  });

  it('does not render CopyButton when showCopyButton=false (default)', () => {
    render(<CodeHighlighter content="hello" language="text" />);
    // CopyButton renders a button element; none should be present
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders CopyButton when showCopyButton=true', () => {
    render(<CodeHighlighter content="hello" language="text" showCopyButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies custom className to the container', () => {
    const { container } = render(
      <CodeHighlighter content="hello" language="text" className="custom-cls" />,
    );
    expect(container.firstChild).toHaveClass('custom-cls');
  });
});

describe('CodeHighlighter — editable (readOnly=false)', () => {
  it('renders a textarea for editing', () => {
    render(<CodeHighlighter content="edit me" language="text" readOnly={false} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('textarea value matches content prop', () => {
    render(<CodeHighlighter content="my value" language="json" readOnly={false} />);
    expect(screen.getByRole('textbox')).toHaveValue('my value');
  });

  it('calls onChange when textarea changes', () => {
    const onChange = vi.fn();
    render(<CodeHighlighter content="old" language="text" readOnly={false} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } });
    expect(onChange).toHaveBeenCalledWith('new');
  });

  it('renders with placeholder', () => {
    render(
      <CodeHighlighter content="" language="text" readOnly={false} placeholder="Enter value…" />,
    );
    expect(screen.getByPlaceholderText('Enter value…')).toBeInTheDocument();
  });

  it('textarea is disabled when disabled=true', () => {
    render(<CodeHighlighter content="x" language="text" readOnly={false} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('also renders background syntax highlighter in edit mode', () => {
    render(<CodeHighlighter content="hello" language="text" readOnly={false} />);
    // syntax highlighter still present for background highlight
    expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument();
  });

  it('renders CopyButton in edit mode when showCopyButton=true', () => {
    render(<CodeHighlighter content="hello" language="text" readOnly={false} showCopyButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('forwards id and name to textarea', () => {
    render(
      <CodeHighlighter content="x" language="text" readOnly={false} id="my-id" name="my-name" />,
    );
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('id', 'my-id');
    expect(textarea).toHaveAttribute('name', 'my-name');
  });
});
