import { prisma } from '../db/client.js';

export async function getNotifications(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function createNotification(userId, { title, message, claimId }) {
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

export async function markRead(id, userId) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) return null;
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}
