import { Router } from 'express';
import { invitationController } from '../controllers/invitationController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();
const team = [withAuth, requireRole(['admin', 'workforce-admin'])];

// Admins invite co-admins and workforce admins; workforce admins invite officers to their department.
// Each sees and manages its own team's invitations (by municipality / department).
router.get('/', ...team, invitationController.list);
router.post('/', ...team, invitationController.create);
router.post('/:id/cancel', ...team, invitationController.cancel);
router.post('/:id/revoke', ...team, invitationController.revoke);
router.post('/:id/restore', ...team, invitationController.restore);

// Public: the emailed link's token is the credential. Rate-limited like the other auth endpoints.
router.get('/:token', authLimiter, invitationController.get);
router.post('/:token/accept', authLimiter, invitationController.accept);
router.post('/:token/decline', authLimiter, invitationController.decline);

export default router;
