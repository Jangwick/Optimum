import { describe, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { config } from '../src/config/index.js';
import { prisma } from '../src/db/client.js';

describe('Auth endpoints', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    const body = res.body as Record<string, unknown>;
    expect(res.statusCode).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('POST /api/auth/login returns the admin user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });
    const body = res.body as Record<string, unknown>;
    const user = body.user as Record<string, unknown>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(user.role).toBe('ADMIN');
  });

  it('POST /api/auth/login rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@optimum.com', password: 'wrong' });
    const body = res.body as Record<string, unknown>;
    expect(res.statusCode).toBe(401);
    expect(body.success).toBe(false);
  });

  it('does not rate-limit different accounts logging in from the same IP', async () => {
    const originalEnv = config.nodeEnv;
    config.nodeEnv = 'production';
    try {
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('X-Forwarded-For', '10.0.0.1')
          .send({ email: `distinct-user-${i}@example.com`, password: 'wrong' });
        expect(res.statusCode).toBe(401);
      }
    } finally {
      config.nodeEnv = originalEnv;
    }
  });

  it('rate-limits repeated failed attempts for the same account', async () => {
    const originalEnv = config.nodeEnv;
    config.nodeEnv = 'production';
    try {
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('X-Forwarded-For', '10.0.0.2')
          .send({ email: 'attacker@example.com', password: 'wrong' });
        expect(res.statusCode).toBe(401);
      }
      const res = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '10.0.0.2')
        .send({ email: 'attacker@example.com', password: 'wrong' });
      expect(res.statusCode).toBe(429);
    } finally {
      config.nodeEnv = originalEnv;
    }
  });
});
