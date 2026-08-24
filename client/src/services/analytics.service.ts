import { api } from './api.js';

export function getAnalytics(): Promise<unknown> {
  return api.get('/analytics').then((res) => res.data);
}
