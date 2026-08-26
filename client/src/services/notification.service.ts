import { api } from './api.js';

export async function getNotifications(params: Record<string, unknown> = {}): Promise<unknown> {
  const { data } = await api.get('/notifications', { params });
  return data;
}

export async function getUnreadCount(): Promise<unknown> {
  const { data } = await api.get('/notifications/unread-count');
  return data;
}

export async function markRead(id: string | number): Promise<unknown> {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
}

export async function markAllRead(): Promise<unknown> {
  const { data } = await api.put('/notifications/read-all');
  return data;
}
