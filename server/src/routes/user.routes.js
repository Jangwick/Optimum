import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  listEngineers,
  listAccountants,
} from '../controllers/user.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('ADMIN'), listUsers);
router.get('/engineers', requireRole('ADMIN'), listEngineers);
router.get('/accountants', requireRole('ADMIN'), listAccountants);
router.get('/:id', getUser);
router.post('/', requireRole('ADMIN'), createUser);
router.put('/:id', updateUser);
router.delete('/:id', requireRole('ADMIN'), deactivateUser);

export default router;
