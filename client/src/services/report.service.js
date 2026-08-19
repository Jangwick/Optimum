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
