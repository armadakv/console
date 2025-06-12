import { clsx } from 'clsx';
import React, { ReactNode } from 'react';

interface TypographyProps {
  children: ReactNode;
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'subtitle1'
    | 'subtitle2'
    | 'body1'
    | 'body2'
    | 'caption';
  className?: string;
  component?: keyof React.JSX.IntrinsicElements;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body1',
  className,
  component,
}) => {
  const variantClasses = {
    h1: 'text-4xl font-bold text-gray-900 dark:text-gray-100',
    h2: 'text-3xl font-bold text-gray-900 dark:text-gray-100',
    h3: 'text-2xl font-bold text-gray-900 dark:text-gray-100',
    h4: 'text-xl font-bold text-gray-900 dark:text-gray-100',
    h5: 'text-lg font-semibold text-gray-900 dark:text-gray-100',
    h6: 'text-base font-semibold text-gray-900 dark:text-gray-100',
    subtitle1: 'text-base font-medium text-gray-700 dark:text-gray-300',
    subtitle2: 'text-sm font-medium text-gray-600 dark:text-gray-400',
    body1: 'text-base text-gray-900 dark:text-gray-100',
    body2: 'text-sm text-gray-700 dark:text-gray-300',
    caption: 'text-xs text-gray-500 dark:text-gray-400',
  };

  const defaultComponents = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    subtitle1: 'p',
    subtitle2: 'p',
    body1: 'p',
    body2: 'p',
    caption: 'span',
  };

  const Component = component || (defaultComponents[variant] as keyof React.JSX.IntrinsicElements);

  return <Component className={clsx(variantClasses[variant], className)}>{children}</Component>;
};
