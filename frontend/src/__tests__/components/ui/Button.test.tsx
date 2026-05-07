import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from '../../../components/ui/Button';

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('forwards onClick handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders startIcon when provided', () => {
    render(<Button startIcon={<span data-testid="start-icon" />}>Click me</Button>);
    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
  });

  it('renders endIcon when provided', () => {
    render(<Button endIcon={<span data-testid="end-icon" />}>Click me</Button>);
    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="my-custom-class">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('my-custom-class');
  });

  it('default variant is primary (contains bg-blue-600)', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
  });

  it("size 'sm' applies smaller padding class (contains px-3)", () => {
    render(<Button size="sm">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3');
  });

  it("size 'lg' applies larger padding class (contains px-6)", () => {
    render(<Button size="lg">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6');
  });
});
