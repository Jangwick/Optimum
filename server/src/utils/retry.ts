import { Prisma } from '../../generated/prisma/client.js';

interface RetryOptions {
  retries?: number;
  baseDelay?: number;
  maxDelay?: number;
  isRetryable?: (err: unknown) => boolean;
}

const DEFAULT_RETRYABLE_CODES = new Set(['P1001', 'P1002', 'P1017']);

/**
 * Determines whether an error is a transient Prisma/network failure that is safe
 * to retry. Validation, auth, and unique-constraint errors are not retryable.
 */
export function isPrismaTransientError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && DEFAULT_RETRYABLE_CODES.has(err.code);
}

/**
 * Execute `fn` with up to `retries` extra attempts on transient errors.
 * Uses exponential backoff with full jitter: delay is a random value between
 * `baseDelay` and `min(baseDelay * 2^attempt, maxDelay)`.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    retries = 3,
    baseDelay = 100,
    maxDelay = 5000,
    isRetryable = isPrismaTransientError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isRetryable(err)) {
        throw err;
      }
      const cap = Math.min(baseDelay * 2 ** attempt, maxDelay);
      const delay = Math.floor(Math.random() * (cap - baseDelay) + baseDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This is unreachable, but TypeScript requires a return/throw.
  throw lastError;
}
