import { clsx } from 'clsx';
import React, { ReactNode, ComponentProps } from 'react';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  startIcon,
  endIcon,
  className,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-blue-600 hover:bg-blue-500 text-white border-transparent shadow-sm focus:ring-blue-500',
    secondary:
      'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-700 focus:ring-slate-500',
    success: 'bg-green-600 hover:bg-green-500 text-white border-transparent focus:ring-green-500',
    error: 'bg-red-600 hover:bg-red-500 text-white border-transparent focus:ring-red-500',
    warning:
      'bg-orange-600 hover:bg-orange-500 text-white border-transparent focus:ring-orange-500',
    outline:
      'bg-transparent hover:bg-slate-800 text-slate-300 border-slate-700 focus:ring-slate-500',
    ghost:
      'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-transparent focus:ring-slate-500',
  };

  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {startIcon && <span className="mr-2">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-2">{endIcon}</span>}
    </button>
  );
};
