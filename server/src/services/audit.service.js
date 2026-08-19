import { prisma } from '../db/client.js';

export async function listAuditLogs({ action, page = 1, limit = 50 }) {
  const where = {};
  if (action) where.action = { contains: action };

  const [items, count] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, count, page: Number(page), limit: Number(limit) };
}

export async function logAction(action, entityType, entityId, userId, details = null) {
  try {
    await prisma.auditLog.create({
      data: { action, entityType, entityId: String(entityId), userId, details },
    });
  } catch {
    // Audit logging should not break business logic
  }
}
