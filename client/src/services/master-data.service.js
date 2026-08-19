import { api } from './api.js';

export async function getClaimTypes() {
  const { data } = await api.get('/master-data/claim-types');
  return data;
}

export async function getClaimStatuses() {
  const { data } = await api.get('/master-data/claim-statuses');
  return data;
}

export async function getClients() {
  const { data } = await api.get('/master-data/clients');
  return data;
}

export async function getInsuranceCompanies() {
  const { data } = await api.get('/master-data/insurance-companies');
  return data;
}

export async function getPolicies() {
  const { data } = await api.get('/master-data/policies');
  return data;
}
