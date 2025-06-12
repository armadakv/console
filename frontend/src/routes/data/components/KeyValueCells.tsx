import { Code, Type } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Button } from '@/ui/Button';
import { Typography } from '@/ui/Typography';

interface TableRowProps {
  keyName: string;
  value: string;
}

const KeyValueCells: React.FC<TableRowProps> = ({ keyName, value }) => {
  const [viewMode, setViewMode] = useState<'raw' | 'json'>('raw');

  const isValidJson = useCallback(() => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, [value]);

  const renderValue = () => {
    if (viewMode === 'json' && isValidJson()) {
      try {
        const formattedJson = JSON.stringify(JSON.parse(value), null, 2);
        return (
          <div className="max-h-72 overflow-auto">
            <SyntaxHighlighter
              language="json"
              style={vs}
              customStyle={{
                margin: 0,
                borderRadius: 4,
                fontFamily: '"Roboto Mono", "Courier New", monospace',
              }}
            >
              {formattedJson}
            </SyntaxHighlighter>
          </div>
        );
      } catch {
        return <Typography className="text-red-500">Invalid JSON</Typography>;
      }
    }

    return (
      <div className="max-h-72 overflow-auto p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
        <pre className="whitespace-pre-wrap break-words m-0 font-mono text-sm">{value}</pre>
      </div>
    );
  };

  return (
    <>
      <td className="align-top w-1/3 px-4 py-2">
        <div className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded max-w-full overflow-hidden">
          <div className="font-medium font-mono text-sm break-words">{keyName}</div>
        </div>
      </td>
      <td className="px-4 py-2">
        {isValidJson() && (
          <div className="mb-2">
            <div className="flex rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Button
                variant={viewMode === 'raw' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('raw')}
                className="rounded-none border-0 border-r border-gray-200 dark:border-gray-700"
              >
                <Type className="w-4 h-4 mr-1" />
                Raw
              </Button>
              <Button
                variant={viewMode === 'json' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('json')}
                className="rounded-none border-0"
              >
                <Code className="w-4 h-4 mr-1" />
                JSON
              </Button>
            </div>
          </div>
        )}
        {renderValue()}
      </td>
    </>
  );
};

export default KeyValueCells;
