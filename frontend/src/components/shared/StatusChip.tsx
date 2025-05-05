import { Chip, ChipProps } from '@mui/material';
import React from 'react';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'default';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  colorMapping?: Record<string, StatusType>;
  defaultColor?: StatusType;
}

/**
 * A component for displaying status indicators consistently across the application.
 * Maps status text to semantic colors based on provided mapping or defaults.
 */
const StatusChip: React.FC<StatusChipProps> = ({
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
  ...props
}) => {
  // Determine color based on status and color mapping
  const getStatusColor = (statusText: string): StatusType => {
    const normalizedStatus = statusText.toLowerCase();
    return (colorMapping[normalizedStatus] as StatusType) || defaultColor;
  };

  return <Chip label={status} color={getStatusColor(status)} size="small" {...props} />;
};

export default StatusChip;
