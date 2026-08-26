import { describe, it, expect } from 'vitest';
import { stripHtml } from './sanitize.js';

describe('stripHtml', () => {
  it('extracts plain text from HTML', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('removes script tags and event handlers', () => {
    const malicious = `<p onclick="alert('xss')">safe text</p><script>alert('xss')</script><img src=x onerror="alert('xss')">`;
    expect(stripHtml(malicious)).toBe('safe text');
  });

  it('decodes HTML entities', () => {
    expect(stripHtml('<p>Tom &amp; Jerry</p>')).toBe('Tom & Jerry');
  });

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('');
    expect(stripHtml(undefined as unknown as string)).toBe('');
  });
});
