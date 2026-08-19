import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { createNotification } from './notification.service.js';

// OCS 12-stage process status transitions.
// The primary status dimension for registry/reporting.
// More permissive than the internal workflow status because imported
// historical claims may skip stages.
export const processStatusTransitions = {
  RECEIVED: ['ASSIGNED', 'CLOSED'],
  ASSIGNED: ['UNDER_INVESTIGATION', 'CLOSED'],
  UNDER_INVESTIGATION: ['INSPECTED', 'AWAITING_DOCUMENTS', 'CLOSED'],
  INSPECTED: ['UNDER_ASSESSMENT', 'AWAITING_DOCUMENTS', 'DOCUMENTS_RECEIVED', 'CLOSED'],
  DOCUMENTS_RECEIVED: ['UNDER_ASSESSMENT', 'REPORT_DRAFTED', 'CLOSED'],
  UNDER_ASSESSMENT: ['REPORT_DRAFTED', 'CLOSED'],
  REPORT_DRAFTED: ['REPORT_SUBMITTED', 'CLOSED'],
  REPORT_SUBMITTED: ['LETTER_REQUEST_UNDER_REVIEW', 'AWAITING_DOCUMENTS', 'SETTLED', 'CLOSED'],
  LETTER_REQUEST_UNDER_REVIEW: ['AWAITING_DOCUMENTS', 'SETTLED', 'CLOSED'],
  AWAITING_DOCUMENTS: ['DOCUMENTS_RECEIVED', 'UNDER_ASSESSMENT', 'CLOSED'],
  SETTLED: ['CLOSED'],
  CLOSED: [],
};

// Closing guards: conditions that must be met before a claim can be
// moved to the CLOSED process status. Each guard returns an array of
// reason strings (empty = satisfied).
async function checkClosingGuards(claimId) {
  const reasons = [];

  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      reports: { select: { id: true, status: true } },
      fees: { select: { id: true, isInvoiced: true } },
      settlements: { select: { id: true, settledAmount: true } },
    },
  });

  if (!claim) throw new AppError('Claim not found', 404);

  // Guard 1: must have at least one report submitted
  const submittedReports = claim.reports.filter((r) => r.status === 'SUBMITTED' || r.status === 'APPROVED');
  if (submittedReports.length === 0 && !claim.isIncomplete) {
    reasons.push('No submitted report on file');
  }

  // Guard 2: if there are fees, all must be invoiced
  const uninvoicedFees = claim.fees.filter((f) => !f.isInvoiced);
  if (uninvoicedFees.length > 0) {
    reasons.push(`${uninvoicedFees.length} fee(s) not yet invoiced`);
  }

  // Guard 3: incomplete claims can be closed only with an explicit override
  if (claim.isIncomplete) {
    reasons.push('Claim is marked incomplete — requires explicit override to close');
  }

  return reasons;
}

export async function getProcessStatuses() {
  const statuses = await prisma.processStatus.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  return statuses.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    color: s.color,
    isTerminal: s.isTerminal,
    sortOrder: s.sortOrder,
  }));
}

export async function getProcessStatusHistory(claimId) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, select: { id: true } });
  if (!claim) throw new AppError('Claim not found', 404);

  const history = await prisma.claimProcessStatusHistory.findMany({
    where: { claimId },
    include: {
      processStatus: true,
      changedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return history.map((h) => ({
    id: h.id,
    status: h.processStatus
      ? { id: h.processStatus.id, name: h.processStatus.name, code: h.processStatus.code, color: h.processStatus.color }
      : null,
    notes: h.notes,
    source: h.source,
    isOverride: h.isOverride,
    overrideReason: h.overrideReason,
    changedBy: h.changedBy ? `${h.changedBy.firstName} ${h.changedBy.lastName}` : null,
    createdAt: h.createdAt.toISOString(),
  }));
}

export async function updateProcessStatus(
  claimId,
  { statusCode, notes = '', isOverride = false, overrideReason = '' },
  changedBy
) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: { processStatus: true, status: true },
  });
  if (!claim) throw new AppError('Claim not found', 404);

  const newStatus = await prisma.processStatus.findFirst({ where: { code: statusCode } });
  if (!newStatus) throw new AppError('Invalid process status', 400);

  const currentCode = claim.processStatus?.code;

  // Allow same-status updates (idempotent notes) without transition check
  if (currentCode && currentCode !== statusCode) {
    const allowed = processStatusTransitions[currentCode]?.includes(statusCode);
    if (!allowed && !isOverride) {
      throw new AppError(
        `Invalid process status transition from ${currentCode} to ${statusCode}. Use override to bypass.`,
        400
      );
    }
  }

  // Closing guards
  if (statusCode === 'CLOSED') {
    const guardReasons = await checkClosingGuards(claimId);
    if (guardReasons.length > 0 && !isOverride) {
      throw new AppError(
        `Cannot close claim: ${guardReasons.join('; ')}. Use override with a reason to bypass.`,
        400
      );
    }
    if (guardReasons.length > 0 && isOverride && !overrideReason) {
      throw new AppError('Override requires a reason when closing with unmet guards', 400);
    }
  }

  const updated = await prisma.claim.update({
    where: { id: claimId },
    data: {
      processStatusId: newStatus.id,
      isClosed: statusCode === 'CLOSED' ? true : claim.isClosed,
      closedAt: statusCode === 'CLOSED' ? new Date() : claim.closedAt,
      closedById: statusCode === 'CLOSED' ? changedBy : claim.closedById,
      lastUserModifiedAt: new Date(),
    },
    include: {
      processStatus: true,
      status: true,
      engineer: { select: { id: true, firstName: true, lastName: true } },
      accountant: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  await prisma.claimProcessStatusHistory.create({
    data: {
      claimId,
      processStatusId: newStatus.id,
      changedById: changedBy,
      notes,
      source: 'USER',
      isOverride,
      overrideReason: isOverride ? overrideReason : null,
    },
  });

  await logAction('PROCESS_STATUS_CHANGED', 'Claim', claimId, changedBy, {
    from: currentCode,
    to: statusCode,
    notes,
    isOverride,
  });

  const notifyUsers = [updated.engineerId, updated.accountantId].filter(Boolean);
  for (const userId of notifyUsers) {
    await createNotification(userId, {
      title: `Process status changed to ${statusCode}`,
      message: `Claim ${claim.claimNumber} moved from ${currentCode || 'none'} to ${statusCode}`,
      claimId,
    });
  }

  return {
    id: updated.id,
    claimNumber: updated.claimNumber,
    processStatus: updated.processStatus
      ? { id: updated.processStatus.id, name: updated.processStatus.name, code: updated.processStatus.code, color: updated.processStatus.color }
      : null,
    status: updated.status
      ? { id: updated.status.id, name: updated.status.name, code: updated.status.code, color: updated.status.color }
      : null,
    isClosed: updated.isClosed,
    closedAt: updated.closedAt?.toISOString(),
  };
}

export async function getClosingGuardStatus(claimId) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { id: true, isIncomplete: true, isClosed: true, processStatus: { select: { code: true } } },
  });
  if (!claim) throw new AppError('Claim not found', 404);

  const reasons = await checkClosingGuards(claimId);
  return {
    canClose: reasons.length === 0,
    reasons,
    isClosed: claim.isClosed,
    currentProcessStatus: claim.processStatus?.code || null,
  };
}
