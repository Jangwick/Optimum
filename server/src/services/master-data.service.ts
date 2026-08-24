import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
// deliberate any: input form data will be replaced with shared DTOs
function buildSearchWhere(fields: string[], search?: string): any {
  if (!search) return {};
  return {
    OR: fields.map((f) => ({ [f]: { contains: search } })),
  };
}

function formatDates(obj: Record<string, unknown>): Record<string, unknown> {
  const out = { ...obj };
  for (const k of ['createdAt', 'updatedAt', 'startDate', 'endDate'] as const) {
    if (out[k] instanceof Date) out[k] = (out[k] as Date).toISOString();
  }
  return out;
}

interface PaginationFilters {
  search?: string;
  page?: number | string;
  limit?: number | string;
}

// Insurance companies
export async function listInsuranceCompanies({ search, page = 1, limit = 25 }: PaginationFilters) {
  const where: any = buildSearchWhere(['name', 'code', 'email', 'phone', 'address'], search);
  const [items, count] = await Promise.all([
    prisma.insuranceCompany.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { name: 'asc' },
    }),
    prisma.insuranceCompany.count({ where }),
  ]);
  return { items: items.map(formatDates), count, page: Number(page), limit: Number(limit) };
}

export async function getInsuranceCompany(id: number) {
  const item = await prisma.insuranceCompany.findUnique({ where: { id } });
  if (!item) throw new AppError('Insurance company not found', 404);
  return formatDates(item as unknown as Record<string, unknown>);
}

export async function createInsuranceCompany(data: any) {
  const item = await prisma.insuranceCompany.create({ data });
  return formatDates(item as unknown as Record<string, unknown>);
}

export async function updateInsuranceCompany(id: number, data: any) {
  const item = await prisma.insuranceCompany.update({ where: { id }, data });
  return formatDates(item as unknown as Record<string, unknown>);
}

export async function deleteInsuranceCompany(id: number) {
  await prisma.insuranceCompany.delete({ where: { id } });
}

// Clients
export async function listClients({ search, page = 1, limit = 25 }: PaginationFilters) {
  const where: any = buildSearchWhere(['name', 'code', 'email', 'phone', 'address'], search);
  const [items, count] = await Promise.all([
    prisma.client.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { name: 'asc' },
    }),
    prisma.client.count({ where }),
  ]);
  return { items: items.map(formatDates), count, page: Number(page), limit: Number(limit) };
}

export async function getClient(id: number) {
  const item = await prisma.client.findUnique({
    where: { id },
    include: { policies: true },
  });
  if (!item) throw new AppError('Client not found', 404);
  return { ...formatDates(item as unknown as Record<string, unknown>), policies: item.policies.map(formatDates) };
}

export async function createClient(data: any) {
  const item = await prisma.client.create({ data });
  return formatDates(item as unknown as Record<string, unknown>);
}

export async function updateClient(id: number, data: any) {
  const item = await prisma.client.update({ where: { id }, data });
  return formatDates(item as unknown as Record<string, unknown>);
}

export async function deleteClient(id: number) {
  await prisma.client.delete({ where: { id } });
}

// Policies
interface PolicyFilters extends PaginationFilters {
  clientId?: number | string;
  insuranceCompanyId?: number | string;
}

export async function listPolicies({ search, clientId, insuranceCompanyId, page = 1, limit = 25 }: PolicyFilters) {
  const where: any = {
    ...buildSearchWhere(['policyNumber', 'policyType', 'notes'], search),
  };
  if (clientId) where.clientId = Number(clientId);
  if (insuranceCompanyId) where.insuranceCompanyId = Number(insuranceCompanyId);

  const [items, count] = await Promise.all([
    prisma.policy.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { policyNumber: 'asc' },
      include: { client: { select: { id: true, name: true } }, insuranceCompany: { select: { id: true, name: true } }, claimType: { select: { id: true, name: true, code: true } } },
    }),
    prisma.policy.count({ where }),
  ]);
  return { items: items.map(formatDates), count, page: Number(page), limit: Number(limit) };
}

export async function getPolicy(id: number) {
  const item = await prisma.policy.findUnique({
    where: { id },
    include: { client: true, insuranceCompany: true, claimType: true },
  });
  if (!item) throw new AppError('Policy not found', 404);
  return {
    ...formatDates(item as unknown as Record<string, unknown>),
    client: item.client ? { id: item.client.id, name: item.client.name } : null,
    insuranceCompany: item.insuranceCompany ? { id: item.insuranceCompany.id, name: item.insuranceCompany.name } : null,
    claimType: item.claimType ? { id: item.claimType.id, name: item.claimType.name, code: item.claimType.code } : null,
  };
}

export async function createPolicy(data: any) {
  const item = await prisma.policy.create({
    data: {
      ...data,
      clientId: Number(data.clientId),
      insuranceCompanyId: Number(data.insuranceCompanyId),
      claimTypeId: Number(data.claimTypeId),
      sumInsured: data.sumInsured ? Number(data.sumInsured) : 0,
      premium: data.premium ? Number(data.premium) : 0,
      excess: data.excess ? Number(data.excess) : 0,
    },
    include: { client: true, insuranceCompany: true, claimType: true },
  });
  return {
    ...formatDates(item as unknown as Record<string, unknown>),
    client: item.client ? { id: item.client.id, name: item.client.name } : null,
    insuranceCompany: item.insuranceCompany ? { id: item.insuranceCompany.id, name: item.insuranceCompany.name } : null,
    claimType: item.claimType ? { id: item.claimType.id, name: item.claimType.name, code: item.claimType.code } : null,
  };
}

export async function updatePolicy(id: number, data: any) {
  const update: any = { ...data };
  if (data.clientId !== undefined) update.clientId = Number(data.clientId);
  if (data.insuranceCompanyId !== undefined) update.insuranceCompanyId = Number(data.insuranceCompanyId);
  if (data.claimTypeId !== undefined) update.claimTypeId = Number(data.claimTypeId);
  if (data.sumInsured !== undefined) update.sumInsured = Number(data.sumInsured);
  if (data.premium !== undefined) update.premium = Number(data.premium);
  if (data.excess !== undefined) update.excess = Number(data.excess);

  const item = await prisma.policy.update({
    where: { id },
    data: update,
    include: { client: true, insuranceCompany: true, claimType: true },
  });
  return {
    ...formatDates(item as unknown as Record<string, unknown>),
    client: item.client ? { id: item.client.id, name: item.client.name } : null,
    insuranceCompany: item.insuranceCompany ? { id: item.insuranceCompany.id, name: item.insuranceCompany.name } : null,
    claimType: item.claimType ? { id: item.claimType.id, name: item.claimType.name, code: item.claimType.code } : null,
  };
}

export async function deletePolicy(id: number) {
  await prisma.policy.delete({ where: { id } });
}

// Lookups
export async function listClaimTypes() {
  return prisma.claimType.findMany({ orderBy: { name: 'asc' } });
}

export async function createClaimType(data: any) {
  return prisma.claimType.create({ data });
}

export async function updateClaimType(id: number, data: any) {
  return prisma.claimType.update({ where: { id }, data });
}

export async function deleteClaimType(id: number) {
  return prisma.claimType.delete({ where: { id } });
}

export async function listDocumentCategories() {
  return prisma.documentCategory.findMany({ orderBy: { name: 'asc' } });
}

export async function createDocumentCategory(data: any) {
  return prisma.documentCategory.create({ data });
}

export async function updateDocumentCategory(id: number, data: any) {
  return prisma.documentCategory.update({ where: { id }, data });
}

export async function deleteDocumentCategory(id: number) {
  return prisma.documentCategory.delete({ where: { id } });
}

export async function listClaimStatuses() {
  return prisma.claimStatus.findMany({ orderBy: { sortOrder: 'asc' } });
}
