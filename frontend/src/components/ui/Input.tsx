import { clsx } from 'clsx';
import React, { ComponentProps } from 'react';

interface InputProps extends ComponentProps<'input'> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}
interface TextareaProps extends ComponentProps<'textarea'> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const inputCls = (error?: string, className?: string) =>
  clsx(
    'block w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
    error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700',
    className,
  );

const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide';
const errorCls = 'mt-1 text-xs text-red-400';

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = false,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className={clsx(fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={inputId} className={labelCls}>
          {label}
        </label>
      )}
      <input id={inputId} className={inputCls(error, className)} {...props} />
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
};

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  fullWidth = false,
  className,
  id,
  ...props
}) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className={clsx(fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={textareaId} className={labelCls}>
          {label}
        </label>
      )}
      <textarea id={textareaId} className={inputCls(error, className)} {...props} />
      {error && <p className={errorCls}>{error}</p>}
    </div>
  );
};
