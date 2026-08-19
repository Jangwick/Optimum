import { api } from './api.js';

export async function getFees(claimId) {
  const { data } = await api.get(`/claims/${claimId}/fees`);
  return data;
}

export async function createFee(claimId, payload) {
  const { data } = await api.post(`/claims/${claimId}/fees`, payload);
  return data;
}

export async function getInvoices(claimId) {
  const { data } = await api.get(`/claims/${claimId}/invoices`);
  return data;
}

export async function createInvoice(claimId, payload) {
  const { data } = await api.post(`/claims/${claimId}/invoices`, payload);
  return data;
}

export async function recordPayment(claimId, invoiceId, payload) {
  const { data } = await api.post(`/claims/${claimId}/invoices/${invoiceId}/payments`, payload);
  return data;
}
