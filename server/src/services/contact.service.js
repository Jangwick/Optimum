import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';

export async function listContacts(claimId) {
  return prisma.contact.findMany({
    where: { claimId: Number(claimId) },
    orderBy: { name: 'asc' },
  });
}

export async function createContact(claimId, data) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);

  return prisma.contact.create({
    data: {
      claimId: Number(claimId),
      name: data.name,
      role: data.role,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
    },
  });
}

export async function updateContact(id, data) {
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) throw new AppError('Contact not found', 404);

  return prisma.contact.update({ where: { id }, data });
}

export async function deleteContact(id) {
  await prisma.contact.delete({ where: { id } });
}
