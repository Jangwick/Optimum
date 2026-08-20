import { api } from './api.js';

export function getProcessStatuses() {
  return api.get('/process-statuses').then((res) => res.data);
}
