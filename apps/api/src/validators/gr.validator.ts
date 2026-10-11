import { z } from 'zod';

const grLineItemSchema = z.object({
  poLineItemId: z.string().min(1, 'PO line item ID is required'),
  receivedQty: z.number().min(0, 'Received quantity must be non-negative'),
  acceptedQty: z.number().min(0, 'Accepted quantity must be non-negative'),
  rejectedQty: z.number().min(0, 'Rejected quantity must be non-negative').default(0),
  remarks: z.string().max(500).optional(),
}).refine(
  (data) => data.acceptedQty + data.rejectedQty <= data.receivedQty,
  { message: 'Accepted + rejected quantities cannot exceed received quantity' }
);

export const createGRSchema = z.object({
  purchaseOrderId: z.string().min(1, 'Purchase order is required'),
  receivedDate: z.string().datetime().optional(),
  vehicleNumber: z.string().max(50).optional(),
  driverName: z.string().max(100).optional(),
  invoiceNumber: z.string().max(100).optional(),
  invoiceDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional(),
  lineItems: z.array(grLineItemSchema).min(1, 'At least one line item is required'),
});

export const updateGRStatusSchema = z.object({
  action: z.enum(['confirm', 'inspect', 'accept', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

export const grQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'CONFIRMED', 'INSPECTED', 'ACCEPTED', 'REJECTED']).optional(),
  purchaseOrderId: z.string().optional(),
  sortBy: z.enum(['grNumber', 'receivedDate', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateGRInput = z.infer<typeof createGRSchema>;
export type UpdateGRStatusInput = z.infer<typeof updateGRStatusSchema>;
export type GRQueryInput = z.infer<typeof grQuerySchema>;
