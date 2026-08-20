import { api } from './api.js';

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data;
}

export async function logout() {
  await api.post('/auth/logout');
  try {
    localStorage.removeItem('token');
  } catch {
    // ignore
  }
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put('/auth/me', payload);
  return data;
}

export async function changePassword(payload) {
  const { data } = await api.put('/auth/me/password', payload);
  return data;
}
