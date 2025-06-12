import { RotateCcw } from 'lucide-react';
import React from 'react';

import { Button } from '../ui';

interface RefreshButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'icon' | 'button' | 'header';
  tooltipTitle?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * A standardized refresh button component that can be displayed as an icon button or regular button
 */
export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  disabled = false,
  variant = 'icon',
  tooltipTitle = 'Refresh',
  label = 'Refresh',
  size = 'sm',
  className,
}) => {
  // For the icon-only variant
  if (variant === 'icon') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        title={tooltipTitle}
        className={`p-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <RotateCcw className={`${size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />
      </button>
    );
  }

  // For the header variant (used in the navbar)
  if (variant === 'header') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        title={tooltipTitle}
        className={`p-2 ml-2 rounded-md text-inherit hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    );
  }

  // For the button variant
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      <RotateCcw className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
};
