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
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'form-input',
          error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>}
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
        <label htmlFor={textareaId} className="form-label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={clsx(
          'form-input',
          error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>}
    </div>
  );
};
