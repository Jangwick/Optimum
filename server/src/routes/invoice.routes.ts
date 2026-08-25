import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { listInvoices, createInvoice, getInvoice, recordPayment } from '../controllers/invoice.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listInvoices);
router.post('/', idempotencyMiddleware, createInvoice);
router.get('/:id', getInvoice);
router.post('/:id/payments', recordPayment);

export default router;
