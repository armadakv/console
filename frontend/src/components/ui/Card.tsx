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

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => (
  <div className={clsx('rounded-xl border border-slate-800 bg-slate-900', className)} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div
    className={clsx('px-5 py-3.5 border-b border-slate-800 bg-slate-900 rounded-t-xl', className)}
  >
    {children}
  </div>
);

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={clsx('', className)}>{children}</div>
);
