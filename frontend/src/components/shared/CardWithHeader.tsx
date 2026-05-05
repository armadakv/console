import React, { ReactNode } from 'react';

import { Card, CardHeader, CardContent, Typography } from '../ui';

interface CardWithHeaderProps {
  title: string | React.ReactNode;
  children: ReactNode;
  action?: ReactNode;
  contentClassName?: string;
  className?: string;
}

export const CardWithHeader: React.FC<CardWithHeaderProps> = ({
  title,
  children,
  action,
  contentClassName = '',
  className = '',
}) => (
  <Card className={className}>
    <CardHeader className="flex justify-between items-center">
      <Typography variant="h6" className="text-slate-200 font-medium text-sm">
        {title}
      </Typography>
      {action && <div>{action}</div>}
    </CardHeader>
    <CardContent className={contentClassName}>{children}</CardContent>
  </Card>
);
