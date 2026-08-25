import { sanitizeLogString, sanitizeLogValue } from '../src/utils/sanitize-log.js';

describe('sanitize-log', () => {
  describe('sanitizeLogString', () => {
    it('strips control characters from a string', () => {
      const input = 'Hello\x00\x1B\x7FWorld';
      const result = sanitizeLogString(input);
      expect(result).toBe('Hello���World');
    });

    it('trims whitespace', () => {
      expect(sanitizeLogString('  clean  ')).toBe('clean');
    });

    it('returns empty for empty input', () => {
      expect(sanitizeLogString('')).toBe('');
    });
  });

  describe('sanitizeLogValue', () => {
    it('leaves primitives unchanged except strings', () => {
      expect(sanitizeLogValue(42)).toBe(42);
      expect(sanitizeLogValue(null)).toBe(null);
      expect(sanitizeLogValue(true)).toBe(true);
    });

    it('sanitizes strings inside objects recursively', () => {
      const result = sanitizeLogValue({
        user: 'Alice\x02',
        nested: { note: 'Hello\x1B' },
        list: ['ok\x7F', 123],
      }) as Record<string, unknown>;

      expect(result).toEqual({
        user: 'Alice�',
        nested: { note: 'Hello�' },
        list: ['ok�', 123],
      });
    });

    it('sanitizes each string in an array', () => {
      expect(sanitizeLogValue(['a\x00', 'b\x7F'])).toEqual(['a�', 'b�']);
    });
  });
});
