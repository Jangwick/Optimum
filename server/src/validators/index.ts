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

export function optionalNullableString(maxLength?: number) {
  const base = maxLength ? z.string().max(maxLength) : z.string();
  return base.nullable().exactOptional();
}

// Runtime accepts undefined (preprocess maps "" -> undefined; exactOptional would reject it), while the
// type stays exactOptional so consumers see `key?: number`. stripUndefined() makes the parsed object match.
// Every money/quantity column is DECIMAL(18,2). 1e14 keeps cents exact in a JS double and is well inside
// the column, so MySQL never raises "Out of range value" (Prisma P2020) for user input.
export const MAX_DECIMAL_VALUE = 1e14;
const boundedNumber = () =>
  z.number().min(-MAX_DECIMAL_VALUE, `Must be at least -${MAX_DECIMAL_VALUE}`).max(MAX_DECIMAL_VALUE, `Must be at most ${MAX_DECIMAL_VALUE}`);

export function optionalNumber() {
  return z.preprocess(toNumberOrUndefined, boundedNumber().optional()) as unknown as z.ZodExactOptional<z.ZodNumber>;
}

export function optionalNullableNumber() {
  return z.preprocess(toNumber, boundedNumber().nullable().exactOptional());
}

export function requiredNumber() {
  return z.preprocess(toNumber, boundedNumber());
}

export function optionalId() {
  return z.preprocess(toNumberOrUndefined, z.number().int().positive().optional()) as unknown as z.ZodExactOptional<z.ZodNumber>;
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

function stripUndefined<T>(value: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value)) {
      if ((value as Record<string, unknown>)[key] === undefined) delete (value as Record<string, unknown>)[key];
    }
  }
  return value;
}

export function parseWithAppError<T>(schema: z.ZodType<T>, data: unknown): T {
  try {
    return stripUndefined(schema.parse(data));
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new AppError(firstZodMessage(err), 400);
    }
    throw err;
  }
}

export function firstZodMessage(err: z.ZodError): string {
  const issue = err.issues[0];
  if (!issue) return 'Invalid input';
  const field = issue.path.map(String).join('.');
  return field ? `${field}: ${issue.message}` : issue.message;
}

export function validateBody<T>(schema: z.ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    try {
      (req as Request & { body: T }).body = stripUndefined(schema.parse(req.body));
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
      req.query = stripUndefined(schema.parse(req.query)) as unknown as typeof req.query;
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
