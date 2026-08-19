import { api } from './api.js';

export async function getImportBatches(params = {}) {
  const { data } = await api.get('/imports', { params });
  return data;
}

export async function getImportBatch(id) {
  const { data } = await api.get(`/imports/${id}`);
  return data;
}

export async function getImportBatchRows(id, params = {}) {
  const { data } = await api.get(`/imports/${id}/rows`, { params });
  return data;
}

export async function uploadWorkbook(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/imports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function previewWorkbook(id) {
  const { data } = await api.post(`/imports/${id}/preview`);
  return data;
}

export async function persistRows(id) {
  const { data } = await api.post(`/imports/${id}/persist`);
  return data;
}

export async function updateMapping(id, headerMapping) {
  const { data } = await api.patch(`/imports/${id}/mapping`, { headerMapping });
  return data;
}

export async function commitBatch(id, options = {}) {
  const { data } = await api.post(`/imports/${id}/commit`, options);
  return data;
}

export async function rollbackBatch(id) {
  const { data } = await api.post(`/imports/${id}/rollback`);
  return data;
}

export async function getProcessStatuses() {
  const { data } = await api.get('/process-statuses');
  return data;
}

export async function updateProcessStatus(claimId, payload) {
  const { data } = await api.patch(`/claims/${claimId}/process-status`, payload);
  return data;
}

export async function getClosingGuards(claimId) {
  const { data } = await api.get(`/claims/${claimId}/closing-guards`);
  return data;
}

export async function getProcessStatusHistory(claimId) {
  const { data } = await api.get(`/claims/${claimId}/process-status-history`);
  return data;
}
