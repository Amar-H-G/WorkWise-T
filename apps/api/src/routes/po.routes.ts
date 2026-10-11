import { Router } from 'express';
import * as poController from '../controllers/po.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createPOSchema,
  updatePOSchema,
  poStatusSchema,
  poQuerySchema,
} from '../validators/po.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate(poQuerySchema, 'query'), poController.listPurchaseOrders);
router.get('/:id', poController.getPurchaseOrder);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createPOSchema), poController.createPurchaseOrder);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updatePOSchema), poController.updatePurchaseOrder);
router.patch('/:id/status', authorize('ADMIN', 'MANAGER'), validate(poStatusSchema), poController.updatePurchaseOrderStatus);

export default router;
