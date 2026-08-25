import type { AuthUser } from '../middleware/auth.js';
import * as claimService from './claim.service.js';
import * as masterDataService from './master-data.service.js';
import * as userService from './user.service.js';
import type { UserProfile } from './user.service.js';

const MAX_LIMIT = 10;
const DEFAULT_LIMIT = 3;

interface SearchListResult {
  items: Record<string, unknown>[];
}

interface UserListResult {
  users: UserProfile[];
}

interface SearchItem {
  type: 'claim' | 'client' | 'policy' | 'user';
  id: number;
  title: string;
  subtitle: string;
  status?: string | null;
}

export interface SearchGroups {
  claims: SearchItem[];
  clients: SearchItem[];
  policies: SearchItem[];
  users: SearchItem[];
}

function normalizeLimit(limit: unknown): number {
  const n = Number(limit);
  if (Number.isNaN(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

function mapClaims(result: PromiseSettledResult<SearchListResult>): SearchItem[] {
  if (result.status !== 'fulfilled' || !result.value) return [];
  return (result.value.items || []).map((c) => ({
    type: 'claim',
    id: c.id as number,
    title: (c.claimNumber as string) || '—',
    subtitle: (c.client as Record<string, unknown> | null)?.name as string | undefined
      || (c.insuredName as string | undefined)
      || ((c.policy as Record<string, unknown> | null)?.client as Record<string, unknown> | null)?.name as string | undefined
      || '—',
    status: ((c.status as Record<string, unknown> | null)?.name as string | null | undefined) ?? null,
  }));
}

function mapClients(result: PromiseSettledResult<SearchListResult>): SearchItem[] {
  if (result.status !== 'fulfilled' || !result.value) return [];
  return (result.value.items || []).map((c) => ({
    type: 'client',
    id: c.id as number,
    title: (c.name as string) || '—',
    subtitle: [c.code, c.email].filter(Boolean).join(' • ') || '—',
  }));
}

function mapPolicies(result: PromiseSettledResult<SearchListResult>): SearchItem[] {
  if (result.status !== 'fulfilled' || !result.value) return [];
  return (result.value.items || []).map((p) => ({
    type: 'policy',
    id: p.id as number,
    title: (p.policyNumber as string) || '—',
    subtitle: [p.policyType, (p.client as Record<string, unknown> | null)?.name].filter(Boolean).join(' • ') || '—',
  }));
}

function mapUsers(result: PromiseSettledResult<UserListResult>): SearchItem[] {
  if (result.status !== 'fulfilled' || !result.value) return [];
  return (result.value.users || []).map((u) => ({
    type: 'user',
    id: u.id as number,
    title: (u.fullName as string) || '—',
    subtitle: [u.email, u.employeeNumber].filter(Boolean).join(' • ') || '—',
  }));
}

export async function searchAll(query: unknown, limit: unknown, user: AuthUser): Promise<SearchGroups> {
  const safeLimit = normalizeLimit(limit);
  const search = typeof query === 'string' ? query.trim() : '';

  if (!search) {
    return { claims: [], clients: [], policies: [], users: [] };
  }

  const [claimsResult, clientsResult, policiesResult, usersResult] = await Promise.allSettled([
    claimService.getClaims(
      { search, view: 'all', page: 1, limit: safeLimit, sortField: 'createdAt', sortOrder: 'desc' },
      user,
    ) as Promise<SearchListResult>,
    masterDataService.listClients({ search, page: 1, limit: safeLimit }),
    masterDataService.listPolicies({ search, page: 1, limit: safeLimit }),
    user.role === 'ADMIN'
      ? userService.getUsers({ search, page: 1, limit: safeLimit, sortField: 'lastName', sortOrder: 'asc' }) as Promise<UserListResult>
      : Promise.resolve({ users: [] }),
  ]);

  return {
    claims: mapClaims(claimsResult),
    clients: mapClients(clientsResult),
    policies: mapPolicies(policiesResult),
    users: mapUsers(usersResult),
  };
}
