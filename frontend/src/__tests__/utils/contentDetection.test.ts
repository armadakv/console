import {
  detectContentType,
  isValidJson,
  isValidXml,
  isValidBase64,
  validateContent,
  formatContent,
  minifyContent,
  formatBytes,
  getContentStats,
  getContentTypeInfo,
} from '../../utils/contentDetection';

describe('detectContentType', () => {
  it('returns text/high for empty string', () => {
    expect(detectContentType('')).toEqual({ type: 'text', confidence: 'high' });
  });

  it('returns text/high for whitespace-only string', () => {
    expect(detectContentType('   ')).toEqual({ type: 'text', confidence: 'high' });
  });

  it('returns json/high for JSON object', () => {
    expect(detectContentType('{"a":1}')).toEqual({ type: 'json', confidence: 'high' });
  });

  it('returns json/high for JSON array', () => {
    expect(detectContentType('[1,2]')).toEqual({ type: 'json', confidence: 'high' });
  });

  it('returns json/medium for JSON primitive', () => {
    expect(detectContentType('42')).toEqual({ type: 'json', confidence: 'medium' });
  });

  it('returns xml/high for XML with closing tag', () => {
    expect(detectContentType('<root><a></a></root>')).toEqual({ type: 'xml', confidence: 'high' });
  });

  it('returns xml/medium for XML without closing tag', () => {
    expect(detectContentType('<br>')).toEqual({ type: 'xml', confidence: 'medium' });
  });

  it('returns binary/high for valid base64 string', () => {
    // length > 20, multiple of 4: "Hello, World! Goodbye" base64-encoded
    expect(detectContentType('SGVsbG8sIFdvcmxkISBHb29kYnllCg==')).toEqual({
      type: 'binary',
      confidence: 'high',
    });
  });

  it('returns text/high for plain text', () => {
    expect(detectContentType('hello world')).toEqual({ type: 'text', confidence: 'high' });
  });
});

describe('isValidJson', () => {
  it('returns false for empty string', () => {
    expect(isValidJson('')).toBe(false);
  });

  it('returns true for valid JSON object', () => {
    expect(isValidJson('{"key":"value"}')).toBe(true);
  });

  it('returns true for valid JSON array', () => {
    expect(isValidJson('[1,2,3]')).toBe(true);
  });

  it('returns false for invalid JSON', () => {
    expect(isValidJson('{key: value}')).toBe(false);
  });
});

describe('isValidXml', () => {
  it('returns false for empty string', () => {
    expect(isValidXml('')).toBe(false);
  });

  it('returns true for valid XML', () => {
    expect(isValidXml('<root><child>text</child></root>')).toBe(true);
  });

  it('returns false for invalid XML', () => {
    expect(isValidXml('<root><unclosed>')).toBe(false);
  });
});

describe('isValidBase64', () => {
  it('returns false for empty string', () => {
    expect(isValidBase64('')).toBe(false);
  });

  it('returns true for valid base64 with length multiple of 4 and >20 chars', () => {
    expect(isValidBase64('SGVsbG8gV29ybGQhISEhISE=')).toBe(true);
  });

  it('returns false for string with non-base64 characters', () => {
    expect(isValidBase64('not base64!@#$')).toBe(false);
  });

  it('returns false for base64-like string with length not multiple of 4', () => {
    expect(isValidBase64('SGVsbG')).toBe(false); // 6 chars — not a multiple of 4
  });
});

describe('validateContent', () => {
  it('returns valid for empty content regardless of type', () => {
    expect(validateContent('', 'json')).toEqual({ isValid: true });
    expect(validateContent('', 'xml')).toEqual({ isValid: true });
    expect(validateContent('', 'binary')).toEqual({ isValid: true });
    expect(validateContent('', 'text')).toEqual({ isValid: true });
  });

  it('returns valid for valid JSON with type json', () => {
    expect(validateContent('{"a":1}', 'json')).toEqual({ isValid: true });
  });

  it('returns invalid with error for invalid JSON with type json', () => {
    expect(validateContent('{bad json}', 'json')).toEqual({
      isValid: false,
      error: 'Invalid JSON format',
    });
  });

  it('returns valid for any text with type text', () => {
    expect(validateContent('anything goes', 'text')).toEqual({ isValid: true });
  });

  it('returns valid for valid XML with type xml', () => {
    expect(validateContent('<root><a/></root>', 'xml')).toEqual({ isValid: true });
  });

  it('returns invalid for non-base64 with type binary', () => {
    expect(validateContent('not!base64', 'binary')).toEqual({
      isValid: false,
      error: 'Invalid base64 format',
    });
  });
});

describe('formatContent', () => {
  it('pretty-prints valid JSON with 2-space indent', () => {
    expect(formatContent('{"a":1}', 'json')).toBe('{\n  "a": 1\n}');
  });

  it('returns original content for invalid JSON', () => {
    expect(formatContent('{bad}', 'json')).toBe('{bad}');
  });

  it('adds newline between tags for valid XML', () => {
    expect(formatContent('<root><a></a></root>', 'xml')).toBe('<root>\n<a>\n</a>\n</root>');
  });

  it('returns text as-is', () => {
    expect(formatContent('hello', 'text')).toBe('hello');
  });

  it('returns binary as-is', () => {
    expect(formatContent('SGVsbG8=', 'binary')).toBe('SGVsbG8=');
  });
});

describe('minifyContent', () => {
  it('minifies valid JSON', () => {
    expect(minifyContent('{\n  "a": 1\n}', 'json')).toBe('{"a":1}');
  });

  it('removes whitespace between tags for valid XML', () => {
    expect(minifyContent('<root>\n  <a/>\n</root>', 'xml')).toBe('<root><a/></root>');
  });

  it('returns text as-is', () => {
    expect(minifyContent('hello world', 'text')).toBe('hello world');
  });

  it('returns binary as-is', () => {
    expect(minifyContent('SGVsbG8=', 'binary')).toBe('SGVsbG8=');
  });
});

describe('formatBytes', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('returns "1 KB" for 1024 bytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('returns "1.5 KB" for 1536 bytes', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('returns "1 MB" for 1048576 bytes', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
  });
});

describe('getContentStats', () => {
  it('returns isEmpty true and lines 1 for empty string', () => {
    const stats = getContentStats('');
    expect(stats.isEmpty).toBe(true);
    expect(stats.lines).toBe(1);
    expect(stats.characters).toBe(0);
  });

  it('returns correct stats for multiline content', () => {
    const stats = getContentStats('hello\nworld');
    expect(stats.lines).toBe(2);
    expect(stats.characters).toBe(11);
    expect(stats.isEmpty).toBe(false);
  });

  it('includes bytes count', () => {
    const stats = getContentStats('abc');
    expect(stats.bytes).toBeGreaterThan(0);
  });
});

describe('getContentTypeInfo', () => {
  it('returns correct info for json', () => {
    expect(getContentTypeInfo('json')).toEqual({
      label: 'JSON',
      description: 'JavaScript Object Notation',
    });
  });

  it('returns correct info for text', () => {
    expect(getContentTypeInfo('text')).toEqual({
      label: 'Text',
      description: 'Plain text content',
    });
  });

  it('returns correct info for xml', () => {
    expect(getContentTypeInfo('xml')).toEqual({
      label: 'XML',
      description: 'Extensible Markup Language',
    });
  });

  it('returns correct info for binary', () => {
    expect(getContentTypeInfo('binary')).toEqual({
      label: 'Binary',
      description: 'Base64 encoded binary data',
    });
  });
});
