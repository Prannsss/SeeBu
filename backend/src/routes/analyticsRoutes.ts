import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';
import { cacheResponse } from '../middlewares/cacheResponse';

const router = Router();

// /api/v1/analytics/superadmin
router.get('/superadmin', withAuth, requireRole(['superadmin']), cacheResponse('analytics', 60), analyticsController.getSuperadminAnalytics);

// /api/v1/analytics/admin/:municipality_id
router.get('/admin/:municipality_id', withAuth, requireRole(['admin', 'superadmin']), cacheResponse('analytics', 60), analyticsController.getAdminAnalytics);

export default router;
