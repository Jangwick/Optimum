import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { recordActivity } from './activity.service.js';

export async function listContacts(claimId) {
  return prisma.contact.findMany({
    where: { claimId: Number(claimId) },
    orderBy: { name: 'asc' },
  });
}

export async function createContact(claimId, data, userId) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);

  const contact = await prisma.contact.create({
    data: {
      claimId: Number(claimId),
      name: data.name,
      role: data.role,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
    },
  });
  await recordActivity(claimId, 'CONTACT_ADDED', `Contact added: ${data.name}${data.role ? ` (${data.role})` : ''}`, userId);
  return contact;
}

export async function updateContact(id, data, userId) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) throw new AppError('Contact not found', 404);

  const updated = await prisma.contact.update({ where: { id }, data });
  await recordActivity(contact.claimId, 'CONTACT_UPDATED', `Contact updated: ${updated.name}`, userId);
  return updated;
}

export async function deleteContact(id, userId) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) throw new AppError('Contact not found', 404);
  const claimId = contact.claimId;
  const name = contact.name;
  await prisma.contact.delete({ where: { id } });
  await recordActivity(claimId, 'CONTACT_DELETED', `Contact deleted: ${name}`, userId);
}
