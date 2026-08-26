import { api } from './api.js';

export async function getSettlement(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/settlements`);
  return data;
}

export async function saveSettlement(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.put(`/claims/${claimId}/settlements`, payload);
  return data;
}

export async function getOffers(claimId: string | number, params?: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/settlements/offers`, { params });
  return data;
}

export async function createOffer(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/settlements/offers`, payload);
  return data;
}

export async function respondToOffer(
  claimId: string | number,
  offerId: string | number,
  payload: Record<string, unknown>
): Promise<unknown> {
  const { data } = await api.put(`/claims/${claimId}/settlements/offers/${offerId}/response`, payload);
  return data;
}
