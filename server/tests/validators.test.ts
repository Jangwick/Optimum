import { z } from 'zod';
import { IdParamSchema, PaginationQuerySchema, parseWithAppError, firstZodMessage } from '../src/validators/index.js';
import { AppError } from '../src/middleware/error.js';

describe('validators', () => {
  it('rejects NaN ids', () => {
    expect(() => parseWithAppError(IdParamSchema, 'not-a-number')).toThrow(AppError);
    try {
      parseWithAppError(IdParamSchema, 'not-a-number');
    } catch (err) {
      expect((err as AppError).statusCode).toBe(400);
    }
  });

  it('parses valid id', () => {
    expect(parseWithAppError(IdParamSchema, '42')).toBe(42);
  });

  it('rejects negative ids', () => {
    expect(() => parseWithAppError(IdParamSchema, '-5')).toThrow(AppError);
  });

  it('applies pagination defaults and caps limit', () => {
    const parsed = parseWithAppError(PaginationQuerySchema, { page: '3', limit: '50' });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
  });

  it('rejects pagination limit above 100', () => {
    expect(() => parseWithAppError(PaginationQuerySchema, { page: '1', limit: '200' })).toThrow(AppError);
  });

  it('caps limit at 100', () => {
    const parsed = parseWithAppError(PaginationQuerySchema, { page: '1', limit: '100' });
    expect(parsed.limit).toBe(100);
    expect(parsed.page).toBe(1);
  });

  it('rejects invalid page and limit values', () => {
    expect(() => parseWithAppError(PaginationQuerySchema, { page: '0', limit: '20' })).toThrow(AppError);
    expect(() => parseWithAppError(PaginationQuerySchema, { page: '1', limit: '0' })).toThrow(AppError);
    expect(() => parseWithAppError(PaginationQuerySchema, { page: '-1', limit: '20' })).toThrow(AppError);
    expect(() => parseWithAppError(PaginationQuerySchema, { page: '1', limit: '-5' })).toThrow(AppError);
    expect(() => parseWithAppError(PaginationQuerySchema, { page: 'foo', limit: 'bar' })).toThrow(AppError);
  });

  it('returns the first zod message', () => {
    const err = new z.ZodError([
      { message: 'first issue', path: ['a'], code: 'invalid_type', expected: 'string', input: 0 },
    ]);
    expect(firstZodMessage(err)).toBe('first issue');
  });
});
