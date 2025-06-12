import { RotateCcw } from 'lucide-react';
import React, { ReactNode } from 'react';

import { Alert, Button } from '../ui';

interface ErrorStateProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  error?: Error | unknown;
  className?: string;
  action?: ReactNode;
}

/**
 * A consistent error state component with optional retry action
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  title = 'Error',
  onRetry,
  error,
  className = '',
  action,
}) => {
  // Format error message from error object or use provided message
  const errorMessage =
    message || (error instanceof Error ? error.message : 'An unexpected error occurred');

  return (
    <Alert
      variant="error"
      className={`mb-6 ${className}`}
      action={
        action ||
        (onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-red-600 hover:text-red-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        ))
      }
    >
      {title && <div className="font-semibold mb-1">{title}</div>}
      {errorMessage}
    </Alert>
  );
};
