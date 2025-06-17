/**
 * Content detection and validation utilities for key-value data
 */

export type ContentType = 'text' | 'json' | 'xml' | 'binary';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface DetectionResult {
  type: ContentType;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Auto-detect content type based on the content string
 */
export const detectContentType = (content: string): DetectionResult => {
  if (!content.trim()) {
    return { type: 'text', confidence: 'high' };
  }

  const trimmedContent = content.trim();

  // Check for base64 (binary) - high confidence if it matches pattern and is long enough
  if (
    /^[A-Za-z0-9+/]+=*$/.test(trimmedContent) &&
    trimmedContent.length % 4 === 0 &&
    trimmedContent.length > 20
  ) {
    return { type: 'binary', confidence: 'high' };
  }

  // Check for JSON - try to parse
  if (isValidJson(content)) {
    // Higher confidence for objects/arrays vs simple values
    const confidence =
      trimmedContent.startsWith('{') || trimmedContent.startsWith('[') ? 'high' : 'medium';
    return { type: 'json', confidence };
  }

  // Check for XML - look for opening and closing tags
  if (trimmedContent.startsWith('<') && trimmedContent.endsWith('>')) {
    // Basic XML pattern check
    const hasClosingTag = /<\/\w+>/.test(trimmedContent);
    const confidence = hasClosingTag ? 'high' : 'medium';
    return { type: 'xml', confidence };
  }

  return { type: 'text', confidence: 'high' };
};

/**
 * Check if content is valid JSON
 */
export const isValidJson = (content: string): boolean => {
  if (!content.trim()) return false;

  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if content is valid XML
 */
export const isValidXml = (content: string): boolean => {
  if (!content.trim()) return false;

  try {
    if (typeof window !== 'undefined' && window.DOMParser) {
      const parser = new window.DOMParser();
      const doc = parser.parseFromString(content, 'text/xml');
      const parseError = doc.getElementsByTagName('parsererror');
      return parseError.length === 0;
    }
    // Fallback for server-side or environments without DOMParser
    return content.trim().startsWith('<') && content.trim().endsWith('>');
  } catch {
    return false;
  }
};

/**
 * Check if content is valid base64
 */
export const isValidBase64 = (content: string): boolean => {
  if (!content.trim()) return false;

  try {
    const trimmedContent = content.trim();
    // Check base64 pattern and length
    if (!/^[A-Za-z0-9+/]+=*$/.test(trimmedContent) || trimmedContent.length % 4 !== 0) {
      return false;
    }

    // Try to decode to verify it's actually base64
    if (typeof window !== 'undefined' && window.atob) {
      window.atob(trimmedContent);
      return true;
    }

    return true; // Assume valid if we can't decode
  } catch {
    return false;
  }
};

/**
 * Validate content based on specified type
 */
export const validateContent = (content: string, type: ContentType): ValidationResult => {
  if (!content.trim()) {
    return { isValid: true };
  }

  switch (type) {
    case 'json':
      if (isValidJson(content)) {
        return { isValid: true };
      }
      return { isValid: false, error: 'Invalid JSON format' };

    case 'xml':
      if (isValidXml(content)) {
        return { isValid: true };
      }
      return { isValid: false, error: 'Invalid XML format' };

    case 'binary':
      if (isValidBase64(content)) {
        return { isValid: true };
      }
      return { isValid: false, error: 'Invalid base64 format' };

    case 'text':
    default:
      // Text is always valid
      return { isValid: true };
  }
};

/**
 * Format content based on type
 */
export const formatContent = (content: string, type: ContentType): string => {
  if (!content.trim()) return content;

  try {
    switch (type) {
      case 'json':
        if (isValidJson(content)) {
          const parsed = JSON.parse(content);
          return JSON.stringify(parsed, null, 2);
        }
        break;

      case 'xml':
        // Simple XML formatting (basic indentation)
        if (isValidXml(content)) {
          return content.replace(/></g, '>\n<').replace(/^\s+|\s+$/g, '');
        }
        break;

      case 'binary':
      case 'text':
      default:
        // No formatting for binary/text
        break;
    }
  } catch {
    // If formatting fails, return original content
  }

  return content;
};

/**
 * Minify content based on type
 */
export const minifyContent = (content: string, type: ContentType): string => {
  if (!content.trim()) return content;

  try {
    switch (type) {
      case 'json':
        if (isValidJson(content)) {
          const parsed = JSON.parse(content);
          return JSON.stringify(parsed);
        }
        break;

      case 'xml':
        if (isValidXml(content)) {
          return content.replace(/>\s+</g, '><').replace(/^\s+|\s+$/g, '');
        }
        break;

      case 'binary':
      case 'text':
      default:
        // No minification for binary/text
        break;
    }
  } catch {
    // If minification fails, return original content
  }

  return content;
};

/**
 * Get content type display information
 */
export const getContentTypeInfo = (type: ContentType) => {
  const typeInfo = {
    text: { label: 'Text', description: 'Plain text content' },
    json: { label: 'JSON', description: 'JavaScript Object Notation' },
    xml: { label: 'XML', description: 'Extensible Markup Language' },
    binary: { label: 'Binary', description: 'Base64 encoded binary data' },
  };

  return typeInfo[type] || typeInfo.text;
};

/**
 * Calculate content statistics
 */
export const getContentStats = (content: string) => {
  const charCount = content.length;
  const byteLength =
    typeof window !== 'undefined' && window.TextEncoder
      ? new window.TextEncoder().encode(content).length
      : charCount; // Fallback approximation

  return {
    characters: charCount,
    bytes: byteLength,
    lines: content.split('\n').length,
    isEmpty: !content.trim(),
  };
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
