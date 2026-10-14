import { Router } from 'express';
import { locationController } from '../controllers/locationController';
import { cacheResponse } from '../middlewares/cacheResponse';

const router = Router();

router.get('/', cacheResponse('locations', 600), locationController.getLocations);

export default router;
