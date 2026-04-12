import { Router } from 'express';
import { userController } from '../controllers/userController';
import { withAuth } from '../middlewares/withAuth';

const router = Router();

// /api/v1/users/me (Get current logged in user)
router.get('/me', withAuth, userController.getCurrentUser);
router.patch('/me', withAuth, userController.updateCurrentUser);

// /api/v1/users (Global view for super admins)
router.get('/', withAuth, userController.getAllUsers);

export default router;
