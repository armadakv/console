import React from 'react';
import { IconButton, Tooltip, Button, ButtonProps, TooltipProps } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface RefreshButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'icon' | 'button';
  tooltipTitle?: string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  buttonProps?: Omit<ButtonProps, 'onClick' | 'disabled' | 'size'>;
  tooltipProps?: Omit<TooltipProps, 'title' | 'children'>;
}

/**
 * A standardized refresh button component that can be displayed as an icon button or regular button
 */
const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  disabled = false,
  variant = 'icon',
  tooltipTitle = 'Refresh',
  label = 'Refresh',
  size = 'small',
  buttonProps,
  tooltipProps
}) => {
  // For the icon-only variant
  if (variant === 'icon') {
    return (
      <Tooltip title={tooltipTitle} {...tooltipProps}>
        <span>
          <IconButton
            onClick={onClick}
            disabled={disabled}
            color="primary"
            size={size}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              ...buttonProps?.sx
            }}
          >
            <RefreshIcon fontSize={size === 'large' ? 'medium' : 'small'} />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  // For the button variant
  return (
    <Button
      variant="outlined"
      startIcon={<RefreshIcon />}
      onClick={onClick}
      disabled={disabled}
      size={size}
      {...buttonProps}
    >
      {label}
    </Button>
  );
};

export default RefreshButton;