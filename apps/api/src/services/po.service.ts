import { Decimal } from '@prisma/client/runtime/library';
import { Prisma, POStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import type { CreatePOInput, UpdatePOInput, POQueryInput, POStatusInput } from '../validators/po.validator';
import type { AuthPayload } from '../types';

let poCounter = 0;

async function generatePONumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count();
  const seq = String(count + 1 + poCounter++).padStart(4, '0');
  return `PO-${year}-${seq}`;
}

function calculateLineItemTotal(qty: number, unitPrice: number, taxPercent: number): Decimal {
  const subtotal = qty * unitPrice;
  const tax = (subtotal * taxPercent) / 100;
  return new Decimal(subtotal + tax).toDecimalPlaces(2);
}

function calculateOrderTotals(lineItems: Array<{ quantity: number; unitPrice: number; taxPercent: number }>) {
  let subtotal = new Decimal(0);
  let taxAmount = new Decimal(0);

  for (const item of lineItems) {
    const itemSubtotal = new Decimal(item.quantity * item.unitPrice).toDecimalPlaces(2);
    const itemTax = itemSubtotal.mul(item.taxPercent / 100).toDecimalPlaces(2);
    subtotal = subtotal.add(itemSubtotal);
    taxAmount = taxAmount.add(itemTax);
  }

  const totalAmount = subtotal.add(taxAmount);
  return { subtotal, taxAmount, totalAmount };
}

export async function listPurchaseOrders(query: POQueryInput) {
  const { page, limit, search, status, vendorId, sortBy, sortOrder, dateFrom, dateTo } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.PurchaseOrderWhereInput = {
    ...(status && { status }),
    ...(vendorId && { vendorId }),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };

  const [orders, total] = await prisma.$transaction([
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        vendor: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        _count: { select: { lineItems: true, goodsReceipts: true } },
      },
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return {
    orders,
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

export async function getPurchaseOrderById(id: string) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: { include: { contacts: { where: { isPrimary: true }, take: 1 } } },
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
      lineItems: { orderBy: { sortOrder: 'asc' } },
      goodsReceipts: {
        include: {
          receivedBy: { select: { id: true, name: true } },
          lineItems: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    throw new AppError(404, 'Purchase order not found', 'NOT_FOUND');
  }

  return order;
}

export async function createPurchaseOrder(input: CreatePOInput, user: AuthPayload) {
  // Verify vendor exists and is active
  const vendor = await prisma.vendor.findUnique({ where: { id: input.vendorId } });
  if (!vendor) {
    throw new AppError(404, 'Vendor not found', 'NOT_FOUND');
  }
  if (vendor.status !== 'ACTIVE') {
    throw new AppError(400, 'Cannot create PO for an inactive vendor', 'VENDOR_INACTIVE');
  }

  const poNumber = await generatePONumber();
  const { subtotal, taxAmount, totalAmount } = calculateOrderTotals(input.lineItems);

  const order = await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.create({
      data: {
        poNumber,
        vendorId: input.vendorId,
        createdById: user.userId,
        title: input.title,
        description: input.description,
        deliveryAddress: input.deliveryAddress,
        deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
        currency: input.currency,
        notes: input.notes,
        terms: input.terms,
        subtotal,
        taxAmount,
        totalAmount,
        status: 'DRAFT',
        lineItems: {
          create: input.lineItems.map((item, idx) => ({
            itemCode: item.itemCode,
            description: item.description,
            unit: item.unit,
            quantity: new Decimal(item.quantity),
            unitPrice: new Decimal(item.unitPrice),
            taxPercent: new Decimal(item.taxPercent),
            totalPrice: calculateLineItemTotal(item.quantity, item.unitPrice, item.taxPercent),
            sortOrder: item.sortOrder || idx,
          })),
        },
      },
      include: {
        vendor: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    await tx.activityLog.create({
      data: {
        userId: user.userId,
        type: 'PO_CREATED',
        entityType: 'PurchaseOrder',
        entityId: po.id,
        entityLabel: po.poNumber,
        description: `Created purchase order ${po.poNumber} for ${vendor.name}`,
        metadata: { totalAmount: totalAmount.toString() },
      },
    });

    return po;
  });

  logger.info('Purchase order created', { poId: order.id, poNumber: order.poNumber, userId: user.userId });
  return order;
}

export async function updatePurchaseOrder(id: string, input: UpdatePOInput, userId: string) {
  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { lineItems: true },
  });

  if (!existing) {
    throw new AppError(404, 'Purchase order not found', 'NOT_FOUND');
  }

  if (!['DRAFT', 'PENDING_APPROVAL'].includes(existing.status)) {
    throw new AppError(400, 'Only DRAFT or PENDING_APPROVAL orders can be edited', 'INVALID_STATUS');
  }

  const lineItems = input.lineItems || existing.lineItems.map(li => ({
    quantity: Number(li.quantity),
    unitPrice: Number(li.unitPrice),
    taxPercent: Number(li.taxPercent),
  }));

  const { subtotal, taxAmount, totalAmount } = calculateOrderTotals(
    lineItems.map(li => ({
      quantity: 'quantity' in li ? Number(li.quantity) : 0,
      unitPrice: 'unitPrice' in li ? Number(li.unitPrice) : 0,
      taxPercent: 'taxPercent' in li ? Number(li.taxPercent) : 0,
    }))
  );

  const order = await prisma.$transaction(async (tx) => {
    if (input.lineItems) {
      await tx.pOLineItem.deleteMany({ where: { purchaseOrderId: id } });
    }

    const po = await tx.purchaseOrder.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        deliveryAddress: input.deliveryAddress,
        deliveryDate: input.deliveryDate !== undefined
          ? (input.deliveryDate ? new Date(input.deliveryDate) : null)
          : undefined,
        notes: input.notes,
        terms: input.terms,
        subtotal,
        taxAmount,
        totalAmount,
        ...(input.lineItems && {
          lineItems: {
            create: input.lineItems.map((item, idx) => ({
              itemCode: item.itemCode,
              description: item.description,
              unit: item.unit,
              quantity: new Decimal(item.quantity),
              unitPrice: new Decimal(item.unitPrice),
              taxPercent: new Decimal(item.taxPercent),
              totalPrice: calculateLineItemTotal(item.quantity, item.unitPrice, item.taxPercent),
              sortOrder: item.sortOrder || idx,
            })),
          },
        }),
      },
      include: {
        vendor: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return po;
  });

  logger.info('Purchase order updated', { poId: id, userId });
  return order;
}

const STATUS_TRANSITIONS: Record<string, POStatus> = {
  approve: 'APPROVED',
  send: 'SENT_TO_VENDOR',
  cancel: 'CANCELLED',
  close: 'CLOSED',
};

const ALLOWED_TRANSITIONS: Record<POStatus, string[]> = {
  DRAFT: ['approve', 'cancel'],
  PENDING_APPROVAL: ['approve', 'cancel'],
  APPROVED: ['send', 'cancel'],
  SENT_TO_VENDOR: ['cancel'],
  PARTIALLY_RECEIVED: ['close'],
  FULLY_RECEIVED: ['close'],
  CANCELLED: [],
  CLOSED: [],
};

export async function updatePurchaseOrderStatus(
  id: string,
  input: POStatusInput,
  user: AuthPayload
) {
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(404, 'Purchase order not found', 'NOT_FOUND');
  }

  const allowed = ALLOWED_TRANSITIONS[existing.status] || [];
  if (!allowed.includes(input.action)) {
    throw new AppError(
      400,
      `Cannot ${input.action} a PO with status ${existing.status}`,
      'INVALID_TRANSITION'
    );
  }

  // Only admin/manager can approve
  if (input.action === 'approve' && user.role === 'VIEWER') {
    throw new AppError(403, 'Only managers and admins can approve POs', 'FORBIDDEN');
  }

  const newStatus = STATUS_TRANSITIONS[input.action]!;

  const order = await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        ...(input.action === 'approve' && {
          approvedById: user.userId,
          approvedAt: new Date(),
        }),
        ...(input.action === 'send' && { sentAt: new Date() }),
      },
    });

    const activityType = {
      approve: 'PO_APPROVED' as const,
      send: 'PO_SENT' as const,
      cancel: 'PO_CANCELLED' as const,
      close: 'PO_CANCELLED' as const,
    }[input.action]!;

    await tx.activityLog.create({
      data: {
        userId: user.userId,
        type: activityType,
        entityType: 'PurchaseOrder',
        entityId: po.id,
        entityLabel: po.poNumber,
        description: `${input.action.charAt(0).toUpperCase() + input.action.slice(1)}d PO ${po.poNumber}`,
        metadata: input.reason ? { reason: input.reason } : undefined,
      },
    });

    return po;
  });

  logger.info('PO status updated', { poId: id, action: input.action, newStatus, userId: user.userId });
  return order;
}
