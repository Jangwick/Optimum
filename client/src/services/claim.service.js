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

export async function updateClaimStatus(id, payload) {
  const { data } = await api.patch(`/claims/${id}/status`, payload);
  return data;
}

export async function exportClaims(params = {}) {
  const { data } = await api.get('/export/claims', { params, responseType: 'blob' });
  return data;
}
