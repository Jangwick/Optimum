import { api } from './api.js';

export async function getAssessments(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/assessments`);
  return data;
}

export async function createAssessment(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/assessments`, payload);
  return data;
}

export async function deleteAssessment(claimId: string | number, id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/claims/${claimId}/assessments/${id}`);
  return data;
}
