import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

import { Tab, TabList, TabPanel, Tabs } from '../../../components/ui/Tabs';

function ControlledTabs({ initialTab = 0 }: { initialTab?: number }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <Tabs value={tab} onChange={setTab}>
      <TabList>
        <Tab label="First" value={0} />
        <Tab label="Second" value={1} />
        <Tab label="Third" value={2} />
      </TabList>
      <TabPanel value={tab} index={0}>
        Panel One
      </TabPanel>
      <TabPanel value={tab} index={1}>
        Panel Two
      </TabPanel>
      <TabPanel value={tab} index={2}>
        Panel Three
      </TabPanel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('renders the tab list', () => {
    render(<ControlledTabs />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders all tab buttons', () => {
    render(<ControlledTabs />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('shows the first panel by default', () => {
    render(<ControlledTabs />);
    expect(screen.getByText('Panel One')).toBeInTheDocument();
    expect(screen.queryByText('Panel Two')).toBeNull();
  });

  it('switches panel on tab click', async () => {
    const user = userEvent.setup();
    render(<ControlledTabs />);
    await user.click(screen.getByRole('tab', { name: 'Second' }));
    expect(screen.getByText('Panel Two')).toBeInTheDocument();
    expect(screen.queryByText('Panel One')).toBeNull();
  });

  it('calls onChange with correct tab index', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Tabs value={0} onChange={onChange}>
        <TabList>
          <Tab label="A" value={0} />
          <Tab label="B" value={1} />
        </TabList>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('marks active tab with aria-selected=true', () => {
    render(<ControlledTabs initialTab={1} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('active tab has blue styling class', () => {
    render(<ControlledTabs initialTab={0} />);
    expect(screen.getAllByRole('tab')[0]).toHaveClass('border-blue-500');
  });

  it('inactive tabs have transparent border', () => {
    render(<ControlledTabs initialTab={0} />);
    expect(screen.getAllByRole('tab')[1]).toHaveClass('border-transparent');
  });

  it('renders tab icon when provided', () => {
    render(
      <Tabs value={0} onChange={() => {}}>
        <TabList>
          <Tab label="With Icon" value={0} icon={<span data-testid="tab-icon" />} />
        </TabList>
      </Tabs>,
    );
    expect(screen.getByTestId('tab-icon')).toBeInTheDocument();
  });

  it('applies custom className to Tabs wrapper', () => {
    const { container } = render(
      <Tabs value={0} onChange={() => {}} className="my-tabs">
        <TabList>
          <Tab label="X" value={0} />
        </TabList>
      </Tabs>,
    );
    expect(container.firstChild).toHaveClass('my-tabs');
  });

  it('panel has correct aria attributes', () => {
    render(<ControlledTabs />);
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('id', 'tabpanel-0');
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-0');
  });

  it('tab has correct aria-controls attribute', () => {
    render(<ControlledTabs />);
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-controls', 'tabpanel-0');
  });
});
