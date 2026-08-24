import { api } from './api.js';

export function getProcessStatuses(): Promise<unknown> {
  return api.get('/process-statuses').then((res) => res.data);
}
