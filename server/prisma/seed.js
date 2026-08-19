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
