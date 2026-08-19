import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listTemplates, createTemplate, deleteTemplate, setDefaultTemplate, downloadTemplate } from '../controllers/report-template.controller.js';
import { templateUpload } from '../middleware/upload.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listTemplates);
router.post('/', requireRole('ADMIN'), templateUpload.single('file'), createTemplate);
router.get('/:id/download', requireRole('ADMIN'), downloadTemplate);
router.patch('/:id/default', requireRole('ADMIN'), setDefaultTemplate);
router.delete('/:id', requireRole('ADMIN'), deleteTemplate);

export default router;
