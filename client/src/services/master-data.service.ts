import { api } from './api.js';

export async function getClaimTypes(): Promise<unknown> {
  const { data } = await api.get('/master-data/claim-types');
  return data;
}

export async function getClaimStatuses(): Promise<unknown> {
  const { data } = await api.get('/master-data/claim-statuses');
  return data;
}

export async function getDocumentCategories(): Promise<unknown> {
  const { data } = await api.get('/master-data/document-categories');
  return data;
}

export async function getClients(params: Record<string, unknown> = {}): Promise<unknown> {
  const { data } = await api.get('/master-data/clients', { params });
  return data;
}

export async function createClient(payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post('/master-data/clients', payload);
  return data;
}

export async function updateClient(id: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.put(`/master-data/clients/${id}`, payload);
  return data;
}

export async function deleteClient(id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/master-data/clients/${id}`);
  return data;
}

export async function getInsuranceCompanies(params: Record<string, unknown> = {}): Promise<unknown> {
  const { data } = await api.get('/master-data/insurance-companies', { params });
  return data;
}

export async function createInsuranceCompany(payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post('/master-data/insurance-companies', payload);
  return data;
}

export async function updateInsuranceCompany(
  id: string | number,
  payload: Record<string, unknown>
): Promise<unknown> {
  const { data } = await api.put(`/master-data/insurance-companies/${id}`, payload);
  return data;
}

export async function deleteInsuranceCompany(id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/master-data/insurance-companies/${id}`);
  return data;
}

export async function getPolicies(params: Record<string, unknown> = {}): Promise<unknown> {
  const { data } = await api.get('/master-data/policies', { params });
  return data;
}

export async function createPolicy(payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post('/master-data/policies', payload);
  return data;
}

export async function updatePolicy(id: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.put(`/master-data/policies/${id}`, payload);
  return data;
}

export async function deletePolicy(id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/master-data/policies/${id}`);
  return data;
}

export async function createClaimType(payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post('/master-data/claim-types', payload);
  return data;
}

export async function updateClaimType(id: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.put(`/master-data/claim-types/${id}`, payload);
  return data;
}

export async function deleteClaimType(id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/master-data/claim-types/${id}`);
  return data;
}

export async function createDocumentCategory(payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post('/master-data/document-categories', payload);
  return data;
}

export async function updateDocumentCategory(
  id: string | number,
  payload: Record<string, unknown>
): Promise<unknown> {
  const { data } = await api.put(`/master-data/document-categories/${id}`, payload);
  return data;
}

export async function deleteDocumentCategory(id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/master-data/document-categories/${id}`);
  return data;
}
