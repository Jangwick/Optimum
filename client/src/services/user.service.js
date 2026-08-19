import { api } from './api.js';

export async function getUsers(params = {}) {
  const { data } = await api.get('/users', { params });
  return data;
}

export async function createUser(payload) {
  const { data } = await api.post('/users', payload);
  return data;
}

export async function updateUser(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload);
  return data;
}

export async function deactivateUser(id) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

export async function activateUser(id) {
  const { data } = await api.patch(`/users/${id}/activate`);
  return data;
}

export async function resetPassword(id) {
  const { data } = await api.post(`/users/${id}/reset-password`);
  return data;
}
