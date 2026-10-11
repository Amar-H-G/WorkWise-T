import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import type { CreateVendorInput, UpdateVendorInput, VendorQueryInput } from '../validators/vendor.validator';

function generateVendorCode(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `VND-${num}`;
}

async function getUniqueVendorCode(): Promise<string> {
  let code: string;
  let exists = true;
  let attempts = 0;

  do {
    code = generateVendorCode();
    const existing = await prisma.vendor.findUnique({ where: { code } });
    exists = !!existing;
    attempts++;
    if (attempts > 20) throw new AppError(500, 'Could not generate unique vendor code');
  } while (exists);

  return code;
}

export async function listVendors(query: VendorQueryInput) {
  const { page, limit, search, status, category, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.VendorWhereInput = {
    ...(status && { status }),
    ...(category && { category: { contains: category, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [vendors, total] = await prisma.$transaction([
    prisma.vendor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        contacts: { where: { isPrimary: true }, take: 1 },
        _count: { select: { purchaseOrders: true } },
      },
    }),
    prisma.vendor.count({ where }),
  ]);

  return {
    vendors,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    },
  };
}

export async function getVendorById(id: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      contacts: true,
      _count: {
        select: {
          purchaseOrders: true,
        },
      },
    },
  });

  if (!vendor) {
    throw new AppError(404, 'Vendor not found', 'NOT_FOUND');
  }

  return vendor;
}

export async function createVendor(input: CreateVendorInput, userId: string) {
  const code = await getUniqueVendorCode();

  const vendor = await prisma.vendor.create({
    data: {
      ...input,
      code,
      website: input.website || null,
    },
    include: { contacts: true },
  });

  logger.info('Vendor created', { vendorId: vendor.id, userId, code: vendor.code });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      type: 'VENDOR_CREATED',
      entityType: 'Vendor',
      entityId: vendor.id,
      entityLabel: vendor.name,
      description: `Created vendor ${vendor.name} (${vendor.code})`,
    },
  });

  return vendor;
}

export async function updateVendor(id: string, input: UpdateVendorInput, userId: string) {
  const existing = await prisma.vendor.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Vendor not found', 'NOT_FOUND');
  }

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      ...input,
      website: input.website || null,
    },
    include: { contacts: true },
  });

  logger.info('Vendor updated', { vendorId: id, userId });

  await prisma.activityLog.create({
    data: {
      userId,
      type: 'VENDOR_UPDATED',
      entityType: 'Vendor',
      entityId: vendor.id,
      entityLabel: vendor.name,
      description: `Updated vendor ${vendor.name} (${vendor.code})`,
    },
  });

  return vendor;
}

export async function deleteVendor(id: string) {
  const existing = await prisma.vendor.findUnique({
    where: { id },
    include: { _count: { select: { purchaseOrders: true } } },
  });

  if (!existing) {
    throw new AppError(404, 'Vendor not found', 'NOT_FOUND');
  }

  if (existing._count.purchaseOrders > 0) {
    throw new AppError(
      409,
      'Cannot delete vendor with existing purchase orders. Set status to INACTIVE instead.',
      'HAS_DEPENDENCIES'
    );
  }

  await prisma.vendor.delete({ where: { id } });
  logger.info('Vendor deleted', { vendorId: id });
}

export async function getVendorCategories(): Promise<string[]> {
  const categories = await prisma.vendor.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return categories.map((v) => v.category);
}
