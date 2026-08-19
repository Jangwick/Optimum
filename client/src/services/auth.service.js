import { api } from './api.js';

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data;
}

export async function logout() {
  await api.post('/auth/logout');
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}
