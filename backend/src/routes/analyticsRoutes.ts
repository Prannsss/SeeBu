import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

// /api/v1/analytics/superadmin
router.get('/superadmin', withAuth, requireRole(['superadmin']), analyticsController.getSuperadminAnalytics);

// /api/v1/analytics/admin/:municipality_id
router.get('/admin/:municipality_id', withAuth, requireRole(['admin', 'superadmin']), analyticsController.getAdminAnalytics);

export default router;
