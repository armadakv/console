import { clsx } from 'clsx';
import React from 'react';

interface TabsProps {
  value: number;
  onChange: (newValue: number) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  value: number;
  className?: string;
}

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
  className?: string;
}

const TabsContext = React.createContext<{
  activeTab: number;
  onTabChange: (newValue: number) => void;
}>({
  activeTab: 0,
  onTabChange: () => {},
});

export const Tabs: React.FC<TabsProps> = ({ value, onChange, children, className }) => {
  const contextValue = {
    activeTab: value,
    onTabChange: onChange,
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={clsx('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
        className,
      )}
      role="tablist"
    >
      {children}
    </div>
  );
};

export const Tab: React.FC<TabProps> = ({ label, icon, value, className }) => {
  const { activeTab, onTabChange } = React.useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      className={clsx(
        'flex items-center space-x-2 px-4 py-3 font-medium text-sm transition-colors border-b-2',
        isActive
          ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700',
        className,
      )}
      onClick={() => onTabChange(value)}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      id={`tab-${value}`}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

export const TabPanel: React.FC<TabPanelProps> = ({ children, index, className }) => {
  const { activeTab } = React.useContext(TabsContext);
  const isActive = activeTab === index;

  if (!isActive) return null;

  return (
    <div
      className={clsx('p-6', className)}
      role="tabpanel"
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {children}
    </div>
  );
};
