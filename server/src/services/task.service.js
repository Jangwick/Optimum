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

  const update = { ...data };
  if (data.assignedToId !== undefined) update.assignedToId = Number(data.assignedToId);
  if (data.claimId !== undefined) update.claimId = Number(data.claimId) || null;
  if (data.dueDate !== undefined) update.dueDate = data.dueDate ? new Date(data.dueDate) : null;

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
