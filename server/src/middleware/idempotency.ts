import type { Request, Response, NextFunction } from 'express';

type IdempotencyResult = {
  status: number;
  body: unknown;
  json: boolean;
};

// LIMIT: single-process in-memory cache. For multi-instance deployments, swap
// this Map for a Redis-backed store or a shared cache so idempotency keys survive
// restarts and work across replicas.
const TTL_MS = 5 * 60 * 1000;
const pending = new Map<string, Promise<IdempotencyResult>>();
const cache = new Map<string, { result: IdempotencyResult; expiresAt: number }>();

function cacheKey(req: Request): string | null {
  const key = req.headers['idempotency-key'];
  if (!key || Array.isArray(key)) return null;
  // Scope the key to the exact method and route so a key cannot be replayed
  // across different endpoints.
  return `${req.method}:${req.baseUrl}${req.path}:${key}`;
}

function captureResponse(
  res: Response,
  finish: (result: IdempotencyResult) => void,
  reject: (err: unknown) => void
) {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  let captured: { status: number; body: unknown; json: boolean } | null = null;
  let jsonBody: unknown = undefined;

  res.json = function json(body: unknown) {
    jsonBody = body;
    captured = { status: res.statusCode, body, json: true };
    return originalJson(body);
  };

  res.send = function send(body: unknown) {
    // If res.json called us, it is sending the JSON string we just produced.
    // Avoid double-capturing the serialized form; the res.json capture is enough.
    if (jsonBody !== undefined && body === JSON.stringify(jsonBody)) {
      jsonBody = undefined;
      return originalSend(body);
    }
    captured = { status: res.statusCode, body, json: false };
    return originalSend(body);
  };

  res.once('finish', () => {
    if (captured) {
      finish({ status: captured.status, body: captured.body, json: captured.json });
    } else {
      finish({ status: res.statusCode, body: null, json: false });
    }
  });
  res.once('error', reject);
}

function sendResult(res: Response, result: IdempotencyResult) {
  if (result.json) {
    res.status(result.status).json(result.body);
  } else if (result.body !== null) {
    res.status(result.status).send(result.body);
  } else {
    res.status(result.status).end();
  }
}

/**
 * Express middleware that implements idempotency for mutating endpoints.
 * Clients must supply a unique `Idempotency-Key` header. The first request
 * with a key runs to completion and its response is cached for a short TTL.
 * Duplicate requests with the same key receive the cached response without
 * re-executing the route (or wait for the in-flight request to finish).
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = cacheKey(req);
  if (!key) return next();

  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    sendResult(res, cached.result);
    return;
  }

  const inFlight = pending.get(key);
  if (inFlight) {
    inFlight
      .then((result) => sendResult(res, result))
      .catch((err) => next(err));
    return;
  }

  const promise = new Promise<IdempotencyResult>((resolve, reject) => {
    captureResponse(res, resolve, reject);
    next();
  });
  pending.set(key, promise);

  promise
    .then((result) => {
      pending.delete(key);
      if (result.status < 500) {
        cache.set(key, { result, expiresAt: Date.now() + TTL_MS });
      }
    })
    .catch(() => {
      pending.delete(key);
    });
}
