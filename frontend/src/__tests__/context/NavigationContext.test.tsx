import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { NavigationProvider, useNavigation } from '../../context/NavigationContext';

const TestConsumer = () => {
  const { breadcrumbs, pageAction, setBreadcrumbs, setPageAction, resetPageAction } =
    useNavigation();
  return (
    <div>
      <span data-testid="crumb-count">{breadcrumbs.length}</span>
      <span data-testid="page-action">{pageAction ? 'has-action' : 'no-action'}</span>
      <button onClick={() => setBreadcrumbs([{ label: 'Home', current: false }])}>
        set crumbs
      </button>
      <button onClick={() => setPageAction(<span>action</span>)}>set action</button>
      <button onClick={() => resetPageAction()}>reset action</button>
    </div>
  );
};

describe('useNavigation', () => {
  it('throws when used outside NavigationProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useNavigation must be used within a NavigationProvider',
    );
    spy.mockRestore();
  });

  it('has initial breadcrumbs [] and pageAction null', () => {
    render(
      <NavigationProvider>
        <TestConsumer />
      </NavigationProvider>,
    );
    expect(screen.getByTestId('crumb-count')).toHaveTextContent('0');
    expect(screen.getByTestId('page-action')).toHaveTextContent('no-action');
  });

  it('setBreadcrumbs updates breadcrumbs', async () => {
    const user = userEvent.setup();
    render(
      <NavigationProvider>
        <TestConsumer />
      </NavigationProvider>,
    );
    await user.click(screen.getByText('set crumbs'));
    expect(screen.getByTestId('crumb-count')).toHaveTextContent('1');
  });

  it('setPageAction updates pageAction', async () => {
    const user = userEvent.setup();
    render(
      <NavigationProvider>
        <TestConsumer />
      </NavigationProvider>,
    );
    await user.click(screen.getByText('set action'));
    expect(screen.getByTestId('page-action')).toHaveTextContent('has-action');
  });

  it('resetPageAction sets pageAction back to null', async () => {
    const user = userEvent.setup();
    render(
      <NavigationProvider>
        <TestConsumer />
      </NavigationProvider>,
    );
    await user.click(screen.getByText('set action'));
    expect(screen.getByTestId('page-action')).toHaveTextContent('has-action');
    await user.click(screen.getByText('reset action'));
    expect(screen.getByTestId('page-action')).toHaveTextContent('no-action');
  });
});
