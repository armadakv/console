import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

vi.mock('lucide-react', () => ({
  Menu: () => <span />,
  Home: () => <span />,
  ChevronRight: () => <span />,
  LayoutDashboard: () => <span data-testid="icon-dashboard" />,
  Settings: () => <span data-testid="icon-settings" />,
  Server: () => <span data-testid="icon-server" />,
  Search: () => <span data-testid="icon-search" />,
}));

const mockNavigate = vi.fn();
let mockPathname = '/';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: mockPathname }),
  useNavigate: () => mockNavigate,
}));

import Sidebar from '../../components/Sidebar';

beforeEach(() => {
  mockNavigate.mockClear();
  mockPathname = '/';
});

describe('Sidebar — rendering', () => {
  it('renders all four nav items', () => {
    render(<Sidebar />);
    expect(screen.getByRole('button', { name: /Cluster/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nodes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Query/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();
  });

  it('renders the Armada Console brand name', () => {
    render(<Sidebar />);
    expect(screen.getByText('Armada Console')).toBeInTheDocument();
  });

  it('renders the nav element', () => {
    render(<Sidebar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});

describe('Sidebar — active state', () => {
  it('applies active classes to Cluster when pathname is "/"', () => {
    mockPathname = '/';
    render(<Sidebar />);
    const clusterBtn = screen.getByRole('button', { name: /Cluster/i });
    expect(clusterBtn.className).toMatch(/text-blue-400/);
  });

  it('does not apply active classes to Nodes when pathname is "/"', () => {
    mockPathname = '/';
    render(<Sidebar />);
    const nodesBtn = screen.getByRole('button', { name: /Nodes/i });
    expect(nodesBtn.className).not.toMatch(/text-blue-400/);
  });

  it('applies active classes to Nodes when pathname is "/nodes"', () => {
    mockPathname = '/nodes';
    render(<Sidebar />);
    const nodesBtn = screen.getByRole('button', { name: /Nodes/i });
    expect(nodesBtn.className).toMatch(/text-blue-400/);
  });

  it('applies active classes to Query when pathname starts with "/query"', () => {
    mockPathname = '/query/something';
    render(<Sidebar />);
    const queryBtn = screen.getByRole('button', { name: /Query/i });
    expect(queryBtn.className).toMatch(/text-blue-400/);
  });

  it('applies active classes to Settings when pathname is "/settings"', () => {
    mockPathname = '/settings';
    render(<Sidebar />);
    const settingsBtn = screen.getByRole('button', { name: /Settings/i });
    expect(settingsBtn.className).toMatch(/text-blue-400/);
  });
});

describe('Sidebar — navigation', () => {
  it('calls navigate with "/" when Cluster is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole('button', { name: /Cluster/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('calls navigate with "/nodes" when Nodes is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole('button', { name: /Nodes/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/nodes' });
  });

  it('calls navigate with "/query" when Query is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole('button', { name: /Query/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/query' });
  });

  it('calls navigate with "/settings" when Settings is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await user.click(screen.getByRole('button', { name: /Settings/i }));
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/settings' });
  });

  it('calls onClose when a nav item is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /Cluster/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not throw when onClose is not provided', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    await expect(user.click(screen.getByRole('button', { name: /Nodes/i }))).resolves.not.toThrow();
  });
});
