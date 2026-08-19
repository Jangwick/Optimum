import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listTasks, createTask, updateTask, deleteTask } from '../controllers/task.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
