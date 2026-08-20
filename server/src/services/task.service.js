import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { recordActivity } from './activity.service.js';

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
  const task = await prisma.task.create({
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
  if (data.claimId) {
    await recordActivity(data.claimId, 'TASK_CREATED', `Task created: ${data.title}`, createdBy);
  }
  return task;
}

export async function updateTask(id, data, userId) {
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

  const updated = await prisma.task.update({
    where: { id },
    data: update,
    include: {
      claim: { select: { id: true, claimNumber: true } },
      assignedTo: { select: { firstName: true, lastName: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
  });
  if (task.claimId) {
    if (data.status !== undefined) {
      await recordActivity(task.claimId, 'TASK_STATUS_CHANGED', `Task "${task.title}" → ${data.status}`, userId);
    } else {
      await recordActivity(task.claimId, 'TASK_UPDATED', `Task updated: ${task.title}`, userId);
    }
  }
  return updated;
}

export async function deleteTask(id, userId) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError('Task not found', 404);
  const claimId = task.claimId;
  const title = task.title;
  await prisma.task.delete({ where: { id } });
  if (claimId) {
    await recordActivity(claimId, 'TASK_DELETED', `Task deleted: ${title}`, userId);
  }
}
