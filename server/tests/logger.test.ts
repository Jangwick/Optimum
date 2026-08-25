import { Writable } from 'node:stream';
import { createLogger } from '../src/config/logger.js';

function captureStream() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding: string, callback: (error?: Error | null) => void) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  return { stream, chunks };
}

function parseLastLine(chunks: string[]) {
  const last = chunks.filter(Boolean).pop();
  if (!last) throw new Error('no log output');
  return JSON.parse(last);
}

describe('logger redaction', () => {
  it('redacts sensitive fields from log events', () => {
    const { stream, chunks } = captureStream();
    const logger = createLogger({ level: 'info', stream });

    logger.info(
      {
        user: { id: 1, password: 'hunter2' },
        token: 'jwt-token',
        jwt: 'header.payload.signature',
        authorization: 'Bearer abc',
        apiKey: 'secret-key',
      },
      'sensitive data handled',
    );

    const line = parseLastLine(chunks);
    expect(line.user.id).toBe(1);
    expect(line.user.password).toBe('[Redacted]');
    expect(line.token).toBe('[Redacted]');
    expect(line.jwt).toBe('[Redacted]');
    expect(line.authorization).toBe('[Redacted]');
    expect(line.apiKey).toBe('[Redacted]');
    expect(line.msg).toBe('sensitive data handled');
    expect(line.version).toBeDefined();
  });

  it('redacts nested path wildcards', () => {
    const { stream, chunks } = captureStream();
    const logger = createLogger({ level: 'info', stream });

    logger.info({ body: { password: 'x' }, headers: { authorization: 'Bearer y' } });

    const line = parseLastLine(chunks);
    expect(line.body.password).toBe('[Redacted]');
    expect(line.headers.authorization).toBe('[Redacted]');
  });
});
