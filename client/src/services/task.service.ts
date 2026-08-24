import { api } from './api.js';

export async function getTasks(params: Record<string, unknown> = {}): Promise<unknown> {
  const { data } = await api.get('/tasks', { params });
  return data;
}

export async function createTask(payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.post('/tasks', payload);
  return data;
}

export async function updateTask(id: string | number, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await api.put(`/tasks/${id}`, payload);
  return data;
}

export async function deleteTask(id: string | number): Promise<unknown> {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
}
