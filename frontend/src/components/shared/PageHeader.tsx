import React, { ReactNode } from 'react';

import { Typography } from '../ui';

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

/**
 * A consistent header component for page titles with optional action buttons
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, action, className = '' }) => {
  return (
    <div className={`flex justify-between items-center mb-6 ${className}`}>
      <Typography variant="h5" className="text-gray-900 dark:text-gray-100">
        {title}
      </Typography>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};
