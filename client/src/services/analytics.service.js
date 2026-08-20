import { api } from './api.js';

export function getAnalytics() {
  return api.get('/analytics').then((res) => res.data);
}
