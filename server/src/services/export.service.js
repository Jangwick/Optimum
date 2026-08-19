import ExcelJS from 'exceljs';
import { prisma } from '../db/client.js';

export async function exportClaimsToExcel(filters, user) {
  const where = {};

  if (filters.search) {
    where.OR = [
      { claimNumber: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }
  if (filters.status) where.status = { code: filters.status };
  if (filters.clientId) where.clientId = Number(filters.clientId);

  if (user.role === 'ENGINEER') where.engineerId = user.id;
  if (user.role === 'ACCOUNTANT') where.accountantId = user.id;

  const claims = await prisma.claim.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { name: true } },
      insuranceCompany: { select: { name: true } },
      claimType: { select: { name: true } },
      status: { select: { name: true } },
      engineer: { select: { firstName: true, lastName: true } },
      accountant: { select: { firstName: true, lastName: true } },
      policy: { select: { policyNumber: true } },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Claims Register');

  sheet.columns = [
    { header: 'Claim #', key: 'claimNumber', width: 18 },
    { header: 'Policy #', key: 'policyNumber', width: 18 },
    { header: 'Client', key: 'client', width: 25 },
    { header: 'Insurer', key: 'insurer', width: 25 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Engineer', key: 'engineer', width: 22 },
    { header: 'Accountant', key: 'accountant', width: 22 },
    { header: 'Date of Loss', key: 'dateOfLoss', width: 16 },
    { header: 'Date Received', key: 'dateReceived', width: 16 },
    { header: 'Estimated Loss', key: 'estimatedLoss', width: 16 },
    { header: 'Reserve', key: 'reserve', width: 16 },
    { header: 'Closed', key: 'closed', width: 10 },
  ];

  for (const c of claims) {
    sheet.addRow({
      claimNumber: c.claimNumber,
      policyNumber: c.policy?.policyNumber,
      client: c.client?.name,
      insurer: c.insuranceCompany?.name,
      type: c.claimType?.name,
      status: c.status?.name,
      engineer: c.engineer ? `${c.engineer.firstName} ${c.engineer.lastName}` : '',
      accountant: c.accountant ? `${c.accountant.firstName} ${c.accountant.lastName}` : '',
      dateOfLoss: c.dateOfLoss ? new Date(c.dateOfLoss).toLocaleDateString() : '',
      dateReceived: new Date(c.dateReceived).toLocaleDateString(),
      estimatedLoss: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(c.estimatedLoss || 0)),
      reserve: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(c.reserve || 0)),
      closed: c.isClosed ? 'Yes' : 'No',
    });
  }

  sheet.getRow(1).font = { bold: true };

  return await workbook.xlsx.writeBuffer();
}
