import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { AuthUser } from '../middleware/auth.js';

export interface DownloadTokenPayload {
  userId: number;
  role: string;
  email: string;
  firstName: string;
  lastName: string;
  resource: string;
}

const EXPIRES_IN = '5m';

export function createDownloadToken(user: AuthUser, resource: string): string {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      resource,
    },
    config.jwtSecret,
    { expiresIn: EXPIRES_IN },
  );
}

export function verifyDownloadToken(token: string, resource: string): DownloadTokenPayload | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (
      payload &&
      typeof payload === 'object' &&
      'resource' in payload &&
      (payload as DownloadTokenPayload).resource === resource
    ) {
      return payload as DownloadTokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}
