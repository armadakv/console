import React from 'react';
import { PrismAsyncLight as SyntaxHighlighterLib } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { CopyButton } from './CopyButton';

import type { ContentType } from '@/utils/contentDetection';

SyntaxHighlighterLib.registerLanguage('json', json);
SyntaxHighlighterLib.registerLanguage('xml', markup);
SyntaxHighlighterLib.registerLanguage('markup', markup);
SyntaxHighlighterLib.registerLanguage('text', markup);
SyntaxHighlighterLib.registerLanguage('binary', markup);

interface CodeHighlighterProps {
  content: string;
  language: ContentType;
  density?: 'compact' | 'comfortable';
  showCopyButton?: boolean;
  showLineNumbers?: boolean;
  customStyle?: React.CSSProperties;
  className?: string;
  rows?: number;
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
  const defaultStyle: React.CSSProperties = {
    margin: 0,
    borderRadius: 8,
    fontFamily: '"Roboto Mono", "Courier New", monospace',
    fontSize: density === 'compact' ? '12px' : '14px',
    lineHeight: '1.4',
    background: '#1f2937',
    color: '#f3f4f6',
    ...(rows ? { minHeight: `${rows * 1.4 * (density === 'compact' ? 12 : 14) + 24}px` } : {}),
    ...customStyle,
  };

  const syntaxLanguage = language === 'xml' ? 'xml' : language;

  const syntaxHighlighterProps = {
    language: syntaxLanguage,
    style: vscDarkPlus,
    showLineNumbers: showLineNumbers ?? content.split('\n').length > 10,
    wrapLines: true,
    wrapLongLines: true,
    children: content,
  };

  const defaultClasses = 'relative border border-slate-700 rounded-lg overflow-hidden';
  const containerClassName = className ? `relative overflow-hidden ${className}` : defaultClasses;

  const renderCopyButton = () => {
    if (!showCopyButton) return null;
    return (
      <div className="absolute top-2 right-2 z-20">
        <CopyButton
          text={content}
          variant="icon"
          size="sm"
          className="bg-slate-800/80 backdrop-blur-sm border border-slate-600"
        />
      </div>
    );
  };

  if (readOnly) {
    return (
      <div className={containerClassName}>
        <SyntaxHighlighterLib {...syntaxHighlighterProps} customStyle={defaultStyle} />
        {renderCopyButton()}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      {/* Background syntax highlighting */}
      <div className="absolute inset-0 pointer-events-none">
        <SyntaxHighlighterLib
          {...syntaxHighlighterProps}
          customStyle={{ ...defaultStyle, background: 'transparent' }}
        />
      </div>

      {renderCopyButton()}

      {/* Overlay textarea for editing */}
      <textarea
        id={id}
        name={name}
        value={content}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows || 8}
        className={`relative z-10 w-full px-3 py-2 bg-transparent text-transparent caret-gray-100 resize-none outline-none ${
          disabled ? 'cursor-not-allowed' : ''
        }`}
        style={{
          fontFamily: defaultStyle.fontFamily as string,
          fontSize: defaultStyle.fontSize as string,
          lineHeight: defaultStyle.lineHeight as string,
          minHeight: defaultStyle.minHeight as string | undefined,
        }}
      />
    </div>
  );
};
