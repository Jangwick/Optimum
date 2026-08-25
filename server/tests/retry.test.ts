import { withRetry, isPrismaTransientError } from '../src/utils/retry.js';
import { Prisma } from '../generated/prisma/client.js';

class MockPrismaError extends Prisma.PrismaClientKnownRequestError {
  constructor(code: string) {
    super(`Prisma error ${code}`, { code, clientVersion: 'test' });
  }
}

describe('withRetry', () => {
  it('retries transient Prisma errors and then succeeds', async () => {
    let calls = 0;
    const fn = async () => {
      calls += 1;
      if (calls < 3) {
        throw new MockPrismaError('P1001');
      }
      return 'ok';
    };

    const result = await withRetry(fn, { retries: 3, baseDelay: 1, maxDelay: 10 });
    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  it('does not retry validation or non-retryable errors', async () => {
    let calls = 0;
    const fn = async () => {
      calls += 1;
      throw new MockPrismaError('P2002');
    };

    await expect(withRetry(fn, { retries: 3, baseDelay: 1, maxDelay: 10 })).rejects.toThrow('P2002');
    expect(calls).toBe(1);
  });

  it('throws after exhausting retries', async () => {
    let calls = 0;
    const fn = async () => {
      calls += 1;
      throw new MockPrismaError('P1002');
    };

    await expect(withRetry(fn, { retries: 2, baseDelay: 1, maxDelay: 10 })).rejects.toThrow('P1002');
    expect(calls).toBe(3);
  });

  it('does not retry generic errors', async () => {
    let calls = 0;
    const fn = async () => {
      calls += 1;
      throw new Error('boom');
    };

    await expect(withRetry(fn, { retries: 3, baseDelay: 1, maxDelay: 10 })).rejects.toThrow('boom');
    expect(calls).toBe(1);
  });

  it('identifies transient Prisma errors', () => {
    expect(isPrismaTransientError(new MockPrismaError('P1001'))).toBe(true);
    expect(isPrismaTransientError(new MockPrismaError('P1002'))).toBe(true);
    expect(isPrismaTransientError(new MockPrismaError('P1017'))).toBe(true);
    expect(isPrismaTransientError(new MockPrismaError('P2002'))).toBe(false);
    expect(isPrismaTransientError(new Error('network'))).toBe(false);
  });
});
