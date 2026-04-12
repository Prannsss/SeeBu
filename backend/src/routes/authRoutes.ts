import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.registerClient);
router.post('/provision', authController.provision);

router.post('/google', authController.googleOAuthCallback);
router.post('/facebook', authController.facebookOAuthCallback);

router.post('/google', authController.googleOAuthCallback);
router.post('/facebook', authController.facebookOAuthCallback);

router.post('/google', authController.googleOAuthCallback);
router.post('/facebook', authController.facebookOAuthCallback);

export default router;
