import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listInvoices, createInvoice, getInvoice, recordPayment } from '../controllers/invoice.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listInvoices);
router.post('/', createInvoice);
router.get('/:id', getInvoice);
router.post('/:id/payments', recordPayment);

export default router;
