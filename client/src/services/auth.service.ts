import { api } from './api.js';

export async function login(credentials: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post('/auth/login', credentials);
  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<unknown> {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function updateProfile(payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.put('/auth/me', payload);
  return data;
}

export async function changePassword(payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.put('/auth/me/password', payload);
  return data;
}
