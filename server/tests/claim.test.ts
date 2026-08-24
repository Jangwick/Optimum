import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';
import bcrypt from 'bcrypt';

let policyId: number;
let engineerId: number;
let accountantId: number;

describe('Claims endpoints', () => {
  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/claims creates a claim', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });
    expect(loginRes.statusCode).toBe(200);

    const res = await agent.post('/api/claims').send({
      policyId,
      claimTypeId: 1,
      description: 'Test claim from integration suite',
      dateOfLoss: '2026-08-15T00:00:00.000Z',
      estimatedLoss: 1000,
      reserve: 1200,
      engineerId,
      accountantId,
    });
    const body = res.body as Record<string, unknown>;
    const item = body.item as Record<string, unknown>;
    expect(res.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(item.claimNumber).toMatch(/^CS-/);
  });

  it('GET /api/claims returns role-scoped list', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'engineer@optimum.com', password: 'ChangeMe123!' });
    const res = await agent.get('/api/claims');
    const body = res.body as Record<string, unknown>;
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.items)).toBe(true);
  });
});
