import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';
import { logAction } from './audit.service.js';
import { recordActivity } from './activity.service.js';
import { assertClaimAccess } from './claim.service.js';
import type { AuthUser } from '../middleware/auth.js';

interface DiscussionNoteInput {
  partyType?: string;
  partyName?: string;
  discussedAt?: string | Date;
  notes?: string;
  nextAction?: string;
}

export async function listDiscussionNotes(
  claimId: number | string,
  user: AuthUser,
  pagination: { page?: number | string; limit?: number | string } = {}
) {
  const { page = 1, limit = 20 } = pagination;
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const where = { claimId: Number(claimId) };

  const [items, count] = await Promise.all([
    prisma.discussionNote.findMany({
      where,
      orderBy: { discussedAt: 'desc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.discussionNote.count({ where }),
  ]);

  return { items, count, page: Number(page), limit: Number(limit) };
}

export async function createDiscussionNote(claimId: number | string, data: DiscussionNoteInput, user: AuthUser) {
  const claim = await prisma.claim.findUnique({ where: { id: Number(claimId) } });
  if (!claim) throw new AppError('Claim not found', 404);
  assertClaimAccess(user, claim);

  const note = await prisma.discussionNote.create({
    data: {
      claimId: Number(claimId),
      partyType: data.partyType || 'INTERNAL',
      partyName: data.partyName || null,
      discussedAt: data.discussedAt ? new Date(data.discussedAt) : new Date(),
      notes: data.notes || '',
      nextAction: data.nextAction || null,
      createdById: user.id,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  await logAction('DISCUSSION_NOTE_CREATED', 'DiscussionNote', note.id, user.id, { claimId: Number(claimId) });
  await recordActivity(Number(claimId), 'DISCUSSION_NOTE_CREATED', `Discussion note added (${note.partyType})`, user.id);
  return note;
}

export async function deleteDiscussionNote(id: number | string, user: AuthUser) {
  const note = await prisma.discussionNote.findUnique({ where: { id: Number(id) }, include: { claim: true } });
  if (!note) throw new AppError('Discussion note not found', 404);
  assertClaimAccess(user, note.claim);
  await logAction('DISCUSSION_NOTE_DELETED', 'DiscussionNote', Number(id), user.id, { claimId: note.claimId });
  await recordActivity(note.claimId, 'DISCUSSION_NOTE_DELETED', 'Discussion note deleted', user.id);
  await prisma.discussionNote.delete({ where: { id: Number(id) } });
}
