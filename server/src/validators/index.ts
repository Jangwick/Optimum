import { z } from 'zod';
import type { Request, RequestHandler } from 'express';
import { AppError } from '../middleware/error.js';

export function toNumber(val: unknown): unknown {
  if (val === undefined) return undefined;
  if (val === null || (typeof val === 'string' && val.trim() === '')) return null;
  const n = Number(val);
  return Number.isNaN(n) ? NaN : n;
}

export function toNumberOrUndefined(val: unknown): unknown {
  if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? NaN : n;
}

export const IdParamSchema = z.preprocess(
  (val) => Number(val),
  z.number().int().positive('Invalid id')
);

const pageSchema = z.preprocess(
  (val) => (val === undefined || val === '' ? undefined : Number(val)),
  z.number().int().positive().max(10_000).default(1)
);

const limitSchema = z.preprocess(
  (val) => (val === undefined || val === '' ? undefined : Number(val)),
  z.number().int().positive().max(100, 'Limit must be at most 100').default(20)
);

export const PaginationQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().exactOptional(),
});

export function optionalString() {
  return z.string().exactOptional();
}

export function optionalNullableString() {
  return z.string().nullable().exactOptional();
}

export function optionalNumber() {
  return z.preprocess(toNumberOrUndefined, z.number().exactOptional());
}

export function optionalNullableNumber() {
  return z.preprocess(toNumber, z.number().nullable().exactOptional());
}

export function requiredNumber() {
  return z.preprocess(toNumber, z.number());
}

export function optionalId() {
  return z.preprocess(toNumberOrUndefined, z.number().int().positive().exactOptional());
}

export function optionalNullableId() {
  return z.preprocess(toNumber, z.number().int().positive().nullable().exactOptional());
}

export function requiredId() {
  return z.preprocess(toNumber, z.number().int().positive());
}

export function parseIdParam(req: Request, param = 'id'): number {
  return parseWithAppError(IdParamSchema, req.params[param]);
}

export function parseWithAppError<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AppError(err.issues[0]?.message || 'Invalid input', 400);
    }
    throw err;
  }
}

export function firstZodMessage(err: z.ZodError): string {
  return err.issues[0]?.message || 'Invalid input';
}

export function validateBody<T>(schema: z.ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    try {
      (req as Request & { body: T }).body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        next(new AppError(firstZodMessage(err), 400));
      } else {
        next(err);
      }
    }
  };
}

export function validateQuery<T>(schema: z.ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    try {
      req.query = schema.parse(req.query) as unknown as typeof req.query;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        next(new AppError(firstZodMessage(err), 400));
      } else {
        next(err);
      }
    }
  };
}
