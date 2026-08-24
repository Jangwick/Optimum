import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';

interface AuditLogFilters {
  action?: string;
  tableName?: string;
  userId?: number | string;
  from?: string | Date;
  to?: string | Date;
  page?: number | string;
  limit?: number | string;
}

export async function listAuditLogs({ action, tableName, userId, from, to, page = 1, limit = 50 }: AuditLogFilters) {
  const where: {
    action?: { contains: string };
    tableName?: { contains: string };
    userId?: number;
    createdAt?: { gte?: Date; lte?: Date };
  } = {};

  if (action) where.action = { contains: action };
  if (tableName) where.tableName = { contains: tableName };
  if (userId) where.userId = Number(userId);
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from instanceof Date ? from : new Date(from);
    if (to) where.createdAt.lte = to instanceof Date ? to : new Date(to);
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

export async function logAction(
  action: string,
  tableName: string,
  recordId: number | string,
  userId: number | null | undefined,
  newValues: Record<string, unknown> | null = null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        tableName,
        recordId: String(recordId),
        ...(userId !== undefined && userId !== null ? { userId } : {}),
        ...(newValues === null ? {} : { newValues: newValues as Prisma.InputJsonValue }),
      },
    });
  } catch {
    // Audit logging should not break business logic
  }
}
