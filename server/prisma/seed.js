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

// 18-stage primary workflow status — the primary status dimension for
// registry/reporting. Replaces the prior 12 OCS process statuses.
// The 12 OCS codes are retained as read-only ImportStatus for historical records.
const processStatuses = [
  { name: 'New Claim', code: 'NEW_CLAIM', color: '#767683', isTerminal: false, sortOrder: 10 },
  { name: 'Claim Assigned', code: 'CLAIM_ASSIGNED', color: '#4958ab', isTerminal: false, sortOrder: 20 },
  { name: 'Initial Review', code: 'INITIAL_REVIEW', color: '#4958ab', isTerminal: false, sortOrder: 30 },
  { name: 'Contacted Insured', code: 'CONTACTED_INSURED', color: '#4958ab', isTerminal: false, sortOrder: 40 },
  { name: 'Site Inspection Scheduled', code: 'SITE_INSPECTION_SCHEDULED', color: '#f26522', isTerminal: false, sortOrder: 50 },
  { name: 'Under Investigation', code: 'UNDER_INVESTIGATION', color: '#f26522', isTerminal: false, sortOrder: 60 },
  { name: 'Inspection Completed', code: 'INSPECTION_COMPLETED', color: '#f26522', isTerminal: false, sortOrder: 70 },
  { name: 'Documents Required', code: 'DOCUMENTS_REQUIRED', color: '#bc0100', isTerminal: false, sortOrder: 80 },
  { name: 'Documents Received', code: 'DOCUMENTS_RECEIVED', color: '#28a745', isTerminal: false, sortOrder: 90 },
  { name: 'Loss Assessment', code: 'LOSS_ASSESSMENT', color: '#f26522', isTerminal: false, sortOrder: 100 },
  { name: 'Reserve / Loss Estimate Prepared', code: 'RESERVE_LOSS_ESTIMATE_PREPARED', color: '#f26522', isTerminal: false, sortOrder: 110 },
  { name: 'Report Preparation', code: 'REPORT_PREPARATION', color: '#f26522', isTerminal: false, sortOrder: 120 },
  { name: 'Report Submitted', code: 'REPORT_SUBMITTED', color: '#2b3a8c', isTerminal: false, sortOrder: 130 },
  { name: 'Client Review', code: 'CLIENT_REVIEW', color: '#2b3a8c', isTerminal: false, sortOrder: 140 },
  { name: 'Further Clarification', code: 'FURTHER_CLARIFICATION', color: '#bc0100', isTerminal: false, sortOrder: 150 },
  { name: 'Adjustment Completed', code: 'ADJUSTMENT_COMPLETED', color: '#2b3a8c', isTerminal: false, sortOrder: 160 },
  { name: 'Claim Settled', code: 'CLAIM_SETTLED', color: '#28a745', isTerminal: false, sortOrder: 170 },
  { name: 'Claim Closed', code: 'CLAIM_CLOSED', color: '#28a745', isTerminal: true, sortOrder: 180 },
];

// OCS 12-status — retained as read-only ImportStatus on historical/imported records.
const importStatuses = [
  { name: 'Awaiting Documents', code: 'AWAITING_DOCUMENTS', sortOrder: 10 },
  { name: 'Documents Under Review', code: 'DOCUMENTS_UNDER_REVIEW', sortOrder: 20 },
  { name: 'Report Under Review', code: 'REPORT_UNDER_REVIEW', sortOrder: 30 },
  { name: 'Letter Request Under Review', code: 'LETTER_REQUEST_UNDER_REVIEW', sortOrder: 40 },
  { name: 'Letter & Report Under Review', code: 'LETTER_AND_REPORT_UNDER_REVIEW', sortOrder: 50 },
  { name: 'Awaiting Insurer Instruction', code: 'AWAITING_INSURER_INSTRUCTION', sortOrder: 60 },
  { name: 'For Letter Offer', code: 'FOR_LETTER_OFFER', sortOrder: 70 },
  { name: 'Offer Declined - Re-evaluation', code: 'OFFER_DECLINED_REEVALUATION', sortOrder: 80 },
  { name: 'For Closing and Billing', code: 'FOR_CLOSING_AND_BILLING', sortOrder: 90 },
  { name: 'For Closing (Waived Billing)', code: 'FOR_CLOSING_WAIVED_BILLING', sortOrder: 100 },
  { name: 'Closed', code: 'CLOSED', sortOrder: 110 },
  { name: 'Cancelled', code: 'CANCELLED', sortOrder: 120 },
];

// Default mapping from internal ClaimStatus code → 18-stage ProcessStatus code.
// Used by the backfill to populate processStatusId on existing claims
// without overwriting the secondary statusId. Conservative: maps to
// the closest 18-stage workflow step; anything unmapped defaults to NEW_CLAIM.
const statusToProcess = {
  NEW: 'NEW_CLAIM',
  ASSIGNED: 'CLAIM_ASSIGNED',
  INVESTIGATION: 'UNDER_INVESTIGATION',
  INSPECTION_SCHEDULED: 'SITE_INSPECTION_SCHEDULED',
  INSPECTION_COMPLETED: 'INSPECTION_COMPLETED',
  DOCUMENTS_PENDING: 'DOCUMENTS_REQUIRED',
  DOCUMENTS_RECEIVED: 'DOCUMENTS_RECEIVED',
  ASSESSMENT: 'LOSS_ASSESSMENT',
  REPORT_DRAFT: 'REPORT_PREPARATION',
  REPORT_SUBMITTED: 'REPORT_SUBMITTED',
  CLIENT_REVIEW: 'CLIENT_REVIEW',
  CLARIFICATION_NEEDED: 'FURTHER_CLARIFICATION',
  CLARIFICATION_PROVIDED: 'CLIENT_REVIEW',
  SETTLEMENT: 'CLAIM_SETTLED',
  OFFER_SENT: 'ADJUSTMENT_COMPLETED',
  FEE_INVOICED: 'CLAIM_SETTLED',
  PAYMENT_RECEIVED: 'CLAIM_SETTLED',
  CLOSED: 'CLAIM_CLOSED',
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

  // Upsert 18-stage process statuses (primary status dimension).
  const processStatusByCode = {};
  for (const p of processStatuses) {
    const row = await prisma.processStatus.upsert({ where: { code: p.code }, update: p, create: p });
    processStatusByCode[p.code] = row;
  }

  // Remove old process statuses that are no longer part of the 18-stage
  // workflow. They have been moved to ImportStatus. Remap any claims that
  // still reference them to the closest 18-stage equivalent before deleting.
  const oldProcessCodes = {
    RECEIVED: 'NEW_CLAIM',
    ASSIGNED: 'CLAIM_ASSIGNED',
    INSPECTED: 'INSPECTION_COMPLETED',
    AWAITING_DOCUMENTS: 'DOCUMENTS_REQUIRED',
    DOCUMENTS_RECEIVED: 'DOCUMENTS_RECEIVED',
    UNDER_ASSESSMENT: 'LOSS_ASSESSMENT',
    REPORT_DRAFTED: 'REPORT_PREPARATION',
    LETTER_REQUEST_UNDER_REVIEW: 'CLIENT_REVIEW',
    SETTLED: 'CLAIM_SETTLED',
    CLOSED: 'CLAIM_CLOSED',
    INSPECTION: 'INSPECTION_COMPLETED',
    DOCUMENTS: 'DOCUMENTS_RECEIVED',
    ASSESSMENT: 'LOSS_ASSESSMENT',
    REPORT: 'REPORT_PREPARATION',
    SETTLEMENT: 'CLAIM_SETTLED',
    CLARIFICATION: 'FURTHER_CLARIFICATION',
  };
  for (const [oldCode, newCode] of Object.entries(oldProcessCodes)) {
    if (processStatusByCode[oldCode]) continue; // shouldn't happen but skip
    const oldStatus = await prisma.processStatus.findUnique({ where: { code: oldCode } });
    if (!oldStatus) continue;
    const next = processStatusByCode[newCode];
    if (next && oldStatus.id !== next.id) {
      await prisma.claim.updateMany({ where: { processStatusId: oldStatus.id }, data: { processStatusId: next.id } });
      await prisma.claimProcessStatusHistory.updateMany({ where: { processStatusId: oldStatus.id }, data: { processStatusId: next.id } });
    }
    await prisma.processStatus.delete({ where: { id: oldStatus.id } });
  }

  // Upsert ImportStatus entries (read-only OCS 12-status for historical records).
  for (const s of importStatuses) {
    await prisma.importStatus.upsert({ where: { code: s.code }, update: s, create: s });
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
    const processCode = statusToProcess[c.status?.code] || 'NEW_CLAIM';
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
