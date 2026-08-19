import { api } from './api.js';

export async function getReports(claimId) {
  const { data } = await api.get(`/claims/${claimId}/reports`);
  return data;
}

export async function createReport(claimId, payload) {
  const { data } = await api.post(`/claims/${claimId}/reports`, payload);
  return data;
}

export async function generateReport(claimId, reportId) {
  const { data } = await api.post(`/claims/${claimId}/reports/${reportId}/generate`);
  return data;
}

export async function askClarification(claimId, reportId, payload) {
  const { data } = await api.post(`/claims/${claimId}/reports/${reportId}/clarifications`, payload);
  return data;
}

export function getDownloadUrl(claimId, reportId, type = 'pdf') {
  const base = import.meta.env.VITE_API_BASE_URL || '/api';
  return type === 'docx'
    ? `${base}/claims/${claimId}/reports/${reportId}/download/docx`
    : `${base}/claims/${claimId}/reports/${reportId}/download`;
}
