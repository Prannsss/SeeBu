"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const withAuth_1 = require("../middlewares/withAuth");
const requireRole_1 = require("../middlewares/requireRole");
const router = (0, express_1.Router)();
// Public auth routes
router.post('/login', authController_1.authController.login);
router.post('/register', authController_1.authController.registerClient);
router.post('/forgot-password', authController_1.authController.forgotPassword);
router.post('/verify-reset-code', authController_1.authController.verifyResetCode);
router.post('/reset-password', authController_1.authController.resetPassword);
router.post('/verify-email', authController_1.authController.verifyEmail);
router.post('/resend-verification', authController_1.authController.resendVerification);
// Protected provisioning (requires auth + elevated role)
router.post('/provision', withAuth_1.withAuth, (0, requireRole_1.requireRole)(['superadmin', 'admin', 'workforce-admin']), authController_1.authController.provision);
// OAuth callbacks
router.post('/google', authController_1.authController.googleOAuthCallback);
router.post('/facebook', authController_1.authController.facebookOAuthCallback);
exports.default = router;
