import { EventEmitter } from 'node:events';
import { requestSignalMiddleware } from '../src/middleware/request-signal.js';
import type { Request, Response, NextFunction } from 'express';

function createRequest(complete = false): Request {
  return Object.assign(new EventEmitter(), { complete }) as unknown as Request;
}

function createResponse(writableEnded = false): Response {
  return Object.assign(new EventEmitter(), { writableEnded }) as unknown as Response;
}

function createNext() {
  let called = false;
  const next = (() => {
    called = true;
  }) as unknown as NextFunction;
  return { next, wasCalled: () => called };
}

describe('requestSignalMiddleware', () => {
  it('sets req.signal and calls next', () => {
    const req = createRequest();
    const res = createResponse();
    const { next, wasCalled } = createNext();

    requestSignalMiddleware(req, res, next);

    expect(wasCalled()).toBe(true);
    expect((req as unknown as { signal: AbortSignal }).signal).toBeInstanceOf(AbortSignal);
    expect((req as unknown as { signal: AbortSignal }).signal.aborted).toBe(false);
  });

  it('aborts the signal when res closes before it is finished', () => {
    const req = createRequest();
    const res = createResponse(false);
    const { next } = createNext();

    requestSignalMiddleware(req, res, next);
    res.emit('close');

    expect((req as unknown as { signal: AbortSignal }).signal.aborted).toBe(true);
  });

  it('does not abort the signal when res closes after it is finished', () => {
    const req = createRequest();
    const res = createResponse(true);
    const { next } = createNext();

    requestSignalMiddleware(req, res, next);
    res.emit('close');

    expect((req as unknown as { signal: AbortSignal }).signal.aborted).toBe(false);
  });

  it('aborts the signal when req closes before it is complete', () => {
    const req = createRequest(false);
    const res = createResponse(false);
    const { next } = createNext();

    requestSignalMiddleware(req, res, next);
    req.emit('close');

    expect((req as unknown as { signal: AbortSignal }).signal.aborted).toBe(true);
  });

  it('does not abort the signal when req closes after it is complete', () => {
    const req = createRequest(true);
    const res = createResponse(false);
    const { next } = createNext();

    requestSignalMiddleware(req, res, next);
    req.emit('close');

    expect((req as unknown as { signal: AbortSignal }).signal.aborted).toBe(false);
  });
});
