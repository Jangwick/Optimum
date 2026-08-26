import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import {
  getSettlement,
  upsertSettlement,
  listOffers,
  createOffer,
  respondToOffer,
} from '../controllers/settlement.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', getSettlement);
router.put('/', idempotencyMiddleware, upsertSettlement);
router.get('/offers', listOffers);
router.post('/offers', idempotencyMiddleware, createOffer);
router.put('/offers/:id/response', idempotencyMiddleware, respondToOffer);

export default router;
