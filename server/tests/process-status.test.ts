import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';
import bcrypt from 'bcrypt';

let policyId: number;
let claimId: number;
let engineerId: number;
let accountantId: number;

async function ensureSeed() {
  const [adminRole, engineerRole, accountantRole] = await Promise.all([
    prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN', description: 'Administrator' } }),
    prisma.role.upsert({ where: { name: 'ENGINEER' }, update: {}, create: { name: 'ENGINEER', description: 'Field Engineer' } }),
    prisma.role.upsert({ where: { name: 'ACCOUNTANT' }, update: {}, create: { name: 'ACCOUNTANT', description: 'Accountant' } }),
  ]);

  const passwordHash = await bcrypt.hash('ChangeMe123!', Number(process.env.BCRYPT_ROUNDS || 12));

  await prisma.user.upsert({
    where: { email: 'admin@optimum.com' },
    update: {},
    create: { email: 'admin@optimum.com', passwordHash, firstName: 'System', lastName: 'Administrator', employeeNumber: 'ADM-001', roleId: adminRole.id, isActive: true },
  });

  const engineer = await prisma.user.upsert({
    where: { email: 'engineer@optimum.com' },
    update: {},
    create: { email: 'engineer@optimum.com', passwordHash, firstName: 'Field', lastName: 'Engineer', employeeNumber: 'ENG-001', roleId: engineerRole.id, isActive: true },
  });
  engineerId = engineer.id;

  const accountant = await prisma.user.upsert({
    where: { email: 'accountant@optimum.com' },
    update: {},
    create: { email: 'accountant@optimum.com', passwordHash, firstName: 'Senior', lastName: 'Accountant', employeeNumber: 'ACC-001', roleId: accountantRole.id, isActive: true },
  });
  accountantId = accountant.id;

  // Ensure 18-stage process statuses exist
  const processStatuses = [
    { name: 'New Claim', code: 'NEW_CLAIM', color: '#767683', isTerminal: false, sortOrder: 10 },
    { name: 'Claim Assigned', code: 'CLAIM_ASSIGNED', color: '#4958ab', isTerminal: false, sortOrder: 20 },
    { name: 'Initial Review', code: 'INITIAL_REVIEW', color: '#4958ab', isTerminal: false, sortOrder: 30 },
    { name: 'Under Investigation', code: 'UNDER_INVESTIGATION', color: '#f26522', isTerminal: false, sortOrder: 60 },
    { name: 'Claim Settled', code: 'CLAIM_SETTLED', color: '#28a745', isTerminal: false, sortOrder: 170 },
    { name: 'Claim Closed', code: 'CLAIM_CLOSED', color: '#28a745', isTerminal: true, sortOrder: 180 },
  ];
  for (const p of processStatuses) {
    await prisma.processStatus.upsert({ where: { code: p.code }, update: p, create: p });
  }

  // Ensure claim statuses exist
  const claimStatuses = [
    { name: 'New', code: 'NEW', color: '#767683', isTerminal: false, sortOrder: 10 },
    { name: 'Closed', code: 'CLOSED', color: '#28a745', isTerminal: true, sortOrder: 180 },
  ];
  for (const s of claimStatuses) {
    await prisma.claimStatus.upsert({ where: { code: s.code }, update: s, create: s });
  }

  const insurer = await prisma.insuranceCompany.upsert({
    where: { code: 'TEST-INS' },
    update: {},
    create: { name: 'Test Insurer', code: 'TEST-INS', email: 'ins@test.com', phone: '111' },
  });

  const client = await prisma.client.upsert({
    where: { code: 'TEST-CLI' },
    update: {},
    create: { name: 'Test Client', code: 'TEST-CLI', email: 'client@test.com', phone: '222' },
  });

  const claimType = await prisma.claimType.upsert({
    where: { code: 'PROPERTY_DAMAGE' },
    update: {},
    create: { name: 'Property Damage', code: 'PROPERTY_DAMAGE' },
  });

  const policy = await prisma.policy.upsert({
    where: { policyNumber: 'POL-TEST-0001' },
    update: {},
    create: {
      policyNumber: 'POL-TEST-0001',
      clientId: client.id,
      insuranceCompanyId: insurer.id,
      claimTypeId: claimType.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      premium: 1000,
      sumInsured: 100000,
    },
  });
  policyId = policy.id;
}

async function loginAsAdmin(agent: request.Agent) {
  const res = await agent.post('/api/auth/login').send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });
  expect(res.statusCode).toBe(200);
}

async function createTestClaim(agent: request.Agent) {
  const res = await agent.post('/api/claims').send({
    policyId,
    claimTypeId: 1,
    description: 'Process status test claim',
    dateOfLoss: '2026-08-15T00:00:00.000Z',
    estimatedLoss: 1000,
    reserve: 1200,
    engineerId,
    accountantId,
  });
  const body = res.body as Record<string, unknown>;
  expect(res.statusCode).toBe(201);
  return body.item as Record<string, unknown>;
}

describe('Process status endpoints', () => {
  beforeAll(async () => {
    await ensureSeed();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/process-statuses lists all process statuses', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.get('/api/process-statuses');
    const body = res.body as Record<string, unknown>;
    const items = body.items as Array<Record<string, unknown>>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(6);
    const codes = items.map((s) => s.code as string);
    expect(codes).toContain('NEW_CLAIM');
    expect(codes).toContain('CLAIM_CLOSED');
  });

  it('POST /api/claims creates a claim with processStatus NEW_CLAIM', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const item = await createTestClaim(agent);
    claimId = item.id as number;
    const processStatus = item.processStatus as Record<string, unknown>;
    expect(processStatus).toBeTruthy();
    expect(processStatus.code).toBe('NEW_CLAIM');
  });

  it('PATCH /api/claims/:id/process-status transitions from NEW_CLAIM to CLAIM_ASSIGNED', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'CLAIM_ASSIGNED',
      notes: 'Engineer assigned',
    });
    const body = res.body as Record<string, unknown>;
    const item = body.item as Record<string, unknown>;
    const processStatus = item.processStatus as Record<string, unknown>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(processStatus.code).toBe('CLAIM_ASSIGNED');
  });

  it('PATCH /api/claims/:id/process-status rejects invalid transition', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    // CLAIM_ASSIGNED -> CLAIM_SETTLED is not a valid direct transition
    const res = await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'CLAIM_SETTLED',
    });
    expect(res.statusCode).toBe(400);
  });

  it('PATCH /api/claims/:id/process-status rejects non-admin', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'engineer@optimum.com', password: 'ChangeMe123!' });
    const res = await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'UNDER_INVESTIGATION',
    });
    expect(res.statusCode).toBe(403);
  });

  it('GET /api/claims/:id/process-status-history returns history', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.get(`/api/claims/${claimId}/process-status-history`);
    const body = res.body as Record<string, unknown>;
    const items = body.items as Array<Record<string, unknown>>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(2); // NEW_CLAIM + CLAIM_ASSIGNED
  });

  it('GET /api/claims/:id/closing-guards returns guard status', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.get(`/api/claims/${claimId}/closing-guards`);
    const body = res.body as Record<string, unknown>;
    const item = body.item as Record<string, unknown>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(item).toHaveProperty('canClose');
    expect(item).toHaveProperty('reasons');
    expect(Array.isArray(item.reasons)).toBe(true);
  });

  it('PATCH /api/claims/:id/process-status to CLAIM_CLOSED is blocked by guards', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    // Move to a status that can transition to CLAIM_CLOSED
    await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'UNDER_INVESTIGATION',
      notes: 'Investigation started',
      isOverride: true,
      overrideReason: 'Test skip to investigation',
    });
    // Try to close without meeting guards
    const res = await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'CLAIM_CLOSED',
    });
    const body = res.body as Record<string, unknown>;
    expect(res.statusCode).toBe(400);
    expect(body.error).toMatch(/close/i);
  });

  it('PATCH /api/claims/:id/process-status to CLAIM_CLOSED succeeds with override', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'CLAIM_CLOSED',
      isOverride: true,
      overrideReason: 'Test override — closing without report for test purposes',
    });
    const body = res.body as Record<string, unknown>;
    const item = body.item as Record<string, unknown>;
    const processStatus = item.processStatus as Record<string, unknown>;
    expect(res.statusCode).toBe(200);
    expect(processStatus.code).toBe('CLAIM_CLOSED');
    expect(item.isClosed).toBe(true);
  });

  it('GET /api/claims includes processStatus in list items', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.get('/api/claims');
    const body = res.body as Record<string, unknown>;
    const items = body.items as Array<Record<string, unknown>>;
    expect(res.statusCode).toBe(200);
    const item = items.find((c) => (c.id as number) === claimId);
    expect(item).toBeTruthy();
    const found = item as Record<string, unknown>;
    expect(found.processStatus).toBeTruthy();
  });

  it('GET /api/claims/:id includes processStatus and processHistory', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.get(`/api/claims/${claimId}`);
    const body = res.body as Record<string, unknown>;
    const item = body.item as Record<string, unknown>;
    const processStatus = item.processStatus as Record<string, unknown>;
    const processHistory = item.processHistory as Array<Record<string, unknown>>;
    expect(res.statusCode).toBe(200);
    expect(processStatus).toBeTruthy();
    expect(Array.isArray(processHistory)).toBe(true);
    expect(processHistory.length).toBeGreaterThan(0);
  });
});
