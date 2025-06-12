import { clsx } from 'clsx';
import React, { ReactNode, ComponentProps } from 'react';

interface CardProps extends ComponentProps<'div'> {
  children: ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={clsx('card', className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return <div className={clsx('card-header', className)}>{children}</div>;
};

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return <div className={clsx('card-content', className)}>{children}</div>;
};
