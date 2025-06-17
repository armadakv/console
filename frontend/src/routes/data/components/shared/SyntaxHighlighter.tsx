import React from 'react';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
// Import languages asynchronously
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { CopyButton } from '../../../../components/shared/CopyButton';
import type { ContentType } from '../../../../utils/contentDetection';

import { useTheme } from '@/theme/ThemeProvider';

// Register languages
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('xml', markup);
SyntaxHighlighter.registerLanguage('markup', markup);
SyntaxHighlighter.registerLanguage('text', markup);
SyntaxHighlighter.registerLanguage('binary', markup);

interface CodeHighlighterProps {
  content: string;
  language: ContentType;
  density?: 'compact' | 'comfortable';
  showCopyButton?: boolean;
  showLineNumbers?: boolean;
  customStyle?: React.CSSProperties;
  className?: string;
  rows?: number;
  // Editing props
  readOnly?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export const CodeHighlighter: React.FC<CodeHighlighterProps> = ({
  content,
  language,
  density = 'comfortable',
  showCopyButton = false,
  showLineNumbers,
  customStyle = {},
  className = '',
  rows,
  readOnly = true,
  onChange,
  placeholder,
  disabled = false,
  id,
  name,
}) => {
  const { isDark } = useTheme();

  const defaultStyle = {
    margin: 0,
    borderRadius: 8,
    fontFamily: '"Roboto Mono", "Courier New", monospace',
    fontSize: density === 'compact' ? '12px' : '14px',
    lineHeight: '1.4',
    background: isDark ? '#1f2937' : '#fafafa',
    color: isDark ? '#f3f4f6' : '#374151',
    ...(rows && { minHeight: `${rows * 1.4 * (density === 'compact' ? 12 : 14) + 24}px` }),
    ...customStyle,
  };

  const syntaxLanguage = language === 'xml' ? 'xml' : language;

  const handleTextareaChange = (e: any) => {
    if (onChange && !readOnly && !disabled) {
      onChange(e.target.value);
    }
  };

  // Common SyntaxHighlighter props
  const syntaxHighlighterProps = {
    language: syntaxLanguage,
    style: isDark ? vscDarkPlus : vs,
    showLineNumbers: showLineNumbers ?? content.split('\n').length > 10,
    wrapLines: true,
    wrapLongLines: true,
    children: content,
  };

  // Common container class - allow custom className to override default border/rounding
  const defaultClasses =
    'relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden';
  const containerClassName = className ? `relative overflow-hidden ${className}` : defaultClasses;

  // Render copy button when enabled
  const renderCopyButton = () => {
    if (!showCopyButton) return null;
    return (
      <div className="absolute top-2 right-2 z-20">
        <CopyButton
          text={content}
          variant="icon"
          size="sm"
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-600"
        />
      </div>
    );
  };

  if (readOnly) {
    // Readonly mode
    return (
      <div className={containerClassName}>
        <SyntaxHighlighter {...syntaxHighlighterProps} customStyle={defaultStyle} />
        {renderCopyButton()}
      </div>
    );
  }

  // Editable mode
  return (
    <div className={containerClassName}>
      {/* Background syntax highlighting */}
      <div className="absolute inset-0 pointer-events-none">
        <SyntaxHighlighter
          {...syntaxHighlighterProps}
          customStyle={{
            ...defaultStyle,
            background: 'transparent',
          }}
        />
      </div>

      {renderCopyButton()}

      {/* Overlay textarea for editing */}
      <textarea
        id={id}
        name={name}
        value={content}
        onChange={handleTextareaChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows || 8}
        className={`relative z-10 w-full px-3 py-2 bg-transparent text-transparent caret-gray-900 dark:caret-gray-100 resize-none outline-none ${
          disabled ? 'cursor-not-allowed' : ''
        }`}
        style={{
          fontFamily: defaultStyle.fontFamily,
          fontSize: defaultStyle.fontSize,
          lineHeight: defaultStyle.lineHeight,
          minHeight: defaultStyle.minHeight,
        }}
      />
    </div>
  );
};

export default CodeHighlighter;
