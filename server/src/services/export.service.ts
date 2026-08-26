import ExcelJS from 'exceljs';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import type { AuthUser } from '../middleware/auth.js';

const EXPORT_MAX_ROWS = 10_000;

interface ExportFilters {
  search?: string;
  status?: string;
  processStatus?: string;
  claimType?: string;
  clientId?: number | string;
  engineerId?: number | string;
  insurerId?: number | string;
  view?: 'active' | 'closed' | 'cancelled';
}

export async function exportClaimsToExcel(filters: ExportFilters, user: AuthUser, signal?: AbortSignal) {
  const where: Prisma.ClaimWhereInput = {};

  if (filters.search) {
    where.OR = [
      { claimNumber: { contains: filters.search } },
      { description: { contains: filters.search } },
      { assignmentNumber: { contains: filters.search } },
      { insurerClaimNumber: { contains: filters.search } },
    ];
  }
  if (filters.status) where.status = { code: filters.status };
  if (filters.processStatus) where.processStatus = { code: filters.processStatus };
  if (filters.claimType) where.claimType = { code: filters.claimType };
  if (filters.clientId) where.clientId = Number(filters.clientId);
  if (filters.engineerId) where.engineerId = Number(filters.engineerId);
  if (filters.insurerId) where.insuranceCompanyId = Number(filters.insurerId);

  if (filters.view === 'active') {
    where.AND = [
      { isReadOnly: false },
      { isClosed: false },
      { isCancelled: false },
      { status: { code: { not: 'CANCELLED' } } },
    ];
  } else if (filters.view === 'closed') {
    where.OR = [
      { isReadOnly: true, isCancelled: false },
      { isClosed: true },
    ];
  } else if (filters.view === 'cancelled') {
    where.OR = [
      { isCancelled: true },
      { status: { code: 'CANCELLED' } },
    ];
  }

  if (user.role === 'ENGINEER') where.engineerId = user.id;
  if (user.role === 'ACCOUNTANT') where.accountantId = user.id;

  if (signal?.aborted) {
    throw new AppError('Export cancelled', 499);
  }

  const total = await prisma.claim.count({ where });
  if (total > EXPORT_MAX_ROWS) {
    throw new AppError('Export too large; narrow filters to under 10,000 rows', 413);
  }

  const claims = await prisma.claim.findMany({
    where,
    orderBy: { dateReceived: 'desc' },
    take: EXPORT_MAX_ROWS,
    include: {
      client: { select: { name: true } },
      insuranceCompany: { select: { name: true } },
      broker: { select: { name: true } },
      claimType: { select: { name: true } },
      status: { select: { name: true, code: true } },
      processStatus: { select: { name: true, code: true } },
      engineer: { select: { firstName: true, lastName: true } },
      accountant: { select: { firstName: true, lastName: true } },
      policy: { select: { policyNumber: true } },
      insurerPanel: { include: { insuranceCompany: { select: { name: true } } } },
    },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Claims Register');

  sheet.columns = [
    { header: 'Claim #', key: 'claimNumber', width: 18 },
    { header: 'Assignment #', key: 'assignmentNumber', width: 18 },
    { header: 'Insurer Claim #', key: 'insurerClaimNumber', width: 18 },
    { header: 'Policy #', key: 'policyNumber', width: 18 },
    { header: 'Client', key: 'client', width: 25 },
    { header: 'Insurer', key: 'insurer', width: 25 },
    { header: 'Broker', key: 'broker', width: 20 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Process Status', key: 'processStatus', width: 22 },
    { header: 'Internal Status', key: 'status', width: 20 },
    { header: 'Engineer', key: 'engineer', width: 22 },
    { header: 'Accountant', key: 'accountant', width: 22 },
    { header: 'Date of Loss', key: 'dateOfLoss', width: 16 },
    { header: 'Date Received', key: 'dateReceived', width: 16 },
    { header: 'Claimed Amount', key: 'claimedAmount', width: 16 },
    { header: 'Estimated Loss', key: 'estimatedLoss', width: 16 },
    { header: 'Reserve', key: 'reserve', width: 16 },
    { header: 'Proposed Settlement', key: 'proposedSettlement', width: 18 },
    { header: 'Agreed Settlement', key: 'agreedSettlement', width: 18 },
    { header: 'Insurer Panel', key: 'insurerPanel', width: 30 },
    { header: 'Nature of Loss', key: 'natureOfLoss', width: 25 },
    { header: 'Location', key: 'locationOfLoss', width: 25 },
    { header: 'Closed', key: 'closed', width: 10 },
  ];

  const fmtPHP = (v: unknown) => v ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(v)) : '';

  for (const c of claims) {
    if (signal?.aborted) {
      throw new AppError('Export cancelled', 499);
    }
    const panelText = c.insurerPanel
      .map((ci) => `${ci.insuranceCompany.name}${ci.isLead ? ' (Lead)' : ''}${ci.participationPercent ? ` ${ci.participationPercent}%` : ''}`)
      .join('; ');

    sheet.addRow({
      claimNumber: c.claimNumber,
      assignmentNumber: c.assignmentNumber || '',
      insurerClaimNumber: c.insurerClaimNumber || '',
      policyNumber: c.policy?.policyNumber || '',
      client: c.client?.name || '',
      insurer: c.insuranceCompany?.name || '',
      broker: c.broker?.name || '',
      type: c.claimType?.name || '',
      processStatus: c.processStatus?.name || '',
      status: c.status?.name || '',
      engineer: c.engineer ? `${c.engineer.firstName} ${c.engineer.lastName}` : '',
      accountant: c.accountant ? `${c.accountant.firstName} ${c.accountant.lastName}` : '',
      dateOfLoss: c.dateOfLoss ? new Date(c.dateOfLoss).toLocaleDateString() : '',
      dateReceived: new Date(c.dateReceived).toLocaleDateString(),
      claimedAmount: fmtPHP(c.claimedAmount),
      estimatedLoss: fmtPHP(c.estimatedLoss),
      reserve: fmtPHP(c.reserve),
      proposedSettlement: fmtPHP(c.proposedSettlement),
      agreedSettlement: fmtPHP(c.agreedSettlement),
      insurerPanel: panelText,
      natureOfLoss: c.natureOfLoss || '',
      locationOfLoss: c.locationOfLoss || c.classification || '',
      closed: c.isClosed ? 'Yes' : 'No',
    });
  }

  sheet.getRow(1).font = { bold: true };

  return await workbook.xlsx.writeBuffer();
}
