import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';

// Record a system-generated activity for a claim (used by all services to reflect tab actions)
export async function recordActivity(claimId, activityType, description, actorId, source = 'SYSTEM') {
  try {
    return await prisma.claimActivity.create({
      data: {
        claimId: Number(claimId),
        activityType,
        description,
        actorId: actorId || null,
        source,
        occurredAt: new Date(),
      },
    });
  } catch {
    // Non-blocking: activity recording must not break the business transaction
  }
}

// List activities for a claim
export async function getActivities(claimId, filters = {}) {
  const { activityType, source, page = 1, limit = 50 } = filters;
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, select: { id: true } });
  if (!claim) throw new AppError('Claim not found', 404);

  const where = { claimId };
  if (activityType) where.activityType = activityType;
  if (source) where.source = source;

  const [items, count] = await Promise.all([
    prisma.claimActivity.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { occurredAt: 'desc' },
      include: {
        actor: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.claimActivity.count({ where }),
  ]);

  return {
    items: items.map((a) => ({
      id: a.id,
      activityType: a.activityType,
      occurredAt: a.occurredAt?.toISOString(),
      description: a.description,
      source: a.source,
      sourceText: a.sourceText,
      confidence: a.confidence,
      actor: a.actor ? `${a.actor.firstName} ${a.actor.lastName}` : null,
      createdAt: a.createdAt.toISOString(),
    })),
    count,
    page: Number(page),
    limit: Number(limit),
  };
}

// Add a manual activity to a claim
export async function addActivity(claimId, data, addedBy) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, select: { id: true } });
  if (!claim) throw new AppError('Claim not found', 404);

  const activity = await prisma.claimActivity.create({
    data: {
      claimId,
      activityType: data.activityType,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
      description: data.description,
      source: 'USER',
      actorId: addedBy,
    },
  });

  await logAction('ACTIVITY_ADDED', 'Claim', claimId, addedBy, { activityType: data.activityType });
  return activity;
}

// List correspondence for a claim
export async function getCorrespondence(claimId) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, select: { id: true } });
  if (!claim) throw new AppError('Claim not found', 404);

  const items = await prisma.claimCorrespondence.findMany({
    where: { claimId },
    orderBy: { sentAt: 'desc' },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return items.map((c) => ({
    id: c.id,
    type: c.type,
    sentAt: c.sentAt?.toISOString(),
    receivedAt: c.receivedAt?.toISOString(),
    followUpDate: c.followUpDate?.toISOString(),
    recipient: c.recipient,
    notes: c.notes,
    isHistorical: c.isHistorical,
    createdBy: c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}` : null,
    createdAt: c.createdAt.toISOString(),
  }));
}

// Add a correspondence entry
export async function addCorrespondence(claimId, data, addedBy) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId }, select: { id: true } });
  if (!claim) throw new AppError('Claim not found', 404);

  const corr = await prisma.claimCorrespondence.create({
    data: {
      claimId,
      type: data.type,
      sentAt: data.sentAt ? new Date(data.sentAt) : null,
      receivedAt: data.receivedAt ? new Date(data.receivedAt) : null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      recipient: data.recipient || null,
      notes: data.notes || null,
      isHistorical: data.isHistorical || false,
      createdById: addedBy,
    },
  });

  // If followUpDate is set, create a follow-up task
  if (data.followUpDate) {
    await prisma.task.create({
      data: {
        claimId,
        assignedToId: addedBy,
        title: `Follow-up: ${data.type} for claim ${claim.id}`,
        description: data.notes || `Follow-up on ${data.type} correspondence`,
        dueDate: new Date(data.followUpDate),
        status: 'PENDING',
        priority: 'MEDIUM',
        createdById: addedBy,
      },
    });
  }

  await logAction('CORRESPONDENCE_ADDED', 'Claim', claimId, addedBy, { type: data.type });
  return corr;
}
