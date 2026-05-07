import { render, screen } from '@testing-library/react';

import { Card, CardContent, CardHeader } from '../../../components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass(
      'rounded-xl',
      'border',
      'border-slate-800',
      'bg-slate-900',
    );
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="my-card">Content</Card>);
    expect(container.firstChild).toHaveClass('my-card');
  });

  it('forwards extra div props', () => {
    render(<Card data-testid="my-card">Content</Card>);
    expect(screen.getByTestId('my-card')).toBeInTheDocument();
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header text</CardHeader>);
    expect(screen.getByText('Header text')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    expect(container.firstChild).toHaveClass(
      'px-5',
      'py-3.5',
      'border-b',
      'border-slate-800',
      'bg-slate-900',
      'rounded-t-xl',
    );
  });

  it('applies custom className', () => {
    const { container } = render(<CardHeader className="custom-header">Header</CardHeader>);
    expect(container.firstChild).toHaveClass('custom-header');
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Body content</CardContent>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<CardContent className="p-4">Body</CardContent>);
    expect(container.firstChild).toHaveClass('p-4');
  });
});
