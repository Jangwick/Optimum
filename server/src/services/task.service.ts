import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { recordActivity } from './activity.service.js';
import type { AuthUser } from '../middleware/auth.js';

interface TaskFilters {
  claimId?: number | string;
  status?: string;
}

interface TaskInput {
  title: string;
  description?: string;
  claimId?: number | string;
  assignedToId: number | string;
  dueDate?: string | Date | null;
  priority?: string;
}

interface TaskUpdateInput {
  title?: string;
  description?: string;
  assignedToId?: number | string;
  claimId?: number | string;
  dueDate?: string | Date | null;
  priority?: string;
  status?: string;
}

function toDateOrNull(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export async function getTasks(filters: TaskFilters, user: AuthUser) {
  const where: { assignedToId?: number; claimId?: number; status?: string } = {};
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

export async function createTask(data: TaskInput, createdBy: number) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      claimId: data.claimId ? Number(data.claimId) : null,
      assignedToId: Number(data.assignedToId),
      dueDate: toDateOrNull(data.dueDate),
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
    await recordActivity(Number(data.claimId), 'TASK_CREATED', `Task created: ${data.title}`, createdBy);
  }
  return task;
}

export async function updateTask(id: number, data: TaskUpdateInput, userId: number) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError('Task not found', 404);

  const update: Record<string, unknown> = {};
  if (data.title !== undefined) update.title = data.title;
  if (data.description !== undefined) update.description = data.description;
  if (data.assignedToId !== undefined) update.assignedToId = Number(data.assignedToId);
  if (data.claimId !== undefined) update.claimId = data.claimId ? Number(data.claimId) : null;
  if (data.dueDate !== undefined) update.dueDate = toDateOrNull(data.dueDate);
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
    data: update as Prisma.TaskUpdateInput,
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

export async function deleteTask(id: number, userId: number) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError('Task not found', 404);
  const { claimId, title } = task;
  await prisma.task.delete({ where: { id } });
  if (claimId) {
    await recordActivity(claimId, 'TASK_DELETED', `Task deleted: ${title}`, userId);
  }
}
