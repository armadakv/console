import { render, screen } from '@testing-library/react';

import { Typography } from '../../../components/ui/Typography';

describe('Typography', () => {
  it('renders children', () => {
    render(<Typography>Hello world</Typography>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('defaults to body1 variant using a <p> tag', () => {
    render(<Typography>Body text</Typography>);
    const el = screen.getByText('Body text');
    expect(el.tagName).toBe('P');
    expect(el).toHaveClass('text-base', 'text-slate-100');
  });

  it.each([
    ['h1', 'H1', 'text-4xl', 'font-bold'],
    ['h2', 'H2', 'text-3xl', 'font-bold'],
    ['h3', 'H3', 'text-2xl', 'font-bold'],
    ['h4', 'H4', 'text-xl', 'font-bold'],
    ['h5', 'H5', 'text-lg', 'font-semibold'],
    ['h6', 'H6', 'text-base', 'font-semibold'],
  ] as const)('renders %s with correct tag and classes', (variant, tag, sizeClass, weightClass) => {
    render(<Typography variant={variant}>Heading</Typography>);
    const el = screen.getByText('Heading');
    expect(el.tagName).toBe(tag);
    expect(el).toHaveClass(sizeClass, weightClass, 'text-slate-100');
  });

  it.each([
    ['subtitle1', 'P', 'text-base', 'font-medium', 'text-slate-300'],
    ['subtitle2', 'P', 'text-sm', 'font-medium', 'text-slate-400'],
    ['body2', 'P', 'text-sm', 'text-slate-300'],
    ['caption', 'SPAN', 'text-xs', 'text-slate-400'],
  ] as const)('renders %s with correct tag and classes', (variant, tag, ...classes) => {
    render(<Typography variant={variant}>Text</Typography>);
    const el = screen.getByText('Text');
    expect(el.tagName).toBe(tag);
    expect(el).toHaveClass(...classes);
  });

  it('overrides element via component prop', () => {
    render(
      <Typography variant="body1" component="span">
        Span body
      </Typography>,
    );
    expect(screen.getByText('Span body').tagName).toBe('SPAN');
  });

  it('applies custom className', () => {
    render(<Typography className="custom-class">Styled</Typography>);
    expect(screen.getByText('Styled')).toHaveClass('custom-class');
  });
});
