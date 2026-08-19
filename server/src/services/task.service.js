import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';

export async function getTasks(filters, user) {
  const where = {};
  if (user.role !== 'ADMIN') where.assignedToId = user.id;
  if (filters.claimId) where.claimId = Number(filters.claimId);
  if (filters.status) where.status = filters.status;

  return prisma.task.findMany({
    where,
    include: {
      claim: { select: { id: true, claimNumber: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTask(data, createdBy) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      claimId: data.claimId ? Number(data.claimId) : null,
      assignedToId: Number(data.assignedToId),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: 'PENDING',
      priority: data.priority || 'MEDIUM',
      createdById: createdBy,
    },
    include: {
      claim: { select: { id: true, claimNumber: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function updateTask(id, data) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError('Task not found', 404);

  const update = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.assignedToId !== undefined) update.assignedToId = Number(data.assignedToId);
  if (data.claimId !== undefined) update.claimId = Number(data.claimId) || null;
  if (data.dueDate !== undefined) update.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.priority !== undefined) update.priority = data.priority;
  if (data.status !== undefined) {
    update.status = data.status;
    if (data.status === 'COMPLETED' && !task.completedAt) {
      update.completedAt = new Date();
    } else if (data.status !== 'COMPLETED') {
      update.completedAt = null;
    }
  }

  return prisma.task.update({
    where: { id },
    data: update,
    include: {
      claim: { select: { id: true, claimNumber: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function deleteTask(id) {
  await prisma.task.delete({ where: { id } });
}
