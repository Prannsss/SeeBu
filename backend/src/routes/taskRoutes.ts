import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

// Retrieve tasks
router.get('/', withAuth, requireRole(['admin', 'superadmin', 'workforce-admin', 'workforce']), taskController.getTasks);

// Update status (Assigned -> Accepted)
router.put('/:id', withAuth, requireRole(['admin', 'superadmin', 'workforce-admin', 'workforce']), taskController.updateTaskStatus);

// Complete task with Proof
router.post('/:id/complete', withAuth, taskController.completeTask);

export default router;
