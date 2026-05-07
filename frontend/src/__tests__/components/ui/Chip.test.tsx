import { render, screen } from '@testing-library/react';

import { Chip } from '../../../components/ui/Chip';

describe('Chip', () => {
  it('renders children', () => {
    render(<Chip>Active</Chip>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('defaults to default variant', () => {
    render(<Chip>Default</Chip>);
    expect(screen.getByText('Default')).toHaveClass('chip-default');
  });

  it('applies success variant class', () => {
    render(<Chip variant="success">OK</Chip>);
    expect(screen.getByText('OK')).toHaveClass('chip-success');
  });

  it('applies error variant class', () => {
    render(<Chip variant="error">Failed</Chip>);
    expect(screen.getByText('Failed')).toHaveClass('chip-error');
  });

  it('applies warning variant class', () => {
    render(<Chip variant="warning">Warn</Chip>);
    expect(screen.getByText('Warn')).toHaveClass('chip-warning');
  });

  it('applies info variant class', () => {
    render(<Chip variant="info">Info</Chip>);
    expect(screen.getByText('Info')).toHaveClass('chip-info');
  });

  it('applies custom className', () => {
    render(<Chip className="extra-class">Label</Chip>);
    expect(screen.getByText('Label')).toHaveClass('extra-class');
  });

  it('renders as a span element', () => {
    render(<Chip>Span chip</Chip>);
    expect(screen.getByText('Span chip').tagName).toBe('SPAN');
  });

  it('forwards extra span props', () => {
    render(<Chip data-testid="my-chip">Chip</Chip>);
    expect(screen.getByTestId('my-chip')).toBeInTheDocument();
  });
});
