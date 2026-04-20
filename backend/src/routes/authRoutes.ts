import { Router } from 'express';
import { authController } from '../controllers/authController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.registerClient);
router.post('/provision', withAuth, requireRole(['superadmin', 'admin', 'workforce-admin']), authController.provision);

router.post('/google', authController.googleOAuthCallback);
router.post('/facebook', authController.facebookOAuthCallback);

export default router;
