import { useState, useEffect } from 'react';

import {
  detectContentType,
  isValidJson,
  isValidXml,
  isValidBase64,
  formatContent,
  type ContentType,
} from '../../../../utils/contentDetection';

export interface UseContentViewerOptions {
  content: string;
  autoDetect?: boolean;
  initialType?: ContentType;
}

export interface UseContentViewerReturn {
  viewMode: ContentType;
  setViewMode: (mode: ContentType) => void;
  contentValidation: {
    isValidJson: boolean;
    isValidXml: boolean;
    isValidBase64: boolean;
  };
  contentTypeLabel: string;
  formattedContent: string;
  shouldUseSyntaxHighlighter: boolean;
}

export const useContentViewer = ({
  content,
  autoDetect = true,
  initialType = 'text',
}: UseContentViewerOptions): UseContentViewerReturn => {
  const [viewMode, setViewMode] = useState<ContentType>(initialType);

  // Content validation
  const contentValidation = {
    isValidJson: isValidJson(content),
    isValidXml: isValidXml(content),
    isValidBase64: isValidBase64(content),
  };

  // Auto-detect content type on mount and set initial view mode
  useEffect(() => {
    if (autoDetect && content) {
      const detection = detectContentType(content);
      setViewMode(detection.type);
    }
  }, [content, autoDetect]);

  // Get content type label
  const getContentTypeLabel = (): string => {
    const { isValidJson, isValidXml, isValidBase64 } = contentValidation;
    if (isValidJson && isValidXml) return 'JSON/XML';
    if (isValidJson) return 'JSON';
    if (isValidXml) return 'XML';
    if (isValidBase64) return 'Binary';
    return 'Text';
  };

  // Get formatted content based on view mode
  const getFormattedContent = (): string => {
    try {
      if (viewMode === 'json' && contentValidation.isValidJson) {
        return JSON.stringify(JSON.parse(content), null, 2);
      }
      if (viewMode === 'xml' && contentValidation.isValidXml) {
        return formatContent(content, 'xml');
      }
      if (viewMode === 'binary' && contentValidation.isValidBase64) {
        // Display binary data as hex dump style
        const binaryData =
          typeof window !== 'undefined' && window.atob
            ? window.atob(content.trim())
            : content.trim();
        return Array.from(binaryData)
          .map((char, index) => {
            const hex = char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase();
            const address = index % 16 === 0 ? `${index.toString(16).padStart(4, '0')}:  ` : '';
            const separator = index % 16 === 15 ? '\n' : index % 8 === 7 ? '  ' : ' ';
            return address + hex + separator;
          })
          .join('');
      }
    } catch (error) {
      console.error('Error formatting content:', error);
    }
    return content;
  };

  // Determine if syntax highlighter should be used
  const shouldUseSyntaxHighlighter =
    (viewMode === 'json' || viewMode === 'xml') &&
    (viewMode === 'json' ? contentValidation.isValidJson : contentValidation.isValidXml);

  return {
    viewMode,
    setViewMode,
    contentValidation,
    contentTypeLabel: getContentTypeLabel(),
    formattedContent: getFormattedContent(),
    shouldUseSyntaxHighlighter,
  };
};
