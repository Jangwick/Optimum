import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';

describe('Dashboard endpoint', () => {
  let agent: request.Agent;

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
    const body = res.body as Record<string, unknown>;
    const counts = body.counts as Record<string, unknown>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);

    expect(counts).toEqual(
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

    expect(counts.averageCycleTime === null || typeof counts.averageCycleTime === 'number').toBe(true);

    const monthlyVolume = body.monthlyVolume as Array<Record<string, unknown>>;
    const weeklyVolume = body.weeklyVolume as Array<Record<string, unknown>>;
    const agingBuckets = body.agingBuckets as Array<Record<string, unknown>>;
    const statusBreakdown = body.statusBreakdown as Array<Record<string, unknown>>;
    const recentClaims = body.recentClaims as Array<Record<string, unknown>>;
    const openTasksList = body.openTasksList as Array<Record<string, unknown>>;
    const pendingInspectionsList = body.pendingInspectionsList as Array<Record<string, unknown>>;
    const recentActivity = body.recentActivity as Array<Record<string, unknown>>;

    expect(Array.isArray(monthlyVolume)).toBe(true);
    expect(monthlyVolume.length).toBeLessThanOrEqual(12);
    expect(Array.isArray(weeklyVolume)).toBe(true);
    expect(weeklyVolume.length).toBeLessThanOrEqual(12);
    expect(Array.isArray(agingBuckets)).toBe(true);
    expect(Array.isArray(statusBreakdown)).toBe(true);
    expect(Array.isArray(recentClaims)).toBe(true);
    expect(Array.isArray(openTasksList)).toBe(true);
    expect(Array.isArray(pendingInspectionsList)).toBe(true);
    expect(Array.isArray(recentActivity)).toBe(true);

    if (monthlyVolume.length > 0) {
      const first = monthlyVolume[0]!;
      expect(first).toHaveProperty('label');
      expect(first).toHaveProperty('claims');
      expect(first).toHaveProperty('estimatedLoss');
    }

    if (agingBuckets.length > 0) {
      const first = agingBuckets[0]!;
      expect(first).toHaveProperty('label');
      expect(first).toHaveProperty('count');
    }
  }, 30000);
});
