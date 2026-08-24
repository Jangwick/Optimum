import { prisma } from '../db/client.js';

interface NotificationInput {
  title: string;
  message: string;
  claimId?: number | string | null;
}

export async function getNotifications(userId: number) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
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
