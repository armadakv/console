// Copyright JAMF Software, LLC

import { render, screen } from '@testing-library/react';

import { LoadingState } from '../../../components/shared/LoadingState';

vi.mock('lucide-react', () => ({
  Loader: () => <span data-testid="icon-loader" />,
}));

describe('LoadingState', () => {
  it('renders default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingState message="Fetching data…" />);
    expect(screen.getByText('Fetching data…')).toBeInTheDocument();
  });

  it('renders the loader icon', () => {
    render(<LoadingState />);
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
  });

  it('applies numeric height as px style', () => {
    const { container } = render(<LoadingState height={500} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe('500px');
  });

  it('applies string height style', () => {
    const { container } = render(<LoadingState height="100vh" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe('100vh');
  });

  it('uses default height of 300px', () => {
    const { container } = render(<LoadingState />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe('300px');
  });
});
