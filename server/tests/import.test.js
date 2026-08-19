import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/db/client.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

let adminAgent;
let engineerAgent;
let insuranceCompanyId;
let clientId;
let claimTypeId;
let brokerId;

async function ensureSeed() {
  const [adminRole, engineerRole] = await Promise.all([
    prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN', description: 'Administrator' } }),
    prisma.role.upsert({ where: { name: 'ENGINEER' }, update: {}, create: { name: 'ENGINEER', description: 'Field Engineer' } }),
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

  // Process statuses
  const processStatuses = [
    { name: 'Received', code: 'RECEIVED', color: '#767683', isTerminal: false, sortOrder: 10 },
    { name: 'Assigned', code: 'ASSIGNED', color: '#4958ab', isTerminal: false, sortOrder: 20 },
    { name: 'Awaiting Documents', code: 'AWAITING_DOCUMENTS', color: '#f59e0b', isTerminal: false, sortOrder: 35 },
    { name: 'Documents Received', code: 'DOCUMENTS_RECEIVED', color: '#3b82f6', isTerminal: false, sortOrder: 40 },
    { name: 'Report Submitted', code: 'REPORT_SUBMITTED', color: '#8b5cf6', isTerminal: false, sortOrder: 60 },
    { name: 'Under Assessment', code: 'UNDER_ASSESSMENT', color: '#f26522', isTerminal: false, sortOrder: 50 },
    { name: 'Settled', code: 'SETTLED', color: '#10b981', isTerminal: false, sortOrder: 90 },
    { name: 'Closed', code: 'CLOSED', color: '#28a745', isTerminal: true, sortOrder: 120 },
  ];
  for (const p of processStatuses) {
    await prisma.processStatus.upsert({ where: { code: p.code }, update: p, create: p });
  }

  // Claim statuses
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
  insuranceCompanyId = insurer.id;

  const client = await prisma.client.upsert({
    where: { code: 'TEST-CLI' },
    update: {},
    create: { name: 'Test Client', code: 'TEST-CLI', email: 'client@test.com', phone: '222' },
  });
  clientId = client.id;

  const claimType = await prisma.claimType.upsert({
    where: { code: 'PROPERTY_DAMAGE' },
    update: {},
    create: { name: 'Property Damage', code: 'PROPERTY_DAMAGE' },
  });
  claimTypeId = claimType.id;

  const broker = await prisma.broker.upsert({
    where: { code: 'TEST-BRK' },
    update: {},
    create: { name: 'Test Broker', code: 'TEST-BRK', email: 'brk@test.com', phone: '333' },
  });
  brokerId = broker.id;
}

async function createTestWorkbook() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Assignment 2026');
  sheet.columns = [
    { header: 'ITEM NO', key: 'itemNumber' },
    { header: 'OCS REF. NO', key: 'ocsReference' },
    { header: 'INSURED NAME', key: 'insuredName' },
    { header: 'INSURER/S', key: 'insurers' },
    { header: 'DATE OF LOSS', key: 'dateOfLoss' },
    { header: 'AMOUNT OF CLAIM', key: 'claimedAmount' },
    { header: 'LATEST STATUS', key: 'latestStatus' },
    { header: 'REMARKS', key: 'remarks' },
    { header: 'ASSIGNED BY', key: 'assignedBy' },
    { header: 'NATURE OF LOSS', key: 'natureOfLoss' },
  ];
  sheet.addRow({
    itemNumber: 1,
    ocsReference: 'IMP-TEST-001',
    insuredName: 'Test Client',
    insurers: 'Test Insurer',
    dateOfLoss: '2026-08-15',
    claimedAmount: 50000,
    latestStatus: 'For Letter Offer',
    remarks: 'Test import row',
    assignedBy: 'Test Adjuster',
    natureOfLoss: 'Fire damage',
  });
  sheet.addRow({
    itemNumber: 2,
    ocsReference: 'IMP-TEST-002',
    insuredName: 'Test Client',
    insurers: 'Test Insurer',
    dateOfLoss: '2026-08-16',
    claimedAmount: 75000,
    latestStatus: 'Closed',
    remarks: 'Another test row',
    assignedBy: 'Test Adjuster',
    natureOfLoss: 'Water damage',
  });

  const tmpDir = path.join(process.cwd(), 'tmp-test-imports');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const filePath = path.join(tmpDir, `test-${Date.now()}.xlsx`);
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

beforeAll(async () => {
  await ensureSeed();
  adminAgent = request.agent(app);
  engineerAgent = request.agent(app);
  await adminAgent.post('/api/auth/login').send({ email: 'admin@optimum.com', password: 'ChangeMe123!' });
  await engineerAgent.post('/api/auth/login').send({ email: 'engineer@optimum.com', password: 'ChangeMe123!' });
});

afterAll(async () => {
  // Clean up test claims created by import
  await prisma.claim.deleteMany({ where: { claimNumber: { startsWith: 'IMP-TEST-' } } });
  // Clean up import batches
  await prisma.claimImportRow.deleteMany({});
  await prisma.claimImportBatch.deleteMany({});
  await prisma.$disconnect();
});

describe('Import API', () => {
  let batchId;
  let workbookPath;

  beforeAll(async () => {
    workbookPath = await createTestWorkbook();
  });

  afterAll(() => {
    if (fs.existsSync(workbookPath)) fs.unlinkSync(workbookPath);
    const tmpDir = path.dirname(workbookPath);
    if (fs.existsSync(tmpDir) && fs.readdirSync(tmpDir).length === 0) {
      fs.rmdirSync(tmpDir);
    }
  });

  test('non-admin cannot access import endpoints', async () => {
    const res = await engineerAgent.get('/api/imports');
    expect(res.statusCode).toBe(403);
  });

  test('admin can list empty batches', async () => {
    const res = await adminAgent.get('/api/imports');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('admin can upload a workbook', async () => {
    const res = await adminAgent
      .post('/api/imports/upload')
      .attach('file', workbookPath);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.item.id).toBeDefined();
    expect(res.body.item.status).toBe('UPLOADED');
    batchId = res.body.item.id;
  });

  test('admin can preview the workbook', async () => {
    const res = await adminAgent.post(`/api/imports/${batchId}/preview`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.item.totalRows).toBeGreaterThan(0);
    expect(res.body.item.sheets.length).toBeGreaterThan(0);
  });

  test('admin can persist rows', async () => {
    const res = await adminAgent.post(`/api/imports/${batchId}/persist`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.item.totalRows).toBeGreaterThan(0);
  });

  test('admin can commit the batch', async () => {
    const res = await adminAgent.post(`/api/imports/${batchId}/commit`).send({ duplicateAction: 'SKIP' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.item.committed).toBeGreaterThan(0);
  });

  test('committed claims appear in claims list', async () => {
    const res = await adminAgent.get('/api/claims?search=IMP-TEST-');
    expect(res.statusCode).toBe(200);
    expect(res.body.items.some((c) => c.claimNumber === 'IMP-TEST-001')).toBe(true);
  });

  test('admin can rollback the batch', async () => {
    const res = await adminAgent.post(`/api/imports/${batchId}/rollback`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.item.claimsDeleted).toBeGreaterThan(0);
  });

  test('rolled-back claims no longer appear in claims list', async () => {
    const res = await adminAgent.get('/api/claims?search=IMP-TEST-');
    expect(res.statusCode).toBe(200);
    expect(res.body.items.some((c) => c.claimNumber === 'IMP-TEST-001')).toBe(false);
  });
});

describe('Claim registry fields', () => {
  let claimId;
  const uniqueAssignment = `REG-TEST-${Date.now()}`;

  test('admin can create a claim with registry fields', async () => {
    const res = await adminAgent.post('/api/claims').send({
      clientId,
      insuranceCompanyId,
      claimTypeId,
      brokerId,
      assignmentNumber: uniqueAssignment,
      insurerClaimNumber: 'INS-CLM-001',
      brokerReference: 'BRK-REF-001',
      natureOfLoss: 'Fire damage',
      locationOfLoss: 'Manila',
      claimedAmount: 100000,
      description: 'Registry test claim',
      dateOfLoss: '2026-08-15',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.item.assignmentNumber).toBe(uniqueAssignment);
    expect(res.body.item.insurerClaimNumber).toBe('INS-CLM-001');
    expect(res.body.item.broker).toBeTruthy();
    expect(res.body.item.processStatus).toBeTruthy();
    claimId = res.body.item.id;
  });

  test('claim detail includes insurer panel and activities', async () => {
    const res = await adminAgent.get(`/api/claims/${claimId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.item.insurerPanel).toBeDefined();
    expect(Array.isArray(res.body.item.activities)).toBe(true);
    expect(Array.isArray(res.body.item.correspondence)).toBe(true);
  });

  test('admin can add an insurer to the panel', async () => {
    const res = await adminAgent.post(`/api/claims/${claimId}/insurers`).send({
      insuranceCompanyId,
      isLead: true,
      participationPercent: 100,
      insurerClaimNumber: 'PANEL-001',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.item.isLead).toBe(true);
  });

  test('admin can list insurer panel', async () => {
    const res = await adminAgent.get(`/api/claims/${claimId}/insurers`);
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].isLead).toBe(true);
  });

  test('admin can update an insurer panel entry', async () => {
    const listRes = await adminAgent.get(`/api/claims/${claimId}/insurers`);
    const insurerEntryId = listRes.body.items[0].id;
    const res = await adminAgent.patch(`/api/claims/${claimId}/insurers/${insurerEntryId}`).send({
      offerStatus: 'OFFER_SENT',
      notes: 'Offer sent to insurer',
    });
    expect(res.statusCode).toBe(200);
  });

  test('admin can remove an insurer panel entry', async () => {
    const listRes = await adminAgent.get(`/api/claims/${claimId}/insurers`);
    const insurerEntryId = listRes.body.items[0].id;
    const res = await adminAgent.delete(`/api/claims/${claimId}/insurers/${insurerEntryId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.item.deleted).toBe(true);
  });

  afterAll(async () => {
    if (claimId) {
      await prisma.claim.delete({ where: { id: claimId } }).catch(() => {});
    }
  });
});

describe('Activity and correspondence', () => {
  let claimId;
  const uniqueAssignment = `ACT-TEST-${Date.now()}`;

  beforeAll(async () => {
    const res = await adminAgent.post('/api/claims').send({
      clientId,
      insuranceCompanyId,
      claimTypeId,
      assignmentNumber: uniqueAssignment,
      description: 'Activity test claim',
    });
    claimId = res.body.item.id;
  });

  afterAll(async () => {
    if (claimId) {
      await prisma.claim.delete({ where: { id: claimId } }).catch(() => {});
    }
  });

  test('admin can add an activity', async () => {
    const res = await adminAgent.post(`/api/claims/${claimId}/activities`).send({
      activityType: 'SITE_INSPECTION',
      description: 'Initial site inspection completed',
      occurredAt: '2026-08-20T10:00:00.000Z',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.item.activityType).toBe('SITE_INSPECTION');
  });

  test('can list activities', async () => {
    const res = await adminAgent.get(`/api/claims/${claimId}/activities`);
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  test('admin can add correspondence with follow-up', async () => {
    const res = await adminAgent.post(`/api/claims/${claimId}/correspondence`).send({
      type: 'LETTER',
      sentAt: '2026-08-21',
      followUpDate: '2026-09-05',
      recipient: 'Test Insurer',
      notes: 'Sent request for documents',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.item.type).toBe('LETTER');
  });

  test('can list correspondence', async () => {
    const res = await adminAgent.get(`/api/claims/${claimId}/correspondence`);
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });
});
