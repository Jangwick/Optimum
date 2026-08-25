import { api } from './api.js';

export interface SearchItem {
  type: 'claim' | 'client' | 'policy' | 'user';
  id: number;
  title: string;
  subtitle: string;
  status?: string | null;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  limit: number;
  groups: {
    claims: SearchItem[];
    clients: SearchItem[];
    policies: SearchItem[];
    users: SearchItem[];
  };
}

export async function searchAll(query: string, limit = 3): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>('/search', { params: { q: query, limit } });
  return data;
}
