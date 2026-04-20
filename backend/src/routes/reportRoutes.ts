import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

// Retrieve multiple reports (filterable by query string: ?municipality_id=foo&status=In Review )
router.get('/', reportController.getReports);

// Retrieve a single report by ID
router.get('/:id', reportController.getReportById);

// Create a new report
router.post('/', reportController.createReport);

// Update a specific report (Status change)
router.put('/:id', withAuth, requireRole(['admin', 'superadmin']), reportController.updateReportStatus);

export default router;
