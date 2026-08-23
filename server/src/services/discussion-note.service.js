import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';

export async function listDiscussionNotes(claimId) {
  return prisma.discussionNote.findMany({
    where: { claimId: Number(claimId) },
    orderBy: { discussedAt: 'desc' },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function createDiscussionNote(claimId, data, userId) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);

  const note = await prisma.discussionNote.create({
    data: {
      claimId: Number(claimId),
      partyType: data.partyType || 'INTERNAL',
      partyName: data.partyName || null,
      discussedAt: data.discussedAt ? new Date(data.discussedAt) : new Date(),
      notes: data.notes || '',
      nextAction: data.nextAction || null,
      createdById: userId,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  await logAction('DISCUSSION_NOTE_CREATED', 'DiscussionNote', note.id, userId, { claimId });
  await recordActivity(claimId, 'DISCUSSION_NOTE_CREATED', `Discussion note added (${note.partyType})`, userId);
  return note;
}

export async function deleteDiscussionNote(id, userId) {
  const note = await prisma.discussionNote.findUnique({ where: { id: Number(id) } });
  if (!note) throw new AppError('Discussion note not found', 404);
  await logAction('DISCUSSION_NOTE_DELETED', 'DiscussionNote', id, userId, { claimId: note.claimId });
  await recordActivity(note.claimId, 'DISCUSSION_NOTE_DELETED', 'Discussion note deleted', userId);
  await prisma.discussionNote.delete({ where: { id: Number(id) } });
}
