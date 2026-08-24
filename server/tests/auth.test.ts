import request from 'supertest';
import app from '../src/app.js';
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
});
