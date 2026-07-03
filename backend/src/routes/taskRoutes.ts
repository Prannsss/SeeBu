import { Router } from 'express';
import { taskController } from '../controllers/taskController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';
import { reportLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Retrieve tasks
router.get('/', withAuth, requireRole(['admin', 'superadmin', 'workforce-admin', 'workforce']), taskController.getTasks);

// Update status (Assigned -> Accepted)
router.put('/:id', withAuth, requireRole(['admin', 'superadmin', 'workforce-admin', 'workforce']), taskController.updateTaskStatus);
router.patch('/:id', withAuth, requireRole(['admin', 'superadmin', 'workforce-admin', 'workforce']), taskController.updateTaskStatus);

// Complete task with Proof (includes image uploads)
router.post('/:id/complete', reportLimiter, withAuth, requireRole(['workforce']), taskController.completeTask);

export default router;
