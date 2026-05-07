// Copyright JAMF Software, LLC

import { render, screen } from '@testing-library/react';

import { PageHeader } from '../../../components/shared/PageHeader';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Cluster Overview" />);
    expect(screen.getByText('Cluster Overview')).toBeInTheDocument();
  });

  it('renders title as an h5 element', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByRole('heading', { level: 5, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(<PageHeader title="T" action={<button>New</button>} />);
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
  });

  it('does not render action wrapper when action is omitted', () => {
    const { container } = render(<PageHeader title="T" />);
    // The flex wrapper for actions should not exist
    expect(container.querySelector('.flex.items-center.gap-2')).not.toBeInTheDocument();
  });

  it('applies className to the root element', () => {
    const { container } = render(<PageHeader title="T" className="extra-class" />);
    expect(container.firstChild).toHaveClass('extra-class');
  });

  it('includes default layout classes on root', () => {
    const { container } = render(<PageHeader title="T" />);
    expect(container.firstChild).toHaveClass('flex', 'justify-between', 'items-center', 'mb-6');
  });
});
