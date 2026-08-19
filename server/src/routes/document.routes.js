import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  getChecklist,
  uploadDocument,
  markReceived,
  downloadDocument,
  deleteDocument,
} from '../controllers/document.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', getChecklist);
router.post('/', upload.single('file'), uploadDocument);
router.put('/:id/received', markReceived);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

export default router;
