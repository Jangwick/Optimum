import { api } from './api.js';

export async function getAssessments(claimId) {
  const { data } = await api.get(`/claims/${claimId}/assessments`);
  return data;
}

export async function createAssessment(claimId, payload) {
  const { data } = await api.post(`/claims/${claimId}/assessments`, payload);
  return data;
}

export async function deleteAssessment(claimId, id) {
  const { data } = await api.delete(`/claims/${claimId}/assessments/${id}`);
  return data;
}
