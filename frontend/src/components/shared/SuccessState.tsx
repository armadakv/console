import React, { ReactNode } from 'react';

import { Alert } from '../ui';

interface SuccessStateProps {
  message?: string;
  title?: string;
  className?: string;
  action?: ReactNode;
}

/**
 * A consistent success state component with optional action
 */
export const SuccessState: React.FC<SuccessStateProps> = ({
  message = 'Operation completed successfully!',
  title = 'Success',
  className = '',
  action,
}) => {
  return (
    <Alert variant="success" className={`mb-6 ${className}`} action={action}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      {message}
    </Alert>
  );
};
