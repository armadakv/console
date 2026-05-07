// Copyright JAMF Software, LLC

import { render, screen } from '@testing-library/react';

import { CardWithHeader } from '../../../components/shared/CardWithHeader';

describe('CardWithHeader', () => {
  it('renders the title text', () => {
    render(
      <CardWithHeader title="My Title">
        <p>content</p>
      </CardWithHeader>,
    );
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('renders children inside the card content', () => {
    render(
      <CardWithHeader title="T">
        <span>child content</span>
      </CardWithHeader>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(
      <CardWithHeader title="T" action={<button>Click me</button>}>
        <span>body</span>
      </CardWithHeader>,
    );
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('does not render action wrapper when action is omitted', () => {
    const { container } = render(
      <CardWithHeader title="T">
        <span>body</span>
      </CardWithHeader>,
    );
    // No extra div for action
    const header = container.querySelector('.flex.justify-between');
    expect(header?.children).toHaveLength(1);
  });

  it('applies className to the card root', () => {
    const { container } = render(
      <CardWithHeader title="T" className="custom-class">
        <span />
      </CardWithHeader>,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies contentClassName to card content', () => {
    const { container } = render(
      <CardWithHeader title="T" contentClassName="p-8">
        <span>x</span>
      </CardWithHeader>,
    );
    // CardContent renders a div with the given className
    expect(container.querySelector('.p-8')).toBeInTheDocument();
  });

  it('renders a ReactNode title', () => {
    render(
      <CardWithHeader title={<em data-testid="node-title">Fancy</em>}>
        <span />
      </CardWithHeader>,
    );
    expect(screen.getByTestId('node-title')).toBeInTheDocument();
  });
});
