import { api } from './api.js';

export async function getClaims(params: Record<string, unknown> = {}): Promise<unknown> {
  const { data } = await api.get('/claims', { params });
  return data;
}

export async function getClaim(id: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${id}`);
  return data;
}

export async function createClaim(payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post('/claims', payload);
  return data;
}

export async function updateClaim(id: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.patch(`/claims/${id}`, payload);
  return data;
}

export async function updateClaimStatus(id: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.patch(`/claims/${id}/status`, payload);
  return data;
}

export async function exportClaims(params: Record<string, unknown> = {}): Promise<Blob> {
  const { data } = await api.get<Blob>('/export/claims', { params, responseType: 'blob' });
  return data;
}

export async function listClaimInsurers(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/insurers`);
  return data;
}

export async function addClaimInsurer(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/insurers`, payload);
  return data;
}

export async function updateClaimInsurer(
  claimId: string | number,
  insurerId: string | number,
  payload: Record<string, unknown>
): Promise<unknown> {
  const { data } = await api.patch(`/claims/${claimId}/insurers/${insurerId}`, payload);
  return data;
}

export async function removeClaimInsurer(claimId: string | number, insurerId: string | number): Promise<unknown> {
  const { data } = await api.delete(`/claims/${claimId}/insurers/${insurerId}`);
  return data;
}
