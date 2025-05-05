import React, { ReactNode } from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorStateProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  error?: Error | unknown;
  sx?: object;
  action?: ReactNode;
}

/**
 * A consistent error state component with optional retry action
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  title = 'Error',
  onRetry,
  error,
  sx = {},
  action,
}) => {
  // Format error message from error object or use provided message
  const errorMessage =
    message || (error instanceof Error ? error.message : 'An unexpected error occurred');

  return (
    <Alert
      severity="error"
      variant="outlined"
      sx={{ mb: 3, ...sx }}
      action={
        action ||
        (onRetry && (
          <Button color="inherit" size="small" onClick={onRetry} startIcon={<RefreshIcon />}>
            Retry
          </Button>
        ))
      }
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      {errorMessage}
    </Alert>
  );
};

export default ErrorState;
