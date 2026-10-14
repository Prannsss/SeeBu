import { Router } from 'express';
import { authController } from '../controllers/authController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';
import { authLimiter, otpLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public auth routes with rate limiting
router.post('/login', authLimiter, authController.login);
router.post('/register', authLimiter, authController.registerClient);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/verify-reset-code', authLimiter, otpLimiter, authController.verifyResetCode);
router.post('/reset-password', authLimiter, otpLimiter, authController.resetPassword);
router.post('/verify-email', authLimiter, otpLimiter, authController.verifyEmail);
router.post('/resend-verification', authLimiter, authController.resendVerification);

// OAuth callbacks with rate limiting
router.post('/google', authLimiter, authController.googleOAuthCallback);
router.post('/facebook', authLimiter, authController.facebookOAuthCallback);

// Protected provisioning (requires auth + elevated role)
router.post('/provision', withAuth, requireRole(['superadmin', 'admin', 'workforce-admin']), authController.provision);

export default router;
