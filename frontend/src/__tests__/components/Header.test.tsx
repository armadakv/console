import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import Header from '../../components/Header';
import { NavigationProvider, useNavigation } from '../../context/NavigationContext';

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
  Menu: () => <span data-testid="menu-icon" />,
  Home: () => <span />,
  ChevronRight: () => <span />,
  LayoutDashboard: () => <span />,
  Settings: () => <span />,
  Server: () => <span />,
  Search: () => <span />,
}));

const SetAction = ({ action }: { action: React.ReactNode }) => {
  const { setPageAction } = useNavigation();
  React.useEffect(() => {
    setPageAction(action);
  }, []);
  return null;
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationProvider>{children}</NavigationProvider>
);

describe('Header — desktop (width >= 768)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
  });

  it('renders a header element', () => {
    render(<Header onDrawerToggle={vi.fn()} />, { wrapper });
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('does not show mobile menu button on desktop', () => {
    render(<Header onDrawerToggle={vi.fn()} />, { wrapper });
    expect(screen.queryByRole('button', { name: /open drawer/i })).not.toBeInTheDocument();
  });

  it('renders breadcrumb nav on desktop', () => {
    render(<Header onDrawerToggle={vi.fn()} />, { wrapper });
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('does not show "Armada Console" title text on desktop', () => {
    render(<Header onDrawerToggle={vi.fn()} />, { wrapper });
    expect(screen.queryByText('Armada Console')).not.toBeInTheDocument();
  });
});

describe('Header — mobile (width < 768)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
  });

  it('renders mobile menu button', () => {
    render(<Header onDrawerToggle={vi.fn()} />, { wrapper });
    expect(screen.getByRole('button', { name: /open drawer/i })).toBeInTheDocument();
  });

  it('calls onDrawerToggle when menu button is clicked', async () => {
    const onDrawerToggle = vi.fn();
    const user = userEvent.setup();
    render(<Header onDrawerToggle={onDrawerToggle} />, { wrapper });
    await user.click(screen.getByRole('button', { name: /open drawer/i }));
    expect(onDrawerToggle).toHaveBeenCalledOnce();
  });

  it('shows "Armada Console" title text on mobile', () => {
    render(<Header onDrawerToggle={vi.fn()} />, { wrapper });
    expect(screen.getByText('Armada Console')).toBeInTheDocument();
  });

  it('does not render breadcrumb nav on mobile', () => {
    render(<Header onDrawerToggle={vi.fn()} />, { wrapper });
    expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).not.toBeInTheDocument();
  });
});

describe('Header — pageAction slot', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
  });

  it('renders pageAction content when set via NavigationProvider', () => {
    render(
      <NavigationProvider>
        <SetAction action={<button>My Action</button>} />
        <Header onDrawerToggle={vi.fn()} />
      </NavigationProvider>,
    );

    expect(screen.getByRole('button', { name: /My Action/i })).toBeInTheDocument();
  });
});
