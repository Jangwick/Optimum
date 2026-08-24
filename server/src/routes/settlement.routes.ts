import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
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
router.put('/', upsertSettlement);
router.get('/offers', listOffers);
router.post('/offers', createOffer);
router.put('/offers/:id/response', respondToOffer);

export default router;
