import { z } from 'zod';
import { IdParamSchema, PaginationQuerySchema, parseWithAppError, firstZodMessage } from '../src/validators/index.js';
import { AppError } from '../src/middleware/error.js';
import { CreateClaimSchema, ListClaimsQuerySchema } from '../src/validators/claims.js';

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
    expect(firstZodMessage(err)).toBe('a: first issue');
  });
});

describe('CreateClaimSchema column limits', () => {
  it('rejects strings longer than their VARCHAR column', () => {
    expect(() => parseWithAppError(CreateClaimSchema, { policyNumber: 'x'.repeat(101) })).toThrow(/^policyNumber: /);
    expect(() => parseWithAppError(CreateClaimSchema, { policyNumber: 'x'.repeat(101) })).toThrow(AppError);
    expect(() => parseWithAppError(CreateClaimSchema, { classification: 'x'.repeat(51) })).toThrow(AppError);
  });

  it('accepts a long locationOfLoss (TEXT column) and max-length VARCHAR values', () => {
    const parsed = parseWithAppError(CreateClaimSchema, {
      locationOfLoss: 'x'.repeat(500),
      policyNumber: 'x'.repeat(100),
      classification: 'x'.repeat(50),
    });
    expect(parsed.locationOfLoss).toHaveLength(500);
  });
});

describe('ListClaimsQuerySchema optional ids', () => {
  it('drops empty-string filter ids (the Claims page always sends them)', () => {
    const parsed = parseWithAppError(ListClaimsQuerySchema, { page: '1', limit: '20', view: 'active', clientId: '', engineerId: '' });
    expect(parsed).not.toHaveProperty('clientId');
    expect(parsed).not.toHaveProperty('engineerId');
  });

  it('coerces numeric ids and rejects garbage', () => {
    expect(parseWithAppError(ListClaimsQuerySchema, { clientId: '3' }).clientId).toBe(3);
    expect(() => parseWithAppError(ListClaimsQuerySchema, { clientId: 'abc' })).toThrow(AppError);
  });
});
