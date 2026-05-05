import { AlertCircle, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

interface ErrorStateProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  error?: Error | unknown;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  title = 'Something went wrong',
  onRetry,
  error,
  className = '',
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const errorMessage =
    message || (error instanceof Error ? error.message : 'An unexpected error occurred');

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await Promise.resolve(onRetry());
    } finally {
      setTimeout(() => setIsRetrying(false), 1500);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-24 text-center ${className}`}>
      <div className="mb-4 rounded-full bg-red-500/10 p-4">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="mb-1 text-base font-semibold text-slate-100">{title}</h2>
      <p className="mb-6 max-w-sm text-sm text-slate-400">{errorMessage}</p>
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying…' : 'Try again'}
        </button>
      )}
    </div>
  );
};
