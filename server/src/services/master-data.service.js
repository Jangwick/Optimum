import { prisma } from '../db/client.js';
import { AppError } from '../middleware/error.js';

// Generic helpers
function buildSearchWhere(fields, search) {
  if (!search) return {};
  return {
    OR: fields.map((f) => ({ [f]: { contains: search } })),
  };
}

function formatDates(obj) {
  const out = { ...obj };
  ['createdAt', 'updatedAt', 'startDate', 'endDate'].forEach((k) => {
    if (out[k] instanceof Date) out[k] = out[k].toISOString();
  });
  return out;
}

// Insurance companies
export async function listInsuranceCompanies({ search, page = 1, limit = 25 }) {
  const where = buildSearchWhere(['name', 'code', 'email', 'phone', 'address'], search);
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

export async function getInsuranceCompany(id) {
  const item = await prisma.insuranceCompany.findUnique({ where: { id } });
  if (!item) throw new AppError('Insurance company not found', 404);
  return formatDates(item);
}

export async function createInsuranceCompany(data) {
  const item = await prisma.insuranceCompany.create({ data });
  return formatDates(item);
}

export async function updateInsuranceCompany(id, data) {
  const item = await prisma.insuranceCompany.update({ where: { id }, data });
  return formatDates(item);
}

export async function deleteInsuranceCompany(id) {
  await prisma.insuranceCompany.delete({ where: { id } });
}

// Clients
export async function listClients({ search, page = 1, limit = 25 }) {
  const where = buildSearchWhere(['name', 'code', 'email', 'phone', 'address'], search);
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

export async function getClient(id) {
  const item = await prisma.client.findUnique({
    where: { id },
    include: { policies: true },
  });
  if (!item) throw new AppError('Client not found', 404);
  return { ...formatDates(item), policies: item.policies.map(formatDates) };
}

export async function createClient(data) {
  const item = await prisma.client.create({ data });
  return formatDates(item);
}

export async function updateClient(id, data) {
  const item = await prisma.client.update({ where: { id }, data });
  return formatDates(item);
}

export async function deleteClient(id) {
  await prisma.client.delete({ where: { id } });
}

// Policies
export async function listPolicies({ search, clientId, insuranceCompanyId, page = 1, limit = 25 }) {
  const where = {
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

export async function getPolicy(id) {
  const item = await prisma.policy.findUnique({
    where: { id },
    include: { client: true, insuranceCompany: true, claimType: true },
  });
  if (!item) throw new AppError('Policy not found', 404);
  return {
    ...formatDates(item),
    client: item.client ? { id: item.client.id, name: item.client.name } : null,
    insuranceCompany: item.insuranceCompany ? { id: item.insuranceCompany.id, name: item.insuranceCompany.name } : null,
    claimType: item.claimType ? { id: item.claimType.id, name: item.claimType.name, code: item.claimType.code } : null,
  };
}

export async function createPolicy(data) {
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
    ...formatDates(item),
    client: item.client ? { id: item.client.id, name: item.client.name } : null,
    insuranceCompany: item.insuranceCompany ? { id: item.insuranceCompany.id, name: item.insuranceCompany.name } : null,
    claimType: item.claimType ? { id: item.claimType.id, name: item.claimType.name, code: item.claimType.code } : null,
  };
}

export async function updatePolicy(id, data) {
  const update = { ...data };
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
    ...formatDates(item),
    client: item.client ? { id: item.client.id, name: item.client.name } : null,
    insuranceCompany: item.insuranceCompany ? { id: item.insuranceCompany.id, name: item.insuranceCompany.name } : null,
    claimType: item.claimType ? { id: item.claimType.id, name: item.claimType.name, code: item.claimType.code } : null,
  };
}

export async function deletePolicy(id) {
  await prisma.policy.delete({ where: { id } });
}

// Lookups
export async function listClaimTypes() {
  return prisma.claimType.findMany({ orderBy: { name: 'asc' } });
}

export async function listDocumentCategories() {
  return prisma.documentCategory.findMany({ orderBy: { name: 'asc' } });
}

export async function listClaimStatuses() {
  return prisma.claimStatus.findMany({ orderBy: { sortOrder: 'asc' } });
}
