import { api } from './api.js';

export async function getReports(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/reports`);
  return data;
}

export async function createReport(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/reports`, payload);
  return data;
}

export async function generateReport(claimId: string | number, reportId: string | number): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/reports/${reportId}/generate`);
  return data;
}

export async function askClarification(
  claimId: string | number,
  reportId: string | number,
  payload: Record<string, unknown>
): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/reports/${reportId}/clarifications`, payload);
  return data;
}

export function getDownloadUrl(claimId: string | number, reportId: string | number, type = 'pdf'): string {
  const base = import.meta.env.VITE_API_BASE_URL || '/api';
  return type === 'docx'
    ? `${base}/claims/${claimId}/reports/${reportId}/download/docx`
    : `${base}/claims/${claimId}/reports/${reportId}/download`;
}
