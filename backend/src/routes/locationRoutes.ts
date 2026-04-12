import { Router } from 'express';
import { locationController } from '../controllers/locationController';

const router = Router();

router.get('/', locationController.getLocations);

export default router;
