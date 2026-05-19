"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const withAuth_1 = require("../middlewares/withAuth");
const requireRole_1 = require("../middlewares/requireRole");
const rateLimiter_1 = require("../middlewares/rateLimiter");
const router = (0, express_1.Router)();
// Public auth routes with rate limiting
router.post('/login', rateLimiter_1.authLimiter, authController_1.authController.login);
router.post('/register', rateLimiter_1.authLimiter, authController_1.authController.registerClient);
router.post('/forgot-password', rateLimiter_1.authLimiter, authController_1.authController.forgotPassword);
router.post('/verify-reset-code', rateLimiter_1.authLimiter, authController_1.authController.verifyResetCode);
router.post('/reset-password', rateLimiter_1.authLimiter, authController_1.authController.resetPassword);
router.post('/verify-email', rateLimiter_1.authLimiter, authController_1.authController.verifyEmail);
router.post('/resend-verification', rateLimiter_1.authLimiter, authController_1.authController.resendVerification);
// OAuth callbacks with rate limiting
router.post('/google', rateLimiter_1.authLimiter, authController_1.authController.googleOAuthCallback);
router.post('/facebook', rateLimiter_1.authLimiter, authController_1.authController.facebookOAuthCallback);
// Protected provisioning (requires auth + elevated role)
router.post('/provision', withAuth_1.withAuth, (0, requireRole_1.requireRole)(['superadmin', 'admin', 'workforce-admin']), authController_1.authController.provision);
exports.default = router;
