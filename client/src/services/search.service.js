import { api } from './api.js';

export async function searchAll(query, limit = 3) {
  const { data } = await api.get('/search', { params: { q: query, limit } });
  return data;
}
