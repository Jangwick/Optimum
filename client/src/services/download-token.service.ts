import { api } from './api.js';

export async function getDownloadToken(resource: string): Promise<string> {
  const { data } = await api.get<{ token: string }>('/auth/download-token', { params: { resource } });
  return data.token;
}
