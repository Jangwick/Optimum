import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/error.js';
import type { AuthUser } from '../middleware/auth.js';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  employeeNumber: string | null;
  department: string | null;
  designation: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
}

type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

interface UserFilters {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: string;
}

interface CreateUserInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeNumber?: string;
  department?: string;
  designation?: string;
  role: string;
  isActive?: boolean;
}

interface UpdateUserInput {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  employeeNumber?: string;
  department?: string;
  designation?: string;
  role?: string;
  isActive?: boolean;
}

function formatUser(user: UserWithRole): UserProfile {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    phone: user.phone,
    employeeNumber: user.employeeNumber,
    department: user.department,
    designation: user.designation,
    role: user.role.name,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
}

function generatePassword(): string {
  // URL-safe base64url; 12 bytes produces a 16-character string with
  // mixed-case letters, digits, and '-' / '_'.
  return randomBytes(12).toString('base64url');
}

export async function getUsers(filters: UserFilters = {}) {
  const { role, search, page, limit, sortField, sortOrder } = filters;
  const where: Prisma.UserWhereInput = {};

  if (role) {
    where.role = { name: role };
  }

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { employeeNumber: { contains: search } },
    ];
  }

  const order: Prisma.SortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  const orderBy: Prisma.UserOrderByWithRelationInput = {};

  if (sortField === 'fullName') {
    orderBy.firstName = order;
  } else if (sortField === 'role') {
    orderBy.role = { name: order };
  } else if (sortField) {
    switch (sortField) {
      case 'firstName': orderBy.firstName = order; break;
      case 'lastName': orderBy.lastName = order; break;
      case 'email': orderBy.email = order; break;
      case 'phone': orderBy.phone = order; break;
      case 'employeeNumber': orderBy.employeeNumber = order; break;
      case 'department': orderBy.department = order; break;
      case 'designation': orderBy.designation = order; break;
      case 'roleId': orderBy.roleId = order; break;
      case 'isActive': orderBy.isActive = order; break;
      case 'lastLoginAt': orderBy.lastLoginAt = order; break;
      case 'createdAt': orderBy.createdAt = order; break;
      case 'updatedAt': orderBy.updatedAt = order; break;
      default: orderBy.lastName = 'asc';
    }
  } else {
    orderBy.lastName = 'asc';
  }

  const hasPagination = page != null && limit != null;
  const [users, count] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { role: true },
      orderBy,
      ...(hasPagination ? { skip: (page - 1) * limit, take: limit } : {}),
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(formatUser),
    count,
  };
}

export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return formatUser(user);
}

export async function createUser(data: CreateUserInput) {
  const role = await prisma.role.findUnique({ where: { name: data.role } });
  if (!role) {
    throw new AppError('Invalid role', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email already in use', 409);
  }

  const password = data.password || generatePassword();
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      employeeNumber: data.employeeNumber ?? null,
      department: data.department ?? null,
      designation: data.designation ?? null,
      roleId: role.id,
      isActive: data.isActive ?? true,
    },
    include: { role: true },
  });

  return { ...formatUser(user), plainPassword: data.password ? undefined : password };
}

export async function updateUser(id: number, data: UpdateUserInput, requester?: AuthUser) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isAdmin = requester?.role === 'ADMIN';
  const isSelf = requester?.id === id;

  if (!isAdmin && !isSelf) {
    throw new AppError('Forbidden', 403);
  }

  const updateData: Prisma.UserUncheckedUpdateInput = {};

  if (isAdmin) {
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.employeeNumber !== undefined) updateData.employeeNumber = data.employeeNumber;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.designation !== undefined) updateData.designation = data.designation;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.email !== undefined) updateData.email = data.email;

    if (data.role) {
      const role = await prisma.role.findUnique({ where: { name: data.role } });
      if (!role) {
        throw new AppError('Invalid role', 400);
      }
      updateData.roleId = role.id;
    }

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);
    }
  } else if (isSelf) {
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { role: true },
  });

  return formatUser(updated);
}

export async function deactivateUser(id: number, requester?: AuthUser) {
  return updateUser(id, { isActive: false }, requester);
}

export async function activateUser(id: number, requester?: AuthUser) {
  return updateUser(id, { isActive: true }, requester);
}

export async function resetPassword(id: number) {
  const user = await prisma.user.findUnique({ where: { id }, include: { role: true } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  await prisma.user.update({
    where: { id },
    data: { passwordHash },
  });

  return { user: formatUser(user), plainPassword: password };
}
