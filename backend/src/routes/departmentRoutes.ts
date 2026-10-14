import { Router } from 'express';
import { departmentController } from '../controllers/departmentController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';
import { cacheResponse } from '../middlewares/cacheResponse';

const router = Router();

router.get('/', withAuth, requireRole(['superadmin', 'admin', 'workforce-admin', 'workforce']), cacheResponse('departments', 120), departmentController.getDepartments);
router.get('/:id/personnel', withAuth, requireRole(['superadmin', 'admin', 'workforce-admin', 'workforce']), cacheResponse('departments', 120), departmentController.getDepartmentPersonnel);

export default router;
