import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';
import bcrypt from 'bcrypt';

let claimId: number;
let token: string;

async function ensureSeed() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator' },
  });

  const passwordHash = await bcrypt.hash('ChangeMe123!', Number(process.env.BCRYPT_ROUNDS || 12));

  await prisma.user.upsert({
    where: { email: 'admin@optimum.com' },
    update: {},
    create: {
      email: 'admin@optimum.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      employeeNumber: 'ADM-001',
      roleId: adminRole.id,
      isActive: true,
    },
  });

  // Ensure a claim status exists
  const status = await prisma.claimStatus.findFirst({ where: { code: 'NEW' } });
  if (!status) throw new Error('NEW claim status not found — run prisma db seed first');

  // Create or find a claim for testing
  let claim = await prisma.claim.findFirst({ where: { claimNumber: 'TEST-DN-001' } });
  if (!claim) {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@optimum.com' } });
    if (!admin) throw new Error('Admin user not found');
    claim = await prisma.claim.create({
      data: {
        claimNumber: 'TEST-DN-001',
        statusId: status.id,
        createdById: admin.id,
      },
    });
  }
  claimId = claim.id;
}

async function login() {
  const res = await request(app).post('/api/auth/login').send({
    email: 'admin@optimum.com',
    password: 'ChangeMe123!',
  });
  const body = res.body as Record<string, unknown>;
  token = body.token as string;
}

beforeAll(async () => {
  await ensureSeed();
  await login();
});

afterAll(async () => {
  // Clean up test discussion notes
  await prisma.discussionNote.deleteMany({
    where: { claimId },
  });
  await prisma.$disconnect();
});

describe('Discussion Notes API', () => {
  let noteId: number;

  it('creates a discussion note', async () => {
    const res = await request(app)
      .post(`/api/claims/${claimId}/discussion-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        partyType: 'INSURED',
        partyName: 'Test Insured',
        notes: 'Discussed claim details',
        nextAction: 'Schedule inspection',
      });

    const body = res.body as Record<string, unknown>;
    const item = body.item as Record<string, unknown>;
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(item.partyType).toBe('INSURED');
    expect(item.partyName).toBe('Test Insured');
    expect(item.notes).toBe('Discussed claim details');
    expect(item.nextAction).toBe('Schedule inspection');
    noteId = item.id as number;
  });

  it('lists discussion notes', async () => {
    const res = await request(app)
      .get(`/api/claims/${claimId}/discussion-notes`)
      .set('Authorization', `Bearer ${token}`);

    const body = res.body as Record<string, unknown>;
    const items = body.items as Array<Record<string, unknown>>;
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it('deletes a discussion note', async () => {
    const res = await request(app)
      .delete(`/api/claims/${claimId}/discussion-notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`);

    const body = res.body as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});

describe('Auto-Reserve API', () => {
  it('returns a reserve suggestion', async () => {
    const res = await request(app)
      .get(`/api/claims/${claimId}/auto-reserve`)
      .set('Authorization', `Bearer ${token}`);

    const body = res.body as Record<string, unknown>;
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body).toHaveProperty('suggestedReserve');
    expect(body).toHaveProperty('basis');
    expect(body).toHaveProperty('calculation');
  });
});
