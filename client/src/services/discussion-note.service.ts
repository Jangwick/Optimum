import { api } from './api.js';

export async function getDiscussionNotes(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/discussion-notes`);
  return data;
}

export async function createDiscussionNote(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/discussion-notes`, payload);
  return data;
}

export async function deleteDiscussionNote(claimId: string | number, id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/claims/${claimId}/discussion-notes/${id}`);
  return data;
}

export async function getAutoReserve(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/auto-reserve`);
  return data;
}
