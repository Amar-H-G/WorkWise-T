import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  legalName: z.string().max(200).optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required').max(100),
  registrationNo: z.string().max(100).optional(),
  taxId: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).default('India'),
  pincode: z.string().max(10).optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING_REVIEW']).default('ACTIVE'),
});

export const updateVendorSchema = createVendorSchema.partial();

export const vendorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED', 'PENDING_REVIEW']).optional(),
  category: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'rating', 'category']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createVendorContactSchema = z.object({
  name: z.string().min(1).max(100),
  designation: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  isPrimary: z.boolean().default(false),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type VendorQueryInput = z.infer<typeof vendorQuerySchema>;
