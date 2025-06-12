import { clsx } from 'clsx';
import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ children, variant = 'info', className, action }) => {
  const variantClasses = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info',
  };

  return (
    <div className={clsx(variantClasses[variant], className)}>
      <div className="flex-1">{children}</div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
};
