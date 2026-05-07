import { render, screen } from '@testing-library/react';

import { Alert } from '../../../components/ui/Alert';

describe('Alert', () => {
  it('renders children', () => {
    render(<Alert>Something went wrong</Alert>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('defaults to info variant', () => {
    const { container } = render(<Alert>Info message</Alert>);
    expect(container.firstChild).toHaveClass('alert-info');
  });

  it('applies success variant class', () => {
    const { container } = render(<Alert variant="success">OK</Alert>);
    expect(container.firstChild).toHaveClass('alert-success');
  });

  it('applies error variant class', () => {
    const { container } = render(<Alert variant="error">Error</Alert>);
    expect(container.firstChild).toHaveClass('alert-error');
  });

  it('applies warning variant class', () => {
    const { container } = render(<Alert variant="warning">Warning</Alert>);
    expect(container.firstChild).toHaveClass('alert-warning');
  });

  it('applies custom className', () => {
    const { container } = render(<Alert className="my-class">Info</Alert>);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('renders action when provided', () => {
    render(<Alert action={<button>Dismiss</button>}>Message</Alert>);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('does not render action wrapper when action is not provided', () => {
    const { container } = render(<Alert>No action</Alert>);
    expect(container.querySelector('.ml-4')).toBeNull();
  });
});
