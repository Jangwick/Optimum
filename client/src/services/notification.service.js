import { api } from './api.js';

export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data;
}

export async function getUnreadCount() {
  const { data } = await api.get('/notifications/unread-count');
  return data;
}

export async function markRead(id) {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
}

export async function markAllRead() {
  const { data } = await api.put('/notifications/read-all');
  return data;
}
