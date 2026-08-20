import { api } from './api.js';

export async function getClaims(params = {}) {
  const { data } = await api.get('/claims', { params });
  return data;
}

export async function getClaim(id) {
  const { data } = await api.get(`/claims/${id}`);
  return data;
}

export async function createClaim(payload) {
  const { data } = await api.post('/claims', payload);
  return data;
}

export async function updateClaim(id, payload) {
  const { data } = await api.patch(`/claims/${id}`, payload);
  return data;
}

export async function updateClaimStatus(id, payload) {
  const { data } = await api.patch(`/claims/${id}/status`, payload);
  return data;
}

export async function exportClaims(params = {}) {
  const { data } = await api.get('/export/claims', { params, responseType: 'blob' });
  return data;
}

// Insurer panel CRUD
export async function listClaimInsurers(claimId) {
  const { data } = await api.get(`/claims/${claimId}/insurers`);
  return data;
}

export async function addClaimInsurer(claimId, payload) {
  const { data } = await api.post(`/claims/${claimId}/insurers`, payload);
  return data;
}

export async function updateClaimInsurer(claimId, insurerId, payload) {
  const { data } = await api.patch(`/claims/${claimId}/insurers/${insurerId}`, payload);
  return data;
}

export async function removeClaimInsurer(claimId, insurerId) {
  const { data } = await api.delete(`/claims/${claimId}/insurers/${insurerId}`);
  return data;
}
