import React from 'react';

import { Chip } from '../ui';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'default';

interface StatusChipProps {
  status: string;
  colorMapping?: Record<string, StatusType>;
  defaultColor?: StatusType;
  className?: string;
}

/**
 * A component for displaying status indicators consistently across the application.
 * Maps status text to semantic colors based on provided mapping or defaults.
 */
export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  colorMapping = {
    ok: 'success',
    success: 'success',
    active: 'success',
    online: 'success',
    error: 'error',
    failed: 'error',
    warning: 'warning',
    pending: 'warning',
    info: 'info',
    inactive: 'default',
    unknown: 'default',
  },
  defaultColor = 'default',
  className,
}) => {
  // Determine color based on status and color mapping
  const getStatusColor = (statusText: string): StatusType => {
    const normalizedStatus = statusText.toLowerCase();
    return (colorMapping[normalizedStatus] as StatusType) || defaultColor;
  };

  return (
    <Chip variant={getStatusColor(status)} className={className}>
      {status}
    </Chip>
  );
};
