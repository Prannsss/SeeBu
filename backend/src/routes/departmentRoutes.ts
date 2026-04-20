import { Router } from 'express';
import { departmentController } from '../controllers/departmentController';
import { withAuth } from '../middlewares/withAuth';
import { requireRole } from '../middlewares/requireRole';

const router = Router();

router.get('/', withAuth, requireRole(['superadmin', 'admin', 'workforce-admin', 'workforce']), departmentController.getDepartments);
router.get('/:id/personnel', withAuth, requireRole(['superadmin', 'admin', 'workforce-admin', 'workforce']), departmentController.getDepartmentPersonnel);

export default router;
