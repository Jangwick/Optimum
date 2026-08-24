import { api } from './api.js';
import type { AxiosResponse } from 'axios';

export async function getDocuments(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/documents`);
  return data;
}

export async function uploadDocument(claimId: string | number, formData: FormData): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function downloadDocument(claimId: string | number, docId: string | number): Promise<AxiosResponse<Blob>> {
  return api.get<Blob>(`/claims/${claimId}/documents/${docId}/download`, { responseType: 'blob' });
}

export function getDocumentPreviewUrl(claimId: string | number, docId: string | number): string {
  let token: string | null = null;
  try { token = localStorage.getItem('token'); } catch { /* localStorage not available */ }
  const base = `/api/claims/${claimId}/documents/${docId}/preview`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

export async function markDocumentReceived(claimId: string | number, docId: string | number): Promise<unknown> {
  const { data } = await api.put(`/claims/${claimId}/documents/${docId}/received`);
  return data;
}

export async function deleteDocument(claimId: string | number, docId: string | number): Promise<unknown> {
  const { data } = await api.delete(`/claims/${claimId}/documents/${docId}`);
  return data;
}
