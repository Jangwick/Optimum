import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';
import bcrypt from 'bcrypt';

let engineerId;
let accountantId;

describe('Search endpoints', () => {
  let adminId;

  beforeAll(async () => {
    const [adminRole, engineerRole, accountantRole] = await Promise.all([
      prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN', description: 'Administrator' } }),
      prisma.role.upsert({ where: { name: 'ENGINEER' }, update: {}, create: { name: 'ENGINEER', description: 'Field Engineer' } }),
      prisma.role.upsert({ where: { name: 'ACCOUNTANT' }, update: {}, create: { name: 'ACCOUNTANT', description: 'Accountant' } }),
    ]);

    const passwordHash = await bcrypt.hash('ChangeMe123!', Number(process.env.BCRYPT_ROUNDS || 12));

    const admin = await prisma.user.upsert({
      where: { email: 'admin@optimum.com' },
      update: {},
      create: { email: 'admin@optimum.com', passwordHash, firstName: 'System', lastName: 'Administrator', employeeNumber: 'ADM-001', roleId: adminRole.id, isActive: true },
    });
    adminId = admin.id;

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
        policyType: 'Property',
      },
    });
    const newStatus = await prisma.claimStatus.upsert({
      where: { code: 'NEW' },
      update: {},
      create: { name: 'New', code: 'NEW' },
    });

    await prisma.claim.upsert({
      where: { claimNumber: 'CS-SEARCH-0001' },
      update: {},
      create: {
        claimNumber: 'CS-SEARCH-0001',
        policyId: policy.id,
        claimTypeId: claimType.id,
        clientId: client.id,
        insuranceCompanyId: insurer.id,
        description: 'Search test claim',
        dateOfLoss: new Date('2026-08-15'),
        estimatedLoss: 1000,
        reserve: 1200,
        engineerId,
        accountantId,
        statusId: newStatus.id,
        createdById: adminId,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/search requires authentication', async () => {
    const res = await request(app).get('/api/search?q=test');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/search returns grouped client results for admin', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });
    expect(loginRes.statusCode).toBe(200);

    const res = await agent.get('/api/search?q=Test%20Client&limit=3');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.query).toBe('Test Client');
    expect(res.body.limit).toBe(3);
    expect(res.body.groups).toBeDefined();

    const { claims, clients, policies, users } = res.body.groups;
    expect(Array.isArray(claims)).toBe(true);
    expect(Array.isArray(clients)).toBe(true);
    expect(Array.isArray(policies)).toBe(true);
    expect(Array.isArray(users)).toBe(true);

    // Client result
    expect(clients.some((c) => c.type === 'client' && c.title === 'Test Client')).toBe(true);
  });

  it('GET /api/search returns grouped claim results for admin', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });
    expect(loginRes.statusCode).toBe(200);

    const res = await agent.get('/api/search?q=CS-SEARCH&limit=3');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.query).toBe('CS-SEARCH');

    const { claims, clients } = res.body.groups;
    expect(claims.some((c) => c.type === 'claim' && c.title === 'CS-SEARCH-0001')).toBe(true);
    expect(clients.length).toBe(0);
  });

  it('GET /api/search returns users only for admin', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });

    const res = await agent.get('/api/search?q=Field&limit=3');
    expect(res.statusCode).toBe(200);
    expect(res.body.groups.users.length).toBeGreaterThanOrEqual(1);
    expect(res.body.groups.users[0]).toMatchObject({ type: 'user', title: 'Field Engineer' });
  });

  it('GET /api/search does not return users for non-admin', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'engineer@optimum.com', password: 'ChangeMe123!' });

    const res = await agent.get('/api/search?q=Field&limit=3');
    expect(res.statusCode).toBe(200);
    expect(res.body.groups.claims.length).toBeGreaterThanOrEqual(0);
    expect(res.body.groups.users).toEqual([]);
  });
});
