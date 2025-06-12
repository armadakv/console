import React, { ReactNode } from 'react';

import { Card, CardHeader, CardContent, Typography } from '../ui';

interface CardWithHeaderProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  contentClassName?: string;
  className?: string;
}

/**
 * A card with a styled header following the design language
 */
export const CardWithHeader: React.FC<CardWithHeaderProps> = ({
  title,
  children,
  action,
  contentClassName = '',
  className = '',
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex justify-between items-center">
        <Typography variant="h6" className="text-primary-700 dark:text-primary-300 font-medium">
          {title}
        </Typography>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
};
