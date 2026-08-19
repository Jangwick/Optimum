import { api } from './api.js';

export async function getTasks(params = {}) {
  const { data } = await api.get('/tasks', { params });
  return data;
}

export async function createTask(payload) {
  const { data } = await api.post('/tasks', payload);
  return data;
}

export async function updateTask(id, payload) {
  const { data } = await api.put(`/tasks/${id}`, payload);
  return data;
}
