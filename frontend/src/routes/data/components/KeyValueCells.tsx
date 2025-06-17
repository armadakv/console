import React from 'react';

import { CodeHighlighter, useContentViewer, ViewModeButtons } from './shared';

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
  const {
    viewMode,
    setViewMode,
    contentValidation,
    contentTypeLabel,
    formattedContent,
    shouldUseSyntaxHighlighter,
  } = useContentViewer({ content, autoDetect: true });

  const renderContent = () => {
    const maxHeight = density === 'compact' ? 'max-h-48' : 'max-h-96';

    if (shouldUseSyntaxHighlighter) {
      return (
        <CodeHighlighter
          content={formattedContent}
          language={viewMode}
          density={density}
          showCopyButton={true}
          className="rounded-lg"
        />
      );
    }

    if (viewMode === 'binary' && contentValidation.isValidBase64) {
      return (
        <div
          className={`${maxHeight} overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg`}
        >
          <div className="p-3 bg-gray-50 dark:bg-gray-800">
            <pre
              className={`whitespace-pre font-mono text-gray-900 dark:text-gray-100 ${
                density === 'compact' ? 'text-xs' : 'text-sm'
              } leading-relaxed`}
            >
              {formattedContent}
            </pre>
          </div>
        </div>
      );
    }

    // Default to raw text view with syntax highlighting
    return (
      <CodeHighlighter
        content={content}
        language="text"
        density={density}
        showCopyButton={true}
        className="rounded-lg"
        customStyle={{
          fontWeight: isKey ? 'bold' : 'normal',
        }}
      />
    );
  };

  const spacingClass = density === 'compact' ? 'space-y-1' : 'space-y-2';

  return (
    <div className={`${spacingClass} space-y-3`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 min-h-[32px]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1">
          {/* Always show view mode buttons */}
          <ViewModeButtons
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            contentValidation={contentValidation}
          />
          {density === 'comfortable' && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate leading-6">
              {label} • {contentTypeLabel} • {content.length} chars
            </div>
          )}
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
        className={`align-top border-r border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 ${paddingClass}`}
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
