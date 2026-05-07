import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

import { NavigationProvider, useNavigation } from '../../context/NavigationContext';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';

import type { BreadcrumbItem } from '@/shared/Breadcrumb';

const BreadcrumbSetter = ({ items }: { items: BreadcrumbItem[] }) => {
  useBreadcrumbs(items);
  return null;
};

const BreadcrumbReader = () => {
  const { breadcrumbs } = useNavigation();
  return <span data-testid="count">{breadcrumbs.length}</span>;
};

describe('useBreadcrumbs', () => {
  it('calls setBreadcrumbs with provided items on mount', () => {
    render(
      <NavigationProvider>
        <BreadcrumbSetter items={[{ label: 'Test', current: true }]} />
        <BreadcrumbReader />
      </NavigationProvider>,
    );
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });

  it('clears breadcrumbs on unmount', async () => {
    const user = userEvent.setup();

    const Parent = () => {
      const [show, setShow] = useState(true);
      return (
        <NavigationProvider>
          {show && <BreadcrumbSetter items={[{ label: 'Test', current: true }]} />}
          <BreadcrumbReader />
          <button onClick={() => setShow(false)}>unmount</button>
        </NavigationProvider>
      );
    };

    render(<Parent />);
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    await user.click(screen.getByText('unmount'));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
