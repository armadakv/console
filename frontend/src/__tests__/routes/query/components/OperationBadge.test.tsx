import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('../../../../routes/query/QueryPage', () => ({}));

import { OPERATION_META, OperationBadge } from '../../../../routes/query/components/OperationBadge';

describe('OperationBadge — text rendering', () => {
  it.each(['GET', 'SCAN', 'PUT', 'DELETE'] as const)('renders "%s" text', (op) => {
    render(<OperationBadge op={op} />);
    expect(screen.getByText(op)).toBeInTheDocument();
  });
});

describe('OperationBadge — badge classes', () => {
  it.each(['GET', 'SCAN', 'PUT', 'DELETE'] as const)(
    'applies badge background class for %s',
    (op) => {
      render(<OperationBadge op={op} />);
      const el = screen.getByText(op);
      expect(el.className).toMatch(new RegExp(OPERATION_META[op].badge.replace(/\//g, '\\/')));
    },
  );

  it.each(['GET', 'SCAN', 'PUT', 'DELETE'] as const)(
    'applies badge text color class for %s',
    (op) => {
      render(<OperationBadge op={op} />);
      const el = screen.getByText(op);
      expect(el.className).toMatch(new RegExp(OPERATION_META[op].badgeText));
    },
  );
});

describe('OperationBadge — size variants', () => {
  it('applies sm size classes by default', () => {
    render(<OperationBadge op="GET" />);
    const el = screen.getByText('GET');
    expect(el.className).toMatch(/px-1\.5/);
    expect(el.className).toMatch(/text-xs/);
  });

  it('applies xs size classes when size="xs"', () => {
    render(<OperationBadge op="GET" size="xs" />);
    const el = screen.getByText('GET');
    expect(el.className).toMatch(/px-1/);
    expect(el.className).toMatch(/text-\[10px\]/);
  });

  it('applies sm size classes when size="sm" is explicit', () => {
    render(<OperationBadge op="PUT" size="sm" />);
    const el = screen.getByText('PUT');
    expect(el.className).toMatch(/px-1\.5/);
  });
});

describe('OperationBadge — element structure', () => {
  it('renders as an inline span', () => {
    render(<OperationBadge op="DELETE" />);
    expect(screen.getByText('DELETE').tagName).toBe('SPAN');
  });

  it('includes font-bold and font-mono classes', () => {
    render(<OperationBadge op="SCAN" />);
    const el = screen.getByText('SCAN');
    expect(el.className).toMatch(/font-bold/);
    expect(el.className).toMatch(/font-mono/);
  });
});

describe('OPERATION_META', () => {
  it('has entries for all four operations', () => {
    expect(Object.keys(OPERATION_META)).toEqual(['GET', 'SCAN', 'PUT', 'DELETE']);
  });

  it.each(['GET', 'SCAN', 'PUT', 'DELETE'] as const)('%s meta has required keys', (op) => {
    const meta = OPERATION_META[op];
    expect(meta).toHaveProperty('active');
    expect(meta).toHaveProperty('inactive');
    expect(meta).toHaveProperty('badge');
    expect(meta).toHaveProperty('badgeText');
    expect(meta).toHaveProperty('dot');
  });
});
