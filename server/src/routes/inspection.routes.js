import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { listInspections, createInspection, updateInspection, deleteInspection, uploadInspectionPhoto } from '../controllers/inspection.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listInspections);
router.post('/', createInspection);
router.put('/:id', updateInspection);
router.delete('/:id', deleteInspection);
router.post('/:id/photos', upload.single('file'), uploadInspectionPhoto);

export default router;
