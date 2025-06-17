import { Check, Copy } from 'lucide-react';
import React from 'react';

interface CopyButtonProps {
  text: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

/**
 * Copy to clipboard button component with feedback
 */
export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  variant = 'icon',
  size = 'sm',
  className = '',
  label = 'Copy',
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const iconSize = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3 w-3';

  if (variant === 'icon') {
    return (
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : `Copy ${label.toLowerCase()}`}
        className={`p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      >
        {copied ? (
          <Check className={`${iconSize} text-green-500`} />
        ) : (
          <Copy className={iconSize} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${className}`}
    >
      {copied ? (
        <>
          <Check className={`${iconSize} mr-1 text-green-500`} />
          Copied!
        </>
      ) : (
        <>
          <Copy className={`${iconSize} mr-1`} />
          {label}
        </>
      )}
    </button>
  );
};
