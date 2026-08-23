import { api } from './api.js';

export async function getInvestigations(claimId) {
  const { data } = await api.get(`/claims/${claimId}/investigations`);
  return data;
}

export async function createInvestigation(claimId, payload) {
  const { data } = await api.post(`/claims/${claimId}/investigations`, payload);
  return data;
}

export async function deleteInvestigation(claimId, id) {
  const { data } = await api.delete(`/claims/${claimId}/investigations/${id}`);
  return data;
}

export async function getContacts(claimId) {
  const { data } = await api.get(`/claims/${claimId}/contacts`);
  return data;
}

export async function createContact(claimId, payload) {
  const { data } = await api.post(`/claims/${claimId}/contacts`, payload);
  return data;
}

export async function deleteContact(claimId, id) {
  const { data } = await api.delete(`/claims/${claimId}/contacts/${id}`);
  return data;
}

export async function getInspections(claimId) {
  const { data } = await api.get(`/claims/${claimId}/inspections`);
  return data;
}

export async function createInspection(claimId, payload) {
  const { data } = await api.post(`/claims/${claimId}/inspections`, payload);
  return data;
}

export async function updateInspection(claimId, id, payload) {
  const { data } = await api.put(`/claims/${claimId}/inspections/${id}`, payload);
  return data;
}

export async function deleteInspection(claimId, id) {
  const { data } = await api.delete(`/claims/${claimId}/inspections/${id}`);
  return data;
}

export async function uploadInspectionPhoto(claimId, inspectionId, file, caption) {
  const formData = new FormData();
  formData.append('file', file);
  if (caption) formData.append('caption', caption);
  const { data } = await api.post(`/claims/${claimId}/inspections/${inspectionId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function ensureInspection(claimId) {
  const { data } = await api.get(`/claims/${claimId}/inspections`);
  const inspections = data.items || [];
  if (inspections.length > 0) return inspections[0];
  const { data: created } = await api.post(`/claims/${claimId}/inspections`, {
    scheduledAt: new Date().toISOString(),
    location: 'Initial Investigation',
    scope: 'Initial investigation photos',
    notes: 'Auto-created for initial investigation photo upload',
  });
  return created.item;
}

export async function deleteInspectionPhoto(claimId, photoId) {
  const { data } = await api.delete(`/claims/${claimId}/inspections/photos/${photoId}`);
  return data;
}
