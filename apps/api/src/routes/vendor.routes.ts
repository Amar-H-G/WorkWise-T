import { Router } from 'express';
import * as vendorController from '../controllers/vendor.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createVendorSchema,
  updateVendorSchema,
  vendorQuerySchema,
} from '../validators/vendor.validator';

const router = Router();

// All vendor routes require authentication
router.use(authenticate);

router.get('/categories', vendorController.getCategories);
router.get('/', validate(vendorQuerySchema, 'query'), vendorController.listVendors);
router.get('/:id', vendorController.getVendor);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createVendorSchema), vendorController.createVendor);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateVendorSchema), vendorController.updateVendor);
router.delete('/:id', authorize('ADMIN'), vendorController.deleteVendor);

export default router;
