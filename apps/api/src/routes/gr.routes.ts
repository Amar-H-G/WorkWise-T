import { Router } from 'express';
import * as grController from '../controllers/gr.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createGRSchema, updateGRStatusSchema, grQuerySchema } from '../validators/gr.validator';

const router = Router();

router.use(authenticate);

router.get('/', validate(grQuerySchema, 'query'), grController.listGoodsReceipts);
router.get('/:id', grController.getGoodsReceipt);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createGRSchema), grController.createGoodsReceipt);
router.patch('/:id/status', authorize('ADMIN', 'MANAGER'), validate(updateGRStatusSchema), grController.updateGoodsReceiptStatus);

export default router;
