import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listAuditLogs } from '../controllers/audit.controller.js';

const router = Router();
router.use(authMiddleware, requireRole('ADMIN'));
router.get('/', listAuditLogs);

export default router;
