import { api } from './api.js';

export async function getDiscussionNotes(claimId) {
  const { data } = await api.get(`/claims/${claimId}/discussion-notes`);
  return data;
}

export async function createDiscussionNote(claimId, payload) {
  const { data } = await api.post(`/claims/${claimId}/discussion-notes`, payload);
  return data;
}

export async function deleteDiscussionNote(claimId, id) {
  const { data } = await api.delete(`/claims/${claimId}/discussion-notes/${id}`);
  return data;
}

export async function getAutoReserve(claimId) {
  const { data } = await api.get(`/claims/${claimId}/auto-reserve`);
  return data;
}
