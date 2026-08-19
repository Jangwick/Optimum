import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { upload } from '../middleware/upload.js';
import {
  listBatches,
  getBatch,
  getBatchRows,
  uploadWorkbook,
  previewWorkbook,
  persistRows,
  updateMapping,
  commitBatch,
  rollbackBatch,
} from '../controllers/import.controller.js';

const router = Router();

// All import operations are Admin-only
router.use(authMiddleware, requireRole('ADMIN'));

// Upload a workbook
router.post('/upload', upload.single('file'), uploadWorkbook);

// List all import batches
router.get('/', listBatches);

// Get a single batch
router.get('/:id', getBatch);

// Get rows for a batch (with optional status filter)
router.get('/:id/rows', getBatchRows);

// Preview workbook (parse without persisting)
router.post('/:id/preview', previewWorkbook);

// Persist parsed rows for review
router.post('/:id/persist', persistRows);

// Update header mapping
router.patch('/:id/mapping', updateMapping);

// Commit: create claims from accepted rows
router.post('/:id/commit', commitBatch);

// Rollback: delete claims created from a committed batch
router.post('/:id/rollback', rollbackBatch);

export default router;
