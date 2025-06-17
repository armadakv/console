import { Download } from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';

import {
  detectContentType,
  validateContent,
  formatContent as formatContentUtil,
  minifyContent as minifyContentUtil,
  formatBytes,
  type ContentType,
} from '../../../utils/contentDetection';

import { ViewModeButtons, CodeHighlighter } from './shared';

import { Button } from '@/ui/Button';
import { Typography } from '@/ui/Typography';

type BinaryMode = 'base64' | 'file';

interface ValueEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  rows?: number;
  initialType?: ContentType;
  maxLength?: number; // Maximum length in bytes
  name?: string; // For form integration
}

export const ValueEditor: React.FC<ValueEditorProps> = ({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  readOnly = false,
  className = '',
  rows = 8,
  initialType = 'text',
  maxLength,
  name,
}) => {
  const [valueType, setValueType] = useState<ContentType>(initialType);
  const [binaryMode, setBinaryMode] = useState<BinaryMode>('base64');
  const [isValidFormat, setIsValidFormat] = useState(true);
  const [formatError, setFormatError] = useState<string>('');
  const [formattedValue, setFormattedValue] = useState('');
  const [viewMode, setViewMode] = useState<'raw' | 'formatted'>('raw');
  const [userHasSelectedFormat, setUserHasSelectedFormat] = useState(false);

  // Generate unique ID for accessibility
  const editorId = React.useId();

  // Auto-detect value type based on content (using shared utility)
  const detectValueType = useCallback((content: string): ContentType => {
    return detectContentType(content).type;
  }, []);

  // Validate format based on type (using shared utility)
  const validateFormat = useCallback((content: string, type: ContentType) => {
    const result = validateContent(content, type);

    setIsValidFormat(result.isValid);
    setFormatError(result.error || '');
    return result.isValid;
  }, []);

  // Format content (using shared utility)
  const formatContent = useCallback(() => {
    try {
      const formatted = formatContentUtil(value, valueType);
      setFormattedValue(formatted);
      setViewMode('formatted');
    } catch (error) {
      console.error('Failed to format content:', error);
    }
  }, [value, valueType]);

  // Apply formatted content to the actual value
  const applyFormattedContent = useCallback(() => {
    if (formattedValue && viewMode === 'formatted') {
      onChange(formattedValue);
      setViewMode('raw');
    }
  }, [formattedValue, viewMode, onChange]);

  // Minify content (using shared utility)
  const minifyContent = useCallback(() => {
    try {
      const minified = minifyContentUtil(value, valueType);
      setFormattedValue(minified);
      setViewMode('formatted');
    } catch (error) {
      console.error('Failed to minify content:', error);
    }
  }, [value, valueType]);

  // Handle file upload for binary data
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (readOnly || disabled) return;

      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new window.FileReader();
      reader.onload = (e: any) => {
        const target = e.target;
        const arrayBuffer = target.result as ArrayBuffer;
        if (arrayBuffer) {
          const bytes = new Uint8Array(arrayBuffer);
          const base64 = window.btoa(String.fromCharCode.apply(null, Array.from(bytes)));
          onChange(base64);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onChange, disabled, readOnly],
  );

  // Download binary data as file
  const downloadBinaryFile = useCallback(() => {
    try {
      const binaryString = window.atob(value);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new window.Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'binary_data';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download binary file:', error);
    }
  }, [value]);

  // Auto-detect type when value or initialType changes, if user hasn't manually selected a format
  useEffect(() => {
    if (value && initialType === 'text' && !userHasSelectedFormat) {
      const detectedType = detectValueType(value);
      if (detectedType !== 'text') {
        setValueType(detectedType);
      }
    } else if (initialType !== 'text' && !userHasSelectedFormat) {
      // If initialType is explicitly set to something other than 'text', use it
      setValueType(initialType);
    }
  }, [value, initialType, userHasSelectedFormat, detectValueType]);

  // Handle initialType changes (e.g., when component is reused for different operations)
  useEffect(() => {
    // Always sync with initialType when user hasn't manually selected a format
    // This ensures the component responds to prop changes correctly
    if (!userHasSelectedFormat) {
      setValueType(initialType);
    }
  }, [initialType, userHasSelectedFormat]);

  // Reset user selection flag and state when value changes to empty (new form)
  useEffect(() => {
    if (!value) {
      setUserHasSelectedFormat(false);
      setValueType(initialType);
      setFormattedValue('');
      setViewMode('raw');
    }
  }, [value, initialType]);

  // Validate on value or type change
  useEffect(() => {
    const valueToValidate = viewMode === 'formatted' ? formattedValue : value;
    validateFormat(valueToValidate, valueType);
  }, [value, valueType, validateFormat, viewMode, formattedValue]);

  // Update formatted value when switching to formatted mode
  useEffect(() => {
    if (viewMode === 'formatted' && isValidFormat && value.trim()) {
      try {
        switch (valueType) {
          case 'json': {
            const parsed = JSON.parse(value);
            setFormattedValue(JSON.stringify(parsed, null, 2));
            break;
          }
          case 'xml':
            setFormattedValue(value.replace(/></g, '>\n<'));
            break;
          default:
            setFormattedValue(value);
        }
      } catch {
        setViewMode('raw');
      }
    }
  }, [viewMode, value, valueType, isValidFormat]);

  const currentValue = viewMode === 'formatted' && isValidFormat ? formattedValue : value;
  const canFormat = valueType === 'json' || valueType === 'xml';

  return (
    <div className={`${className}`}>
      {label && (
        <label
          htmlFor={editorId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      {/* Value Type Selection */}
      <div
        className={`flex flex-wrap items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-t-lg border border-b-0 border-gray-200 dark:border-gray-600 ${
          !isValidFormat ? 'border-red-300 dark:border-red-600' : ''
        }`}
      >
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">Type:</span>
          <ViewModeButtons
            viewMode={valueType}
            onViewModeChange={(type) => {
              setValueType(type);
              setUserHasSelectedFormat(true);
            }}
            contentValidation={{
              // Always enable all buttons - user should be able to switch view types
              isValidJson: true,
              isValidXml: true,
              isValidBase64: true,
            }}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Format Controls */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800 border border-t-0 border-b-0 border-gray-200 dark:border-gray-600 rounded-none ${
          !isValidFormat ? 'border-red-300 dark:border-red-600' : ''
        }`}
      >
        {canFormat && (
          <div className="flex items-center gap-2">
            {/* View Mode Toggle for JSON/XML */}
            <div className="flex rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Button
                variant={viewMode === 'raw' ? 'primary' : 'outline'}
                size="sm"
                type="button"
                onClick={() => setViewMode('raw')}
                className="rounded-none border-0 border-r border-gray-200 dark:border-gray-700 px-2 py-1 h-6 text-xs"
                disabled={disabled}
              >
                Raw
              </Button>
              <Button
                variant={viewMode === 'formatted' ? 'primary' : 'outline'}
                size="sm"
                type="button"
                onClick={() => setViewMode('formatted')}
                className="rounded-none border-0 px-2 py-1 h-6 text-xs"
                disabled={disabled || !isValidFormat}
              >
                Formatted
              </Button>
            </div>

            {/* Format Actions */}

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={formatContent}
                className="px-2 py-1 h-6 text-xs"
                disabled={disabled}
                title={`Format ${valueType.toUpperCase()}`}
              >
                Format
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={minifyContent}
                className="px-2 py-1 h-6 text-xs"
                disabled={disabled}
                title={`Minify ${valueType.toUpperCase()}`}
              >
                Minify
              </Button>
              {viewMode === 'formatted' && formattedValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={applyFormattedContent}
                  className="px-2 py-1 h-6 text-xs"
                  disabled={disabled}
                  title="Apply formatted content"
                >
                  Apply
                </Button>
              )}
            </div>
          </div>
        )}
        {/* Binary Mode Selection */}
        {valueType === 'binary' && !readOnly && (
          <div className="flex rounded border border-gray-200 dark:border-gray-700 overflow-hidden ml-2">
            <Button
              variant={binaryMode === 'base64' ? 'primary' : 'outline'}
              size="sm"
              type="button"
              onClick={() => setBinaryMode('base64')}
              className="rounded-none border-0 border-r border-gray-200 dark:border-gray-700 px-2 py-1 h-6 text-xs"
              disabled={disabled}
            >
              Base64
            </Button>
            <Button
              variant={binaryMode === 'file' ? 'primary' : 'outline'}
              size="sm"
              type="button"
              onClick={() => setBinaryMode('file')}
              className="rounded-none border-0 px-2 py-1 h-6 text-xs"
              disabled={disabled}
            >
              File
            </Button>
          </div>
        )}

        {/* Readonly Toggle */}

        {/* Validation Status */}
        <div className="flex items-center gap-2">
          {value.trim() && (
            <div className="flex items-center gap-1">
              {isValidFormat ? (
                <span className="text-xs text-green-600 dark:text-green-400">
                  Valid {valueType.toUpperCase()}
                </span>
              ) : (
                <span className="text-xs text-red-600 dark:text-red-400">
                  Invalid {valueType.toUpperCase()}
                </span>
              )}
            </div>
          )}

          {/* Character/Byte Count */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {(() => {
              const byteLength = new (window as any).TextEncoder().encode(value).length;
              const charLength = value.length;
              return (
                <span>
                  {charLength} chars • {formatBytes(byteLength)}
                  {maxLength && (
                    <span className={byteLength > maxLength ? 'text-red-500' : ''}>
                      {' '}
                      / {formatBytes(maxLength)}
                    </span>
                  )}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Binary File Upload/Download */}
      {valueType === 'binary' && binaryMode === 'file' && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-t-0 border-b-0 border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={disabled || readOnly}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {value && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={downloadBinaryFile}
                className="px-2 py-1 h-7 text-xs flex-shrink-0"
                disabled={disabled || !isValidFormat}
                title="Download as file"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Text Area */}
      <div className="relative -mt-2">
        <CodeHighlighter
          id={editorId}
          name={name}
          content={currentValue}
          language={valueType}
          readOnly={readOnly}
          className={`border border-gray-200 dark:border-gray-600 border-t-0 rounded-t-none rounded-b-lg ${
            !isValidFormat ? 'border-red-300 dark:border-red-600' : ''
          }`}
          onChange={(value) => {
            if (!readOnly && !disabled) {
              // Check length limit if specified (approximate byte calculation)
              if (maxLength) {
                const byteLength = new (window as any).TextEncoder().encode(value).length;
                if (byteLength > maxLength) {
                  setFormatError(`Content exceeds maximum size of ${formatBytes(maxLength)}`);
                  setIsValidFormat(false);
                  return; // Don't update value if it exceeds limit
                }
              }

              // Handle the change based on current view mode
              if (viewMode === 'formatted') {
                setFormattedValue(value);
              } else {
                onChange(value);
              }
            }
          }}
          placeholder={
            valueType === 'binary' && binaryMode === 'base64'
              ? 'Enter base64 encoded data or upload a file above'
              : placeholder || `Enter ${valueType} data...`
          }
          disabled={disabled}
          showLineNumbers={currentValue.split('\n').length > 10}
          rows={rows}
        />
      </div>

      {/* Error Message */}
      {!isValidFormat && formatError && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded text-sm">
          <Typography className="text-red-700 dark:text-red-300">
            <strong>{valueType.toUpperCase()} Error:</strong> {formatError}
          </Typography>
        </div>
      )}
    </div>
  );
};

export default ValueEditor;
