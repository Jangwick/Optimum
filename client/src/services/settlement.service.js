import { api } from './api.js';

export async function getSettlement(claimId) {
  const { data } = await api.get(`/claims/${claimId}/settlements`);
  return data;
}

export async function saveSettlement(claimId, payload) {
  const { data } = await api.put(`/claims/${claimId}/settlements`, payload);
  return data;
}

export async function getOffers(claimId) {
  const { data } = await api.get(`/claims/${claimId}/settlements/offers`);
  return data;
}

export async function createOffer(claimId, payload) {
  const { data } = await api.post(`/claims/${claimId}/settlements/offers`, payload);
  return data;
}

export async function respondToOffer(claimId, offerId, payload) {
  const { data } = await api.put(`/claims/${claimId}/settlements/offers/${offerId}/response`, payload);
  return data;
}
