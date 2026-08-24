import { describe, it, expect, vi } from 'vitest';
import { searchAll } from './search.service.js';
import { api } from './api.js';

vi.mock('./api.js', () => ({
  api: {
    get: vi.fn(),
  },
}));

describe('search.service', () => {
  it('searchAll calls /search with query and limit', async () => {
    const mockData = {
      success: true,
      query: 'CS',
      limit: 3,
      groups: { claims: [], clients: [], policies: [], users: [] },
    };
    api.get.mockResolvedValueOnce({ data: mockData });

    const result = await searchAll('CS', 3);

    expect(api.get).toHaveBeenCalledWith('/search', { params: { q: 'CS', limit: 3 } });
    expect(result).toEqual(mockData);
  });

  it('searchAll uses default limit of 3', async () => {
    api.get.mockResolvedValueOnce({ data: { success: true } });
    await searchAll('test');
    expect(api.get).toHaveBeenCalledWith('/search', { params: { q: 'test', limit: 3 } });
  });
});
