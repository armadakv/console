import React, { ReactNode } from 'react';

import { Typography } from '../../../components/ui';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  icon?: ReactNode;
}

/**
 * A reusable card component for displaying summary metrics on the dashboard
 */
const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  color = 'primary',
  icon,
}) => {
  // Define color mappings based on the color prop
  const colorClasses = {
    primary:
      'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-700',
    success:
      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700',
    warning:
      'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    error:
      'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
  };

  return (
    <div
      className={`p-6 text-center rounded-lg h-full flex flex-col justify-between border ${colorClasses[color]}`}
    >
      <Typography variant="h6" className="mb-2">
        {title}
      </Typography>

      <div className="flex-1 flex items-center justify-center flex-col">
        <div className="flex items-center gap-2">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <Typography variant="h2" className="font-medium">
            {value}
          </Typography>
        </div>
      </div>

      {subtitle && (
        <Typography variant="body2" className="mt-2 opacity-80">
          {subtitle}
        </Typography>
      )}
    </div>
  );
};

export default SummaryCard;
