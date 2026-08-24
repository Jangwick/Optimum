import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { prisma } from '../db/client.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/error.js';

export async function getUsers(filters = {}) {
  const { role, search, page, limit, sortField, sortOrder } = filters;
  const where = {};

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

  const orderBy = {};
  if (sortField === 'fullName') {
    orderBy.firstName = sortOrder || 'asc';
  } else if (sortField === 'role') {
    orderBy.role = { name: sortOrder || 'asc' };
  } else if (sortField) {
    orderBy[sortField] = sortOrder || 'asc';
  } else {
    orderBy.lastName = 'asc';
  }

  const hasPagination = page != null && limit != null;
  const findManyArgs = { where, include: { role: true }, orderBy };
  if (hasPagination) {
    findManyArgs.skip = (page - 1) * limit;
    findManyArgs.take = limit;
  }

  const [users, count] = await Promise.all([
    prisma.user.findMany(findManyArgs),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: `${u.firstName} ${u.lastName}`,
      phone: u.phone,
      employeeNumber: u.employeeNumber,
      department: u.department,
      designation: u.designation,
      role: u.role.name,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
    })),
    count,
  };
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

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

export async function createUser(data) {
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
      phone: data.phone,
      employeeNumber: data.employeeNumber,
      department: data.department,
      designation: data.designation,
      roleId: role.id,
      isActive: data.isActive ?? true,
    },
    include: { role: true },
  });

  return { ...formatUser(user), plainPassword: data.password ? undefined : password };
}

const PROTECTED_USER_FIELDS = ['role', 'roleId', 'isActive', 'email', 'password', 'passwordHash', 'id'];

export async function updateUser(id, data, requester) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isAdmin = requester?.role === 'ADMIN';
  const isSelf = requester?.id === id;

  if (!isAdmin && !isSelf) {
    throw new AppError('Forbidden', 403);
  }

  const updateData = { ...data };

  if (isAdmin) {
    if (data.role) {
      const role = await prisma.role.findUnique({ where: { name: data.role } });
      if (!role) {
        throw new AppError('Invalid role', 400);
      }
      updateData.roleId = role.id;
      delete updateData.role;
    }

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);
      delete updateData.password;
    }
  }

  if (!isAdmin) {
    for (const key of PROTECTED_USER_FIELDS) {
      delete updateData[key];
    }
  }

  delete updateData.id;

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    include: { role: true },
  });

  return formatUser(updated);
}

export async function deactivateUser(id, requester) {
  return updateUser(id, { isActive: false }, requester);
}

export async function activateUser(id, requester) {
  return updateUser(id, { isActive: true }, requester);
}

export async function resetPassword(id) {
  const user = await prisma.user.findUnique({ where: { id } });
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

function formatUser(user) {
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

function generatePassword() {
  // URL-safe base64url; 12 bytes produces a 16-character string with
  // mixed-case letters, digits, and '-' / '_'.
  return randomBytes(12).toString('base64url');
}
