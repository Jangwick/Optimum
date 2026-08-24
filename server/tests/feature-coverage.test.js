import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';
import bcrypt from 'bcrypt';

let policyId;
let claimId;
let testUserId;

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

async function loginAsAdmin(agent) {
  const res = await agent.post('/api/auth/login').send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });
  expect(res.statusCode).toBe(200);
}

async function createTestClaim(agent) {
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
  expect(res.statusCode).toBe(201);
  return res.body.item;
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
    claimId = claim.id;

    const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
    const res = await agent
      .post(`/api/claims/${claimId}/documents`)
      .field('documentCategoryId', '1')
      .field('description', 'Test PDF')
      .attach('file', pdf, 'test.pdf');

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.item.originalName).toBe('test.pdf');
    expect(res.body.item.mimeType).toBe('application/pdf');
  });

  it('GET /api/claims/:claimId/documents returns the checklist', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.get(`/api/claims/${claimId}/documents`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('POST /api/claims/:claimId/documents rejects an unsupported file type', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const exe = Buffer.from('MZ header fake executable');
    const res = await agent
      .post(`/api/claims/${claimId}/documents`)
      .attach('file', exe, 'malicious.exe');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/claims/:claimId/documents rejects a mismatched file signature', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const fake = Buffer.from('this is not a pdf');
    const res = await agent
      .post(`/api/claims/${claimId}/documents`)
      .attach('file', fake, 'fake.pdf');

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
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

    const res = await agent.post(`/api/claims/${claim.id}/reports`).send({
      title: 'Initial Report',
      notes: 'Draft notes',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.item.title).toBe('Initial Report');
    expect(res.body.item.status).toBe('DRAFT');
  });

  it('GET /api/claims/:claimId/reports lists reports', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const claim = await createTestClaim(agent);

    await agent.post(`/api/claims/${claim.id}/reports`).send({ title: 'List Test', notes: '' });
    const res = await agent.get(`/api/claims/${claim.id}/reports`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/claims/:claimId/reports returns 404 for an unknown claim', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);
    const res = await agent.post('/api/claims/999999/reports').send({ title: 'Nope', notes: '' });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
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

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe('ENGINEER');
  });

  it('PUT /api/users/:id changes a user role', async () => {
    const agent = request.agent(app);
    await loginAsAdmin(agent);

    const res = await agent.put(`/api/users/${testUserId}`).send({
      role: 'ACCOUNTANT',
      department: 'Finance',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('ACCOUNTANT');
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
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('ACCOUNTANT');
  });
});
