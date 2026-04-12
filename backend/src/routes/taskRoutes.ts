import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { withAuth } from '../middlewares/withAuth';

const router = Router();

// Retrieve tasks
router.get('/', taskController.getTasks);

// Update status (Assigned -> Accepted)
router.put('/:id', withAuth, taskController.updateTaskStatus);

// Complete task with Proof
router.post('/:id/complete', withAuth, taskController.completeTask);

export default router;
