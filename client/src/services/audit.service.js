import { api } from './api.js';

export async function getAuditLogs(params = {}) {
  const { data } = await api.get('/audit-logs', { params });
  return data;
}
