import { prisma } from '../db/client.js';

interface NotificationInput {
  title: string;
  message: string;
  claimId?: number | string | null;
}

export async function getNotifications(
  userId: number,
  pagination: { page?: number | string; limit?: number | string } = {}
) {
  const { page = 1, limit = 50 } = pagination;
  const where = { userId };

  const [items, count] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.notification.count({ where }),
  ]);

  return { items, count, page: Number(page), limit: Number(limit) };
}

export async function createNotification(userId: number, { title, message, claimId }: NotificationInput) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      claimId: claimId ? Number(claimId) : null,
      isRead: false,
    },
  });
}

export async function markRead(id: number, userId: number) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) return null;
  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllRead(userId: number) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return { count: result.count };
}

export async function getUnreadCount(userId: number) {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return { count };
}
