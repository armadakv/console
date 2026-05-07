import { render, screen } from '@testing-library/react';
import React from 'react';

import Footer from '../../components/Footer';

describe('Footer', () => {
  it('renders a footer element', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('displays the current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('renders the Armada Project link with correct href', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /Armada Project/i });
    expect(link).toHaveAttribute('href', 'https://github.com/armadakv/armada');
  });

  it('Armada Project link opens in new tab with noopener noreferrer', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /Armada Project/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders copyright text', () => {
    render(<Footer />);
    expect(screen.getByText(/Armada Console/i)).toBeInTheDocument();
  });
});
