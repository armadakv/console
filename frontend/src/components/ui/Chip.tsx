import { clsx } from 'clsx';
import React, { ReactNode, ComponentProps } from 'react';

interface ChipProps extends ComponentProps<'span'> {
  children: ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variantClasses = {
    success: 'chip-success',
    error: 'chip-error',
    warning: 'chip-warning',
    info: 'chip-info',
    default: 'chip-default',
  };

  return (
    <span className={clsx(variantClasses[variant], className)} {...props}>
      {children}
    </span>
  );
};
