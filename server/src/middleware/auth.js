import { verifyToken } from '../services/auth.service.js';
import { prisma } from '../db/client.js';
import { AppError } from './error.js';

function isDocumentDownloadOrPreview(path) {
  if (!path) return false;
  return /^\/api\/claims\/[^/]+\/documents\/[^/]+\/(preview|download)$/.test(path.split('?')[0]);
}

export async function authMiddleware(req, res, next) {
  try {
    let token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    // Allow query-string tokens only on document download/preview GET endpoints,
    // which are used by legacy/embedded image previews.
    if (!token && req.method === 'GET' && req.query?.token && isDocumentDownloadOrPreview(req.path)) {
      token = req.query.token;
    }

    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      throw new AppError('Invalid or expired token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    };

    next();
  } catch (err) {
    next(err);
  }
}
