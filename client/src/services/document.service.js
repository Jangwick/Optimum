import { api } from './api.js';

export async function getDocuments(claimId) {
  const { data } = await api.get(`/claims/${claimId}/documents`);
  return data;
}

export async function uploadDocument(claimId, formData) {
  const { data } = await api.post(`/claims/${claimId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function downloadDocument(claimId, docId) {
  return api.get(`/claims/${claimId}/documents/${docId}/download`, { responseType: 'blob' });
}

export function getDocumentPreviewUrl(claimId, docId) {
  return `/api/claims/${claimId}/documents/${docId}/preview`;
}

export async function markDocumentReceived(claimId, docId) {
  const { data } = await api.put(`/claims/${claimId}/documents/${docId}/received`);
  return data;
}

export async function deleteDocument(claimId, docId) {
  const { data } = await api.delete(`/claims/${claimId}/documents/${docId}`);
  return data;
}
