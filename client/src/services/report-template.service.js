import { api } from './api.js';

export async function getTemplates() {
  const { data } = await api.get('/report-templates');
  return data;
}

export async function createTemplate(formData) {
  const { data } = await api.post('/report-templates', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteTemplate(id) {
  const { data } = await api.delete(`/report-templates/${id}`);
  return data;
}

export async function setDefaultTemplate(id) {
  const { data } = await api.patch(`/report-templates/${id}/default`);
  return data;
}

export async function downloadTemplate(id) {
  const { data } = await api.get(`/report-templates/${id}/download`, { responseType: 'blob' });
  return data;
}
