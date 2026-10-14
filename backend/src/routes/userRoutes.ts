import { Router } from 'express';
import { userController } from '../controllers/userController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';
import { cacheResponse } from '../middlewares/cacheResponse';

const router = Router();

// /api/v1/users/me (Get current logged in user)
router.get('/me', withAuth, cacheResponse('users', 60), userController.getCurrentUser);
router.patch('/me', withAuth, userController.updateCurrentUser);
router.delete('/me', withAuth, userController.deleteCurrentUser);

// /api/v1/users (Global view for super admins)
router.get('/', withAuth, requireRole(['superadmin']), cacheResponse('users', 60), userController.getAllUsers);

export default router;
