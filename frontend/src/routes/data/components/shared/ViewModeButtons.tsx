import { Code, Type, FileText, Binary } from 'lucide-react';
import React from 'react';

import type { ContentType } from '../../../../utils/contentDetection';

import { Button } from '@/ui/Button';

interface ViewModeButtonsProps {
  viewMode: ContentType;
  onViewModeChange: (mode: ContentType) => void;
  contentValidation: {
    isValidJson: boolean;
    isValidXml: boolean;
    isValidBase64: boolean;
  };
  disabled?: boolean;
  className?: string;
}

export const ViewModeButtons: React.FC<ViewModeButtonsProps> = ({
  viewMode,
  onViewModeChange,
  contentValidation,
  disabled = false,
  className = '',
}) => {
  const { isValidJson, isValidXml, isValidBase64 } = contentValidation;

  return (
    <div
      className={`flex rounded border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 ${className}`}
    >
      <Button
        variant={viewMode === 'text' ? 'primary' : 'outline'}
        size="sm"
        type="button"
        onClick={() => onViewModeChange('text')}
        disabled={disabled}
        className="rounded-none border-0 border-r border-gray-200 dark:border-gray-700 px-2 py-1 h-6 text-xs"
      >
        <Type className="w-3 h-3 mr-1" />
        Raw
      </Button>
      <Button
        variant={viewMode === 'json' ? 'primary' : 'outline'}
        size="sm"
        type="button"
        onClick={() => onViewModeChange('json')}
        disabled={disabled || !isValidJson}
        className="rounded-none border-0 border-r border-gray-200 dark:border-gray-700 px-2 py-1 h-6 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Code className="w-3 h-3 mr-1" />
        JSON
      </Button>
      <Button
        variant={viewMode === 'xml' ? 'primary' : 'outline'}
        size="sm"
        type="button"
        onClick={() => onViewModeChange('xml')}
        disabled={disabled || !isValidXml}
        className="rounded-none border-0 border-r border-gray-200 dark:border-gray-700 px-2 py-1 h-6 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="w-3 h-3 mr-1" />
        XML
      </Button>
      <Button
        variant={viewMode === 'binary' ? 'primary' : 'outline'}
        size="sm"
        type="button"
        onClick={() => onViewModeChange('binary')}
        disabled={disabled || !isValidBase64}
        className="rounded-none border-0 px-2 py-1 h-6 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Binary className="w-3 h-3 mr-1" />
        Binary
      </Button>
    </div>
  );
};

export default ViewModeButtons;
