// Copyright JAMF Software, LLC

import { renderHook, act } from '@testing-library/react';

import { useContentViewer } from '../../components/shared/useContentViewer';

const JSON_CONTENT = '{"key":"value","num":1}';
const XML_CONTENT = '<root><child>text</child></root>';
const BASE64_CONTENT = 'SGVsbG8gV29ybGQ='; // "Hello World"
const TEXT_CONTENT = 'plain text content';

describe('useContentViewer — initial state', () => {
  it('defaults to initialType when autoDetect=false', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: JSON_CONTENT, autoDetect: false, initialType: 'text' }),
    );
    expect(result.current.viewMode).toBe('text');
  });

  it('auto-detects JSON content type', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: JSON_CONTENT, autoDetect: true }),
    );
    expect(result.current.viewMode).toBe('json');
  });

  it('auto-detects XML content type', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: XML_CONTENT, autoDetect: true }),
    );
    expect(result.current.viewMode).toBe('xml');
  });

  it('falls back to text for plain text content', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: TEXT_CONTENT, autoDetect: true }),
    );
    expect(result.current.viewMode).toBe('text');
  });
});

describe('useContentViewer — contentValidation', () => {
  it('marks isValidJson=true for JSON content', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: JSON_CONTENT, autoDetect: false }),
    );
    expect(result.current.contentValidation.isValidJson).toBe(true);
  });

  it('marks isValidJson=false for non-JSON content', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: TEXT_CONTENT, autoDetect: false }),
    );
    expect(result.current.contentValidation.isValidJson).toBe(false);
  });

  it('marks isValidBase64=true for base64 content', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: BASE64_CONTENT, autoDetect: false }),
    );
    expect(result.current.contentValidation.isValidBase64).toBe(true);
  });
});

describe('useContentViewer — contentTypeLabel', () => {
  it('returns "JSON" for valid JSON content', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: JSON_CONTENT, autoDetect: false }),
    );
    expect(result.current.contentTypeLabel).toBe('JSON');
  });

  it('returns "Text" for plain text', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: TEXT_CONTENT, autoDetect: false }),
    );
    expect(result.current.contentTypeLabel).toBe('Text');
  });

  it('returns "Binary" for base64-only content', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: BASE64_CONTENT, autoDetect: false }),
    );
    expect(result.current.contentTypeLabel).toBe('Binary');
  });
});

describe('useContentViewer — formattedContent', () => {
  it('returns pretty-printed JSON when viewMode=json', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: JSON_CONTENT, autoDetect: false, initialType: 'json' }),
    );
    expect(result.current.formattedContent).toBe(JSON.stringify(JSON.parse(JSON_CONTENT), null, 2));
  });

  it('returns raw content when viewMode=text', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: TEXT_CONTENT, autoDetect: false, initialType: 'text' }),
    );
    expect(result.current.formattedContent).toBe(TEXT_CONTENT);
  });

  it('returns hex dump string when viewMode=binary', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: BASE64_CONTENT, autoDetect: false, initialType: 'binary' }),
    );
    // Should contain hex pairs separated by spaces
    expect(result.current.formattedContent).toMatch(/[0-9A-F]{2}/);
  });
});

describe('useContentViewer — shouldUseSyntaxHighlighter', () => {
  it('is true when viewMode=json and content is valid JSON', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: JSON_CONTENT, autoDetect: false, initialType: 'json' }),
    );
    expect(result.current.shouldUseSyntaxHighlighter).toBe(true);
  });

  it('is false when viewMode=text', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: TEXT_CONTENT, autoDetect: false, initialType: 'text' }),
    );
    expect(result.current.shouldUseSyntaxHighlighter).toBe(false);
  });

  it('is false when viewMode=json but content is not valid JSON', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: TEXT_CONTENT, autoDetect: false, initialType: 'json' }),
    );
    expect(result.current.shouldUseSyntaxHighlighter).toBe(false);
  });
});

describe('useContentViewer — setViewMode', () => {
  it('updates viewMode via setViewMode', () => {
    const { result } = renderHook(() =>
      useContentViewer({ content: JSON_CONTENT, autoDetect: false, initialType: 'text' }),
    );
    expect(result.current.viewMode).toBe('text');

    act(() => {
      result.current.setViewMode('json');
    });

    expect(result.current.viewMode).toBe('json');
  });
});
