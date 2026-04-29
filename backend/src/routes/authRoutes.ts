import { Router } from 'express';
import { authController } from '../controllers/authController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

// Public auth routes
router.post('/login', authController.login);
router.post('/register', authController.registerClient);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Protected provisioning (requires auth + elevated role)
router.post('/provision', withAuth, requireRole(['superadmin', 'admin', 'workforce-admin']), authController.provision);

// OAuth callbacks
router.post('/google', authController.googleOAuthCallback);
router.post('/facebook', authController.facebookOAuthCallback);

export default router;
