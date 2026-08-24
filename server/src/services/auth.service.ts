import type { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../db/client.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/error.js';

export interface TokenPayload {
  userId: number;
  role: string;
  email: string;
}

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
  lastLoginAt: string | null;
}

type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

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
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

export async function login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid credentials', 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const signOptions: jwt.SignOptions = {
    expiresIn: config.jwtExpiresIn,
  };

  const token = jwt.sign(
    { userId: user.id, role: user.role.name, email: user.email },
    config.jwtSecret,
    signOptions
  );

  return { token, user: formatUser(user) };
}

export async function updateProfile(userId: number, data: { firstName?: string; lastName?: string; phone?: string }): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const allowed: { firstName?: string; lastName?: string; phone?: string } = {};
  if (data.firstName !== undefined) allowed.firstName = data.firstName;
  if (data.lastName !== undefined) allowed.lastName = data.lastName;
  if (data.phone !== undefined) allowed.phone = data.phone;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: allowed,
    include: { role: true },
  });

  return formatUser(updated);
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24h
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (
      payload &&
      typeof payload === 'object' &&
      'userId' in payload &&
      'role' in payload &&
      'email' in payload
    ) {
      return payload as TokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string): Promise<{ success: boolean }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError('Current password is incorrect', 400);
  }

  if (!newPassword || newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true };
}
