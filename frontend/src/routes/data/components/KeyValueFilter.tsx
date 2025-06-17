import React from 'react';

import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { Typography } from '@/ui/Typography';

interface KeyValueFilterProps {
  prefix: string;
  setPrefix: (prefix: string) => void;
  start: string;
  setStart: (start: string) => void;
  end: string;
  setEnd: (end: string) => void;
  filterMode: 'prefix' | 'range';
  onFilterModeChange: (mode: 'prefix' | 'range') => void;
  onFilter: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const KeyValueFilter: React.FC<KeyValueFilterProps> = ({
  prefix,
  setPrefix,
  start,
  setStart,
  end,
  setEnd,
  filterMode,
  onFilterModeChange,
  onFilter,
  disabled,
  isLoading,
}) => {
  const isDisabled = disabled || isLoading;
  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterModeChange(event.target.value as 'prefix' | 'range');
  };

  return (
    <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
      <Typography variant="h6" className="mb-4 text-gray-900 dark:text-gray-100">
        Filter Key-Value Pairs
      </Typography>

      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="filter-mode"
              value="prefix"
              checked={filterMode === 'prefix'}
              onChange={handleModeChange}
              disabled={isDisabled}
              className="mr-2 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Filter by Prefix</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="filter-mode"
              value="range"
              checked={filterMode === 'range'}
              onChange={handleModeChange}
              disabled={isDisabled}
              className="mr-2 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Filter by Range</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {filterMode === 'prefix' ? (
          <div className="md:col-span-10">
            <Input
              label="Key Prefix"
              value={prefix}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrefix(e.target.value)}
              placeholder="Enter key prefix to filter"
              disabled={isDisabled}
            />
          </div>
        ) : (
          <>
            <div className="md:col-span-5">
              <Input
                label="Start Key"
                value={start}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStart(e.target.value)}
                placeholder="Enter start key (inclusive)"
                disabled={isDisabled}
              />
            </div>
            <div className="md:col-span-5">
              <Input
                label="End Key"
                value={end}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)}
                placeholder="Enter end key (exclusive)"
                disabled={isDisabled}
              />
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <Button variant="primary" onClick={onFilter} disabled={isDisabled} className="w-full">
            {isLoading ? 'Applying...' : 'Apply Filter'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default KeyValueFilter;
