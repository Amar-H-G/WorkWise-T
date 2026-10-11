import { z } from 'zod';

const lineItemSchema = z.object({
  id: z.string().optional(), // For updates
  itemCode: z.string().max(100).optional(),
  description: z.string().min(1, 'Description is required').max(500),
  unit: z.string().max(50).default('Nos'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  taxPercent: z.number().min(0).max(100).default(18),
  sortOrder: z.number().int().default(0),
});

export const createPOSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  title: z.string().min(2, 'Title is required').max(300),
  description: z.string().max(2000).optional(),
  deliveryAddress: z.string().max(500).optional(),
  deliveryDate: z.string().datetime().optional().nullable(),
  currency: z.string().length(3).default('INR'),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

export const updatePOSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  description: z.string().max(2000).optional(),
  deliveryAddress: z.string().max(500).optional(),
  deliveryDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
});

export const poStatusSchema = z.object({
  action: z.enum(['approve', 'send', 'cancel', 'close'], {
    errorMap: () => ({ message: 'Invalid action' }),
  }),
  reason: z.string().max(500).optional(),
});

export const poQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z
    .enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_VENDOR', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CANCELLED', 'CLOSED'])
    .optional(),
  vendorId: z.string().optional(),
  sortBy: z.enum(['poNumber', 'createdAt', 'totalAmount', 'deliveryDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type CreatePOInput = z.infer<typeof createPOSchema>;
export type UpdatePOInput = z.infer<typeof updatePOSchema>;
export type POStatusInput = z.infer<typeof poStatusSchema>;
export type POQueryInput = z.infer<typeof poQuerySchema>;
