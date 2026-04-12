import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { withAuth } from '../middlewares/withAuth';

const router = Router();

// /api/v1/analytics/superadmin
router.get('/superadmin', withAuth, analyticsController.getSuperadminAnalytics);

// /api/v1/analytics/admin/:municipality_id
router.get('/admin/:municipality_id', withAuth, analyticsController.getAdminAnalytics);

export default router;
