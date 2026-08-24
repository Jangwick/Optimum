import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';

describe('Dashboard endpoint', () => {
  let agent;

  beforeAll(async () => {
    agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });
    expect(loginRes.statusCode).toBe(200);
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
  }, 30000);

  it('GET /api/dashboard returns the new KPI payload', async () => {
    const res = await agent.get('/api/dashboard');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    expect(res.body.counts).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        active: expect.any(Number),
        estimated: expect.any(Number),
        reserve: expect.any(Number),
        openTasks: expect.any(Number),
        overdueTasks: expect.any(Number),
        readOnly: expect.any(Number),
        cancelled: expect.any(Number),
        pendingInspections: expect.any(Number),
        settledMTD: expect.any(Number),
        settledMTDCount: expect.any(Number),
      })
    );

    expect(res.body.counts.averageCycleTime === null || typeof res.body.counts.averageCycleTime === 'number').toBe(true);

    expect(Array.isArray(res.body.monthlyVolume)).toBe(true);
    expect(res.body.monthlyVolume.length).toBeLessThanOrEqual(12);
    expect(Array.isArray(res.body.weeklyVolume)).toBe(true);
    expect(res.body.weeklyVolume.length).toBeLessThanOrEqual(12);
    expect(Array.isArray(res.body.agingBuckets)).toBe(true);
    expect(Array.isArray(res.body.statusBreakdown)).toBe(true);
    expect(Array.isArray(res.body.recentClaims)).toBe(true);
    expect(Array.isArray(res.body.openTasksList)).toBe(true);
    expect(Array.isArray(res.body.pendingInspectionsList)).toBe(true);
    expect(Array.isArray(res.body.recentActivity)).toBe(true);

    if (res.body.monthlyVolume.length > 0) {
      const first = res.body.monthlyVolume[0];
      expect(first).toHaveProperty('label');
      expect(first).toHaveProperty('claims');
      expect(first).toHaveProperty('estimatedLoss');
    }

    if (res.body.agingBuckets.length > 0) {
      const first = res.body.agingBuckets[0];
      expect(first).toHaveProperty('label');
      expect(first).toHaveProperty('count');
    }
  }, 30000);
});
