import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Home: () => <span data-testid="home-icon" />,
  ChevronRight: () => <span data-testid="chevron-icon" />,
}));

import { Breadcrumb } from '../../../components/shared/Breadcrumb';

describe('Breadcrumb', () => {
  it('renders a nav element with accessible label', () => {
    render(<Breadcrumb items={[]} />);
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('always renders the home link pointing to "/"', () => {
    render(<Breadcrumb items={[]} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('renders the home icon', () => {
    render(<Breadcrumb items={[]} />);
    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
  });

  it('renders a chevron separator for each item', () => {
    render(<Breadcrumb items={[{ label: 'Settings' }, { label: 'Tables' }]} />);
    expect(screen.getAllByTestId('chevron-icon')).toHaveLength(2);
  });

  it('renders item without href as a span', () => {
    render(<Breadcrumb items={[{ label: 'Cluster' }]} />);
    expect(screen.getByText('Cluster').tagName).toBe('SPAN');
  });

  it('renders item with href as a link', () => {
    render(<Breadcrumb items={[{ label: 'Nodes', href: '/nodes' }]} />);
    const link = screen.getByRole('link', { name: /Nodes/i });
    expect(link).toHaveAttribute('href', '/nodes');
  });

  it('renders item with href and current=true as a span, not a link', () => {
    render(<Breadcrumb items={[{ label: 'Settings', href: '/settings', current: true }]} />);
    const el = screen.getByText('Settings');
    expect(el.tagName).toBe('SPAN');
  });

  it('applies font-medium class to current item', () => {
    render(<Breadcrumb items={[{ label: 'Active Page', current: true }]} />);
    const el = screen.getByText('Active Page');
    expect(el.className).toMatch(/font-medium/);
  });

  it('does not apply font-medium to non-current item', () => {
    render(<Breadcrumb items={[{ label: 'Other Page', current: false }]} />);
    const el = screen.getByText('Other Page');
    expect(el.className).not.toMatch(/font-medium/);
  });

  it('renders multiple items in order', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Nodes', href: '/nodes' },
          { label: 'node-1', current: true },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: /Nodes/i })).toBeInTheDocument();
    expect(screen.getByText('node-1')).toBeInTheDocument();
  });

  it('accepts additional className prop', () => {
    render(<Breadcrumb items={[]} className="extra-class" />);
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav.className).toMatch(/extra-class/);
  });
});
