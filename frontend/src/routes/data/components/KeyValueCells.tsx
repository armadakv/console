import { Code, Type } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { CopyButton } from '@/shared/CopyButton';
import { Button } from '@/ui/Button';
import { Typography } from '@/ui/Typography';

interface ContentRendererProps {
  content: string;
  label: string;
  density: 'compact' | 'comfortable';
  isKey?: boolean;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({
  content,
  label,
  density,
  isKey = false,
}) => {
  const [viewMode, setViewMode] = useState<'raw' | 'json'>('raw');

  const isValidJson = useCallback(() => {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }, [content]);

  const renderContent = () => {
    const maxHeight = density === 'compact' ? 'max-h-48' : 'max-h-96';

    if (viewMode === 'json' && isValidJson()) {
      try {
        const formattedJson = JSON.stringify(JSON.parse(content), null, 2);
        return (
          <div
            className={`${maxHeight} overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg`}
          >
            <SyntaxHighlighter
              language="json"
              style={vs}
              customStyle={{
                margin: 0,
                borderRadius: 8,
                fontFamily: '"Roboto Mono", "Courier New", monospace',
                fontSize: density === 'compact' ? '12px' : '13px',
                lineHeight: '1.4',
                background: '#fafafa',
              }}
            >
              {formattedJson}
            </SyntaxHighlighter>
          </div>
        );
      } catch {
        return (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <Typography className="text-red-600 dark:text-red-400 text-sm">
              Invalid JSON format
            </Typography>
          </div>
        );
      }
    }

    return (
      <div
        className={`${maxHeight} overflow-auto p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors`}
      >
        <pre
          className={`whitespace-pre-wrap break-words m-0 font-mono ${
            density === 'compact' ? 'text-xs' : 'text-sm'
          } leading-relaxed ${isKey ? 'font-semibold' : ''}`}
        >
          {content}
        </pre>
      </div>
    );
  };

  const spacingClass = density === 'compact' ? 'space-y-1' : 'space-y-2';

  return (
    <div className={`${spacingClass} space-y-3`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 min-h-[32px]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1">
          {isValidJson() && (
            <div className="flex rounded border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
              <Button
                variant={viewMode === 'raw' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('raw')}
                className="rounded-none border-0 border-r border-gray-200 dark:border-gray-700 px-2 py-1 h-6 text-xs"
              >
                <Type className="w-3 h-3 mr-1" />
                Raw
              </Button>
              <Button
                variant={viewMode === 'json' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('json')}
                className="rounded-none border-0 px-2 py-1 h-6 text-xs"
              >
                <Code className="w-3 h-3 mr-1" />
                JSON
              </Button>
            </div>
          )}
          {density === 'comfortable' && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate leading-6">
              {label} • {isValidJson() ? 'JSON' : 'Text'} • {content.length} chars
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <CopyButton
            text={
              viewMode === 'json' && isValidJson()
                ? JSON.stringify(JSON.parse(content), null, 2)
                : content
            }
            variant="icon"
            label={label.toLowerCase()}
          />
        </div>
      </div>
      <div className="w-full overflow-hidden">{renderContent()}</div>
    </div>
  );
};

interface TableRowProps {
  keyName: string;
  value: string;
  density?: 'compact' | 'comfortable';
}

const KeyValueCells: React.FC<TableRowProps> = ({ keyName, value, density = 'comfortable' }) => {
  const paddingClass = density === 'compact' ? 'p-2' : 'p-4';

  return (
    <>
      <td
        className={`align-top border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${paddingClass}`}
      >
        <ContentRenderer content={keyName} label="Key" density={density} isKey={true} />
      </td>
      <td className={`bg-white dark:bg-gray-900 ${paddingClass}`}>
        <ContentRenderer content={value} label="Value" density={density} />
      </td>
    </>
  );
};

export default KeyValueCells;
