import { AlertTriangle, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

import { Typography } from '@/ui/Typography';

interface ErrorAccordionProps {
  errors: string[];
}

/**
 * Component for displaying errors in an expandable accordion
 */
const ErrorAccordion: React.FC<ErrorAccordionProps> = ({ errors }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
      >
        <div className="flex items-center">
          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
          <Typography variant="body2" className="font-medium text-red-600 dark:text-red-400">
            {errors.length} {errors.length === 1 ? 'Error' : 'Errors'} Detected
          </Typography>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-red-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div
                key={index}
                className={`py-2 ${
                  index < errors.length - 1 ? 'border-b border-red-200 dark:border-red-800' : ''
                }`}
              >
                <Typography variant="body2" className="text-red-600 dark:text-red-400">
                  {error}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorAccordion;
