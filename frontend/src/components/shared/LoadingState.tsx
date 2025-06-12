import { Loader } from 'lucide-react';
import React from 'react';

interface LoadingStateProps {
  message?: string;
  height?: number | string;
}

/**
 * A consistent loading state component with spinner and optional message
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  height = 300,
}) => {
  return (
    <div
      className="flex justify-center items-center"
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <Loader className="h-6 w-6 animate-spin mr-2 text-primary-600" />
      {message && <span className="text-base text-gray-900 dark:text-gray-100">{message}</span>}
    </div>
  );
};
