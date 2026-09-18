import { jest } from '@jest/globals';

// Model a production dependency install without removing local packages.
const resolveModule = jest.fn<(name: string) => string>();
jest.unstable_mockModule('node:module', () => ({
  createRequire: () => ({ resolve: resolveModule }),
}));

const { createLogger } = await import('../src/config/logger.js');

describe('optional log formatting (small)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('writes redacted JSON when the development formatter is not installed', () => {
    resolveModule.mockImplementation(() => {
      throw Object.assign(new Error('Cannot find pino-pretty'), { code: 'MODULE_NOT_FOUND' });
    });
    const chunks: string[] = [];
    jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      chunks.push(String(chunk));
      return true;
    });

    const logger = createLogger({ pretty: true });
    logger.info({ password: 'must-not-leak' }, 'server can start');

    expect(chunks).toHaveLength(1);
    expect(JSON.parse(chunks[0]!)).toMatchObject({
      msg: 'server can start',
      password: '[Redacted]',
    });
  });

  it('does not hide unexpected module resolution failures', () => {
    resolveModule.mockImplementation(() => {
      throw Object.assign(new Error('Permission denied'), { code: 'EACCES' });
    });
    expect(() => createLogger({ pretty: true })).toThrow('Permission denied');
  });
});
