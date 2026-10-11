import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/metrics', dashboardController.getMetrics);
router.get('/activity', dashboardController.getActivity);

export default router;
