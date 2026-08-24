import { api } from './api.js';

export async function getFees(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/fees`);
  return data;
}

export async function createFee(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/fees`, payload);
  return data;
}

export async function getInvoices(claimId: string | number): Promise<unknown> {
  const { data } = await api.get(`/claims/${claimId}/invoices`);
  return data;
}

export async function createInvoice(claimId: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/invoices`, payload);
  return data;
}

export async function recordPayment(
  claimId: string | number,
  invoiceId: string | number,
  payload: Record<string, unknown>
): Promise<unknown> {
  const { data } = await api.post(`/claims/${claimId}/invoices/${invoiceId}/payments`, payload);
  return data;
}
