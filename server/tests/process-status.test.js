import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';
import bcrypt from 'bcrypt';

let policyId;
let claimId;
let engineerId;
let accountantId;

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

  // Ensure process statuses exist
  const processStatuses = [
    { name: 'Received', code: 'RECEIVED', color: '#767683', isTerminal: false, sortOrder: 10 },
    { name: 'Assigned', code: 'ASSIGNED', color: '#4958ab', isTerminal: false, sortOrder: 20 },
    { name: 'Under Investigation', code: 'UNDER_INVESTIGATION', color: '#f26522', isTerminal: false, sortOrder: 30 },
    { name: 'Closed', code: 'CLOSED', color: '#28a745', isTerminal: true, sortOrder: 120 },
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

async function loginAsAdmin(agent) {
  const res = await agent.post('/api/auth/login').send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });
  expect(res.statusCode).toBe(200);
}

async function createTestClaim(agent) {
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
  expect(res.statusCode).toBe(201);
  return res.body.item;
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
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThanOrEqual(4);
    const codes = res.body.items.map((s) => s.code);
    expect(codes).toContain('RECEIVED');
    expect(codes).toContain('CLOSED');
  });

  it('POST /api/claims creates a claim with processStatus RECEIVED', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const item = await createTestClaim(agent);
    claimId = item.id;
    expect(item.processStatus).toBeTruthy();
    expect(item.processStatus.code).toBe('RECEIVED');
  });

  it('PATCH /api/claims/:id/process-status transitions from RECEIVED to ASSIGNED', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'ASSIGNED',
      notes: 'Engineer assigned',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.item.processStatus.code).toBe('ASSIGNED');
  });

  it('PATCH /api/claims/:id/process-status rejects invalid transition', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    // ASSIGNED -> SETTLED is not a valid direct transition
    const res = await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'SETTLED',
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
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2); // RECEIVED + ASSIGNED
  });

  it('GET /api/claims/:id/closing-guards returns guard status', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.get(`/api/claims/${claimId}/closing-guards`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.item).toHaveProperty('canClose');
    expect(res.body.item).toHaveProperty('reasons');
    expect(Array.isArray(res.body.item.reasons)).toBe(true);
  });

  it('PATCH /api/claims/:id/process-status to CLOSED is blocked by guards', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    // Move to a status that can transition to CLOSED
    await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'UNDER_INVESTIGATION',
      notes: 'Investigation started',
    });
    // Try to close without meeting guards
    const res = await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'CLOSED',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/close/i);
  });

  it('PATCH /api/claims/:id/process-status to CLOSED succeeds with override', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.patch(`/api/claims/${claimId}/process-status`).send({
      statusCode: 'CLOSED',
      isOverride: true,
      overrideReason: 'Test override — closing without report for test purposes',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.item.processStatus.code).toBe('CLOSED');
    expect(res.body.item.isClosed).toBe(true);
  });

  it('GET /api/claims includes processStatus in list items', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.get('/api/claims');
    expect(res.statusCode).toBe(200);
    const item = res.body.items.find((c) => c.id === claimId);
    expect(item).toBeTruthy();
    expect(item.processStatus).toBeTruthy();
  });

  it('GET /api/claims/:id includes processStatus and processHistory', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.get(`/api/claims/${claimId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.item.processStatus).toBeTruthy();
    expect(Array.isArray(res.body.item.processHistory)).toBe(true);
    expect(res.body.item.processHistory.length).toBeGreaterThan(0);
  });
});
