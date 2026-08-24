import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { recordActivity } from './activity.service.js';

interface ContactData {
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export async function listContacts(claimId: number | string) {
  return prisma.contact.findMany({
    where: { claimId: Number(claimId) },
    orderBy: { name: 'asc' },
  });
}

export async function createContact(claimId: number | string, data: ContactData, userId: number) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);

  const contact = await prisma.contact.create({
    data: {
      claimId: Number(claimId),
      name: data.name,
      role: data.role ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notes: data.notes ?? null,
    },
  });
  await recordActivity(Number(claimId), 'CONTACT_ADDED', `Contact added: ${data.name}${data.role ? ` (${data.role})` : ''}`, userId);
  return contact;
}

export async function updateContact(id: number, data: Partial<ContactData>, userId: number) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) throw new AppError('Contact not found', 404);

  const updateData: Prisma.ContactUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const updated = await prisma.contact.update({
    where: { id },
    data: updateData,
  });
  await recordActivity(updated.claimId, 'CONTACT_UPDATED', `Contact updated: ${updated.name}`, userId);
  return updated;
}

export async function deleteContact(id: number, userId: number) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) throw new AppError('Contact not found', 404);
  const { claimId, name } = contact;
  await prisma.contact.delete({ where: { id } });
  await recordActivity(claimId, 'CONTACT_DELETED', `Contact deleted: ${name}`, userId);
}
