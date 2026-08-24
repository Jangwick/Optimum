import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listContacts, createContact, updateContact, deleteContact } from '../controllers/contact.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', listContacts);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
