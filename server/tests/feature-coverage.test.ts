import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';
import bcrypt from 'bcrypt';

let policyId: number;
let claimId: number;
let testUserId: number;

async function ensureTestData() {
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

  await prisma.user.upsert({
    where: { email: 'engineer@optimum.com' },
    update: {},
    create: { email: 'engineer@optimum.com', passwordHash, firstName: 'Field', lastName: 'Engineer', employeeNumber: 'ENG-001', roleId: engineerRole.id, isActive: true },
  });

  await prisma.user.upsert({
    where: { email: 'accountant@optimum.com' },
    update: {},
    create: { email: 'accountant@optimum.com', passwordHash, firstName: 'Senior', lastName: 'Accountant', employeeNumber: 'ACC-001', roleId: accountantRole.id, isActive: true },
  });

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

  const testUser = await prisma.user.upsert({
    where: { email: 'test.user@optimum.com' },
    update: {},
    create: { email: 'test.user@optimum.com', passwordHash, firstName: 'Test', lastName: 'User', employeeNumber: 'TST-001', roleId: engineerRole.id, isActive: true },
  });
  testUserId = testUser.id;
}

async function loginAsAdmin(agent: request.Agent) {
  const res = await agent.post('/api/auth/login').send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });
  expect(res.statusCode).toBe(200);
}

async function createTestClaim(agent: request.Agent) {
  const res = await agent.post('/api/claims').send({
    policyId,
    claimTypeId: 1,
    description: 'Integration test claim',
    dateOfLoss: '2026-08-15T00:00:00.000Z',
    estimatedLoss: 1000,
    reserve: 1200,
    engineerId: testUserId,
    accountantId: testUserId,
  });
  const body = res.body as Record<string, unknown>;
  expect(res.statusCode).toBe(201);
  return body.item as Record<string, unknown>;
}

describe('Document endpoints', () => {
  beforeAll(async () => {
    await ensureTestData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/claims/:claimId/documents uploads a PDF', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const claim = await createTestClaim(agent);
    claimId = claim.id as number;

    const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
    const res = await agent
      .post(`/api/claims/${claimId}/documents`)
      .field('documentCategoryId', '1')
      .field('description', 'Test PDF')
      .attach('file', pdf, 'test.pdf');

    const body = res.body as Record<string, unknown>;
    const item = body.item as Record<string, unknown>;
    expect(res.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(item.originalName).toBe('test.pdf');
    expect(item.mimeType).toBe('application/pdf');
  });

  it('GET /api/claims/:claimId/documents returns the checklist', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.get(`/api/claims/${claimId}/documents`);

    const body = res.body as Record<string, unknown>;
    const items = body.items as Array<Record<string, unknown>>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(items)).toBe(true);
  });

  it('POST /api/claims/:claimId/documents rejects an unsupported file type', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const exe = Buffer.from('MZ header fake executable');
    const res = await agent
      .post(`/api/claims/${claimId}/documents`)
      .attach('file', exe, 'malicious.exe');

    const body = res.body as Record<string, unknown>;
    expect(res.statusCode).toBe(400);
    expect(body.success).toBe(false);
  });

  it('POST /api/claims/:claimId/documents rejects a mismatched file signature', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const fake = Buffer.from('this is not a pdf');
    const res = await agent
      .post(`/api/claims/${claimId}/documents`)
      .attach('file', fake, 'fake.pdf');

    const body = res.body as Record<string, unknown>;
    expect(res.statusCode).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('Report endpoints', () => {
  beforeAll(async () => {
    await ensureTestData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/claims/:claimId/reports creates a report draft', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const claim = await createTestClaim(agent);

    const res = await agent.post(`/api/claims/${claim.id as number}/reports`).send({
      title: 'Initial Report',
      notes: 'Draft notes',
    });

    const body = res.body as Record<string, unknown>;
    const item = body.item as Record<string, unknown>;
    expect(res.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(item.title).toBe('Initial Report');
    expect(item.status).toBe('DRAFT');
  });

  it('GET /api/claims/:claimId/reports lists reports', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const claim = await createTestClaim(agent);

    await agent.post(`/api/claims/${claim.id as number}/reports`).send({ title: 'List Test', notes: '' });
    const res = await agent.get(`/api/claims/${claim.id as number}/reports`);

    const body = res.body as Record<string, unknown>;
    const items = body.items as Array<Record<string, unknown>>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/claims/:claimId/reports returns 404 for an unknown claim', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.post('/api/claims/999999/reports').send({ title: 'Nope', notes: '' });

    const body = res.body as Record<string, unknown>;
    expect(res.statusCode).toBe(404);
    expect(body.success).toBe(false);
  });
});

describe('User endpoints', () => {
  beforeAll(async () => {
    await ensureTestData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/users creates a user', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);

    const email = `new.user.${Date.now()}@optimum.com`;
    const res = await agent.post('/api/users').send({
      email,
      firstName: 'New',
      lastName: 'User',
      role: 'ENGINEER',
      employeeNumber: `NEW-${Date.now()}`,
    });

    const body = res.body as Record<string, unknown>;
    const user = body.user as Record<string, unknown>;
    expect(res.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(user.email).toBe(email);
    expect(user.role).toBe('ENGINEER');
  });

  it('PUT /api/users/:id changes a user role', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);

    const res = await agent.put(`/api/users/${testUserId}`).send({
      role: 'ACCOUNTANT',
      department: 'Finance',
    });

    const body = res.body as Record<string, unknown>;
    const user = body.user as Record<string, unknown>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(user.role).toBe('ACCOUNTANT');
  });

  it('PUT /api/users/:id ignores role changes from non-admin users', async () => {
    const agent = request.agent(app);
    // login as the test user whose role was just changed to ACCOUNTANT
    const login = await agent.post('/api/auth/login').send({ email: 'test.user@optimum.com', password: 'ChangeMe123!' });
    expect(login.statusCode).toBe(200);

    const res = await agent.put(`/api/users/${testUserId}`).send({
      role: 'ADMIN',
    });

    // Non-admins cannot update role; the field is stripped and the request is a no-op
    const body = res.body as Record<string, unknown>;
    const user = body.user as Record<string, unknown>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(user.role).toBe('ACCOUNTANT');
  });
});
