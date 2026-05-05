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
        className={`p-2 rounded-md border border-slate-600 text-slate-400 hover:text-slate-200 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
        className={`p-2 ml-2 rounded-md text-inherit hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
