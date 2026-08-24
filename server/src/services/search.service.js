import * as claimService from './claim.service.js';
import * as masterDataService from './master-data.service.js';
import * as userService from './user.service.js';

const MAX_LIMIT = 10;
const DEFAULT_LIMIT = 3;

function normalizeLimit(limit) {
  const n = Number(limit);
  if (Number.isNaN(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

function mapClaims(result) {
  if (result.status !== 'fulfilled' || !result.value) return [];
  return (result.value.items || []).map((c) => ({
    type: 'claim',
    id: c.id,
    title: c.claimNumber || '—',
    subtitle: c.client?.name || c.insuredName || c.policy?.client?.name || '—',
    status: c.status?.name || null,
  }));
}

function mapClients(result) {
  if (result.status !== 'fulfilled' || !result.value) return [];
  return (result.value.items || []).map((c) => ({
    type: 'client',
    id: c.id,
    title: c.name || '—',
    subtitle: [c.code, c.email].filter(Boolean).join(' • ') || '—',
  }));
}

function mapPolicies(result) {
  if (result.status !== 'fulfilled' || !result.value) return [];
  return (result.value.items || []).map((p) => ({
    type: 'policy',
    id: p.id,
    title: p.policyNumber || '—',
    subtitle: [p.policyType, p.client?.name].filter(Boolean).join(' • ') || '—',
  }));
}

function mapUsers(result) {
  if (result.status !== 'fulfilled' || !result.value) return [];
  return (result.value.users || []).map((u) => ({
    type: 'user',
    id: u.id,
    title: u.fullName || '—',
    subtitle: [u.email, u.employeeNumber].filter(Boolean).join(' • ') || '—',
  }));
}

export async function searchAll(query, limit, user) {
  const safeLimit = normalizeLimit(limit);
  const search = typeof query === 'string' ? query.trim() : '';

  if (!search) {
    return { claims: [], clients: [], policies: [], users: [] };
  }

  const [claimsResult, clientsResult, policiesResult, usersResult] = await Promise.allSettled([
    claimService.getClaims(
      { search, view: 'all', page: 1, limit: safeLimit, sortField: 'createdAt', sortOrder: 'desc' },
      user,
    ),
    masterDataService.listClients({ search, page: 1, limit: safeLimit }),
    masterDataService.listPolicies({ search, page: 1, limit: safeLimit }),
    user.role === 'ADMIN'
      ? userService.getUsers({ search, page: 1, limit: safeLimit, sortField: 'lastName', sortOrder: 'asc' })
      : Promise.resolve({ users: [] }),
  ]);

  return {
    claims: mapClaims(claimsResult),
    clients: mapClients(clientsResult),
    policies: mapPolicies(policiesResult),
    users: mapUsers(usersResult),
  };
}
