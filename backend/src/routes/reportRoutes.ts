import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';
import { reportLimiter, scanLimiter } from '../middlewares/rateLimiter';
import { cacheResponse } from '../middlewares/cacheResponse';

const router = Router();

// Retrieve multiple reports (filterable by query string: ?municipality_id=foo&status=In Review )
router.get('/', cacheResponse('reports', 30), reportController.getReports);

// Retrieve a single report by ID
router.get('/:id', cacheResponse('reports', 30), reportController.getReportById);

// Create a new report
router.post('/', reportLimiter, reportController.createReport);

// Scan image for sensitive data
router.post('/scan-image', scanLimiter, reportController.scanImage);

// Update a specific report (Status change)
router.put('/:id', withAuth, requireRole(['admin', 'superadmin']), reportController.updateReportStatus);

export default router;
