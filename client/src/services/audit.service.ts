import { api } from './api.js';

export async function getAuditLogs(params: Record<string, unknown> = {}): Promise<unknown> {
  const { data } = await api.get('/audit-logs', { params });
  return data;
}
