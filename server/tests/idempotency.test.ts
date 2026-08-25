import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { idempotencyMiddleware } from '../src/middleware/idempotency.js';

describe('idempotency middleware', () => {
  let counter: number;
  let app: express.Express;

  beforeEach(() => {
    counter = 0;
    app = express();
    app.use(express.json());
    app.post('/test', idempotencyMiddleware, (_req: Request, res: Response) => {
      counter += 1;
      res.status(201).json({ id: counter });
    });
  });

  it('caches the response for a duplicate Idempotency-Key', async () => {
    const first = await request(app).post('/test').set('Idempotency-Key', 'key-1').send({});
    expect(first.status).toBe(201);
    expect(first.body).toEqual({ id: 1 });

    const second = await request(app).post('/test').set('Idempotency-Key', 'key-1').send({});
    expect(second.status).toBe(201);
    expect(second.body).toEqual({ id: 1 });

    expect(counter).toBe(1);
  });

  it('processes distinct keys independently', async () => {
    const first = await request(app).post('/test').set('Idempotency-Key', 'key-a').send({});
    expect(first.body).toEqual({ id: 1 });

    const second = await request(app).post('/test').set('Idempotency-Key', 'key-b').send({});
    expect(second.body).toEqual({ id: 2 });

    expect(counter).toBe(2);
  });

  it('does not cache 5xx errors', async () => {
    const failApp = express();
    failApp.use(express.json());
    failApp.post('/test', idempotencyMiddleware, (_req: Request, res: Response) => {
      counter += 1;
      res.status(500).json({ error: 'boom' });
    });

    const first = await request(failApp).post('/test').set('Idempotency-Key', 'err-1').send({});
    expect(first.status).toBe(500);
    expect(counter).toBe(1);

    const second = await request(failApp).post('/test').set('Idempotency-Key', 'err-1').send({});
    expect(second.status).toBe(500);
    expect(counter).toBe(2);
  });
});
