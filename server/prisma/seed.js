import bcrypt from 'bcrypt';
import { prisma } from '../src/db/client.js';

const statuses = [
  { name: 'New', code: 'NEW', color: '#767683', isTerminal: false, sortOrder: 10 },
  { name: 'Assigned', code: 'ASSIGNED', color: '#4958ab', isTerminal: false, sortOrder: 20 },
  { name: 'Investigation', code: 'INVESTIGATION', color: '#f26522', isTerminal: false, sortOrder: 30 },
  { name: 'Inspection Scheduled', code: 'INSPECTION_SCHEDULED', color: '#f26522', isTerminal: false, sortOrder: 40 },
  { name: 'Inspection Completed', code: 'INSPECTION_COMPLETED', color: '#f26522', isTerminal: false, sortOrder: 50 },
  { name: 'Documents Pending', code: 'DOCUMENTS_PENDING', color: '#f26522', isTerminal: false, sortOrder: 60 },
  { name: 'Documents Received', code: 'DOCUMENTS_RECEIVED', color: '#28a745', isTerminal: false, sortOrder: 70 },
  { name: 'Assessment', code: 'ASSESSMENT', color: '#f26522', isTerminal: false, sortOrder: 80 },
  { name: 'Report Draft', code: 'REPORT_DRAFT', color: '#f26522', isTerminal: false, sortOrder: 90 },
  { name: 'Report Submitted', code: 'REPORT_SUBMITTED', color: '#2b3a8c', isTerminal: false, sortOrder: 100 },
  { name: 'Client Review', code: 'CLIENT_REVIEW', color: '#2b3a8c', isTerminal: false, sortOrder: 110 },
  { name: 'Clarification Needed', code: 'CLARIFICATION_NEEDED', color: '#bc0100', isTerminal: false, sortOrder: 120 },
  { name: 'Clarification Provided', code: 'CLARIFICATION_PROVIDED', color: '#28a745', isTerminal: false, sortOrder: 130 },
  { name: 'Settlement', code: 'SETTLEMENT', color: '#2b3a8c', isTerminal: false, sortOrder: 140 },
  { name: 'Offer Sent', code: 'OFFER_SENT', color: '#f26522', isTerminal: false, sortOrder: 150 },
  { name: 'Fee Invoiced', code: 'FEE_INVOICED', color: '#2b3a8c', isTerminal: false, sortOrder: 160 },
  { name: 'Payment Received', code: 'PAYMENT_RECEIVED', color: '#28a745', isTerminal: false, sortOrder: 170 },
  { name: 'Closed', code: 'CLOSED', color: '#28a745', isTerminal: true, sortOrder: 180 },
];

// OCS 12-stage process status — primary status for registry/reporting.
// Maps to the legacy workbook's process flow and is the canonical
// status for imported and new claims. Existing internal ClaimStatus
// remains as a secondary workflow status.
const processStatuses = [
  { name: 'Received', code: 'RECEIVED', color: '#767683', isTerminal: false, sortOrder: 10 },
  { name: 'Assigned', code: 'ASSIGNED', color: '#4958ab', isTerminal: false, sortOrder: 20 },
  { name: 'Under Investigation', code: 'UNDER_INVESTIGATION', color: '#f26522', isTerminal: false, sortOrder: 30 },
  { name: 'Inspected', code: 'INSPECTED', color: '#f26522', isTerminal: false, sortOrder: 40 },
  { name: 'Documents Received', code: 'DOCUMENTS_RECEIVED', color: '#28a745', isTerminal: false, sortOrder: 50 },
  { name: 'Under Assessment', code: 'UNDER_ASSESSMENT', color: '#f26522', isTerminal: false, sortOrder: 60 },
  { name: 'Report Drafted', code: 'REPORT_DRAFTED', color: '#f26522', isTerminal: false, sortOrder: 70 },
  { name: 'Report Submitted', code: 'REPORT_SUBMITTED', color: '#2b3a8c', isTerminal: false, sortOrder: 80 },
  { name: 'Letter Request Under Review', code: 'LETTER_REQUEST_UNDER_REVIEW', color: '#2b3a8c', isTerminal: false, sortOrder: 90 },
  { name: 'Awaiting Documents', code: 'AWAITING_DOCUMENTS', color: '#bc0100', isTerminal: false, sortOrder: 100 },
  { name: 'Settled', code: 'SETTLED', color: '#28a745', isTerminal: false, sortOrder: 110 },
  { name: 'Closed', code: 'CLOSED', color: '#28a745', isTerminal: true, sortOrder: 120 },
];

// Default mapping from internal ClaimStatus code → ProcessStatus code.
// Used by the backfill to populate processStatusId on existing claims
// without overwriting the secondary statusId. Conservative: maps to
// the closest OCS stage; anything unmapped defaults to RECEIVED.
const statusToProcess = {
  NEW: 'RECEIVED',
  ASSIGNED: 'ASSIGNED',
  INVESTIGATION: 'UNDER_INVESTIGATION',
  INSPECTION_SCHEDULED: 'UNDER_INVESTIGATION',
  INSPECTION_COMPLETED: 'INSPECTED',
  DOCUMENTS_PENDING: 'AWAITING_DOCUMENTS',
  DOCUMENTS_RECEIVED: 'DOCUMENTS_RECEIVED',
  ASSESSMENT: 'UNDER_ASSESSMENT',
  REPORT_DRAFT: 'REPORT_DRAFTED',
  REPORT_SUBMITTED: 'REPORT_SUBMITTED',
  CLIENT_REVIEW: 'LETTER_REQUEST_UNDER_REVIEW',
  CLARIFICATION_NEEDED: 'AWAITING_DOCUMENTS',
  CLARIFICATION_PROVIDED: 'DOCUMENTS_RECEIVED',
  SETTLEMENT: 'SETTLED',
  OFFER_SENT: 'SETTLED',
  FEE_INVOICED: 'SETTLED',
  PAYMENT_RECEIVED: 'SETTLED',
  CLOSED: 'CLOSED',
};

const documentCategories = [
  { name: 'Policy', code: 'POLICY' },
  { name: 'Claim Form', code: 'CLAIM_FORM' },
  { name: 'Photo', code: 'PHOTO' },
  { name: 'Report', code: 'REPORT' },
  { name: 'Invoice', code: 'INVOICE' },
  { name: 'Correspondence', code: 'CORRESPONDENCE' },
  { name: 'Police Report', code: 'POLICE_REPORT' },
  { name: 'Medical Report', code: 'MEDICAL_REPORT' },
  { name: 'Repair Estimate', code: 'REPAIR_ESTIMATE' },
  { name: 'Other', code: 'OTHER' },
];

const claimTypes = [
  { name: 'Property Damage', code: 'PROPERTY_DAMAGE' },
  { name: 'Auto/Casualty', code: 'AUTO_CASUALTY' },
  { name: 'Liability', code: 'LIABILITY' },
  { name: 'Business Interruption', code: 'BUSINESS_INTERRUPTION' },
];

async function main() {
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN', description: 'Administrator' } }),
    prisma.role.upsert({ where: { name: 'ENGINEER' }, update: {}, create: { name: 'ENGINEER', description: 'Field Engineer' } }),
    prisma.role.upsert({ where: { name: 'ACCOUNTANT' }, update: {}, create: { name: 'ACCOUNTANT', description: 'Accountant' } }),
  ]);

  for (const s of statuses) {
    await prisma.claimStatus.upsert({ where: { code: s.code }, update: s, create: s });
  }

  // Upsert OCS process statuses (primary status dimension).
  const processStatusByCode = {};
  for (const p of processStatuses) {
    const row = await prisma.processStatus.upsert({ where: { code: p.code }, update: p, create: p });
    processStatusByCode[p.code] = row;
  }

  // Backfill processStatusId on existing claims that don't yet have one.
  // Conservative: only sets a value when null. Never overwrites a user-set
  // or previously-backfilled value. Maps via statusToProcess using the
  // claim's existing secondary ClaimStatus code.
  const claimsWithoutProcess = await prisma.claim.findMany({
    where: { processStatusId: null },
    select: { id: true, status: { select: { code: true } } },
  });
  let backfilled = 0;
  for (const c of claimsWithoutProcess) {
    const processCode = statusToProcess[c.status?.code] || 'RECEIVED';
    const process = processStatusByCode[processCode];
    if (!process) continue;
    await prisma.claim.update({ where: { id: c.id }, data: { processStatusId: process.id } });
    backfilled += 1;
  }
  if (backfilled > 0) {
    console.log(`Backfilled processStatusId on ${backfilled} existing claim(s).`);
  }

  for (const c of documentCategories) {
    await prisma.documentCategory.upsert({ where: { code: c.code }, update: c, create: c });
  }

  for (const t of claimTypes) {
    await prisma.claimType.upsert({ where: { code: t.code }, update: t, create: t });
  }

  const adminRole = roles.find((r) => r.name === 'ADMIN');
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@optimum.com' } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', Number(process.env.BCRYPT_ROUNDS || 12));
    await prisma.user.create({
      data: {
        email: 'admin@optimum.com',
        passwordHash,
        firstName: 'System',
        lastName: 'Administrator',
        employeeNumber: 'ADM-001',
        roleId: adminRole.id,
        isActive: true,
      },
    });
    console.log('Seeded default admin admin@optimum.com / ChangeMe123!');
  }

  console.log('Seed complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
