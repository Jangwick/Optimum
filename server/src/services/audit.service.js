import { prisma } from '../db/client.js';

export async function listAuditLogs({ action, tableName, userId, from, to, page = 1, limit = 50 }) {
  const where = {};
  if (action) where.action = { contains: action };
  if (tableName) where.tableName = { contains: tableName };
  if (userId) where.userId = Number(userId);
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

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

export async function logAction(action, tableName, recordId, userId, newValues = null) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        tableName,
        recordId: String(recordId),
        userId,
        newValues,
      },
    });
  } catch {
    // Audit logging should not break business logic
  }
}
