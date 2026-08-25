import { api } from './api.js';

export async function getInvestigations(claimId: string | number, params?: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/investigations`, { params });
  return data;
}

export async function createInvestigation(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/investigations`, payload);
  return data;
}

export async function deleteInvestigation(claimId: string | number, id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/claims/${claimId}/investigations/${id}`);
  return data;
}

export async function getContacts(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/contacts`);
  return data;
}

export async function createContact(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/contacts`, payload);
  return data;
}

export async function deleteContact(claimId: string | number, id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/claims/${claimId}/contacts/${id}`);
  return data;
}

export async function getInspections(claimId: string | number, params?: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/inspections`, { params });
  return data;
}

export async function createInspection(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/inspections`, payload);
  return data;
}

export async function updateInspection(
  claimId: string | number,
  id: string | number,
  payload: Record<string, unknown>
): Promise<unknown> {
  const { data } = await api.put(`/claims/${claimId}/inspections/${id}`, payload);
  return data;
}

export async function deleteInspection(claimId: string | number, id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/claims/${claimId}/inspections/${id}`);
  return data;
}

export async function uploadInspectionPhoto(
  claimId: string | number,
  inspectionId: string | number,
  file: File,
  caption?: string
): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', file);
  if (caption) formData.append('caption', caption);
  const { data } = await api.post(`/claims/${claimId}/inspections/${inspectionId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function ensureInspection(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/inspections`);
  const inspections = (data as { items?: unknown[] }).items || [];
  if (inspections.length > 0) return inspections[0];
  const { data: created } = await api.post(`/claims/${claimId}/inspections`, {
    scheduledAt: new Date().toISOString(),
    location: 'Initial Investigation',
    scope: 'Initial investigation photos',
    notes: 'Auto-created for initial investigation photo upload',
  });
  return (created as { item?: unknown }).item;
}

export async function deleteInspectionPhoto(claimId: string | number, photoId: string | number): Promise<unknown> {
  const { data } = await api.delete(`/claims/${claimId}/inspections/photos/${photoId}`);
  return data;
}
