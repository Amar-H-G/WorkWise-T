import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';
import type { CreateGRInput, GRQueryInput, UpdateGRStatusInput } from '../validators/gr.validator';
import type { AuthPayload } from '../types';

async function generateGRNumber(): Promise<string> {
  const year = new Date().getFullYear();
  let grNumber = '';
  let exists = true;
  let attempts = 0;

  do {
    const count = await prisma.goodsReceipt.count();
    const seq = String(count + 1 + attempts).padStart(4, '0');
    grNumber = `GR-${year}-${seq}`;
    const found = await prisma.goodsReceipt.findUnique({ where: { grNumber } });
    exists = !!found;
    attempts++;
  } while (exists && attempts < 50);

  if (exists) {
    grNumber = `GR-${year}-${Date.now().toString().slice(-4)}`;
  }
  return grNumber;
}

export async function listGoodsReceipts(query: GRQueryInput) {
  const { page, limit, status, purchaseOrderId, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.GoodsReceiptWhereInput = {
    ...(status && { status }),
    ...(purchaseOrderId && { purchaseOrderId }),
  };

  const [receipts, total] = await prisma.$transaction([
    prisma.goodsReceipt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            title: true,
            vendor: { select: { id: true, name: true } },
          },
        },
        receivedBy: { select: { id: true, name: true } },
        _count: { select: { lineItems: true } },
      },
    }),
    prisma.goodsReceipt.count({ where }),
  ]);

  return {
    receipts,
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

export async function getGoodsReceiptById(id: string) {
  const gr = await prisma.goodsReceipt.findUnique({
    where: { id },
    include: {
      purchaseOrder: {
        include: {
          vendor: { select: { id: true, name: true } },
          lineItems: true,
        },
      },
      receivedBy: { select: { id: true, name: true } },
      lineItems: {
        include: {
          poLineItem: true,
        },
      },
    },
  });

  if (!gr) {
    throw new AppError(404, 'Goods receipt not found', 'NOT_FOUND');
  }

  return gr;
}

export async function createGoodsReceipt(input: CreateGRInput, user: AuthPayload) {
  // Verify PO exists and is in a receivable state
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: input.purchaseOrderId },
    include: { lineItems: true },
  });

  if (!po) {
    throw new AppError(404, 'Purchase order not found', 'NOT_FOUND');
  }

  if (!['SENT_TO_VENDOR', 'PARTIALLY_RECEIVED'].includes(po.status)) {
    throw new AppError(
      400,
      'Can only receive goods for POs in SENT_TO_VENDOR or PARTIALLY_RECEIVED status',
      'INVALID_PO_STATUS'
    );
  }

  // Validate line items against PO
  for (const item of input.lineItems) {
    const poLineItem = po.lineItems.find((li) => li.id === item.poLineItemId);
    if (!poLineItem) {
      throw new AppError(400, `PO line item ${item.poLineItemId} not found`, 'INVALID_LINE_ITEM');
    }

    const remainingQty = Number(poLineItem.quantity) - Number(poLineItem.receivedQty);
    if (item.receivedQty > remainingQty) {
      throw new AppError(
        400,
        `Received quantity (${item.receivedQty}) exceeds remaining ordered quantity (${remainingQty}) for "${poLineItem.description}"`,
        'QUANTITY_EXCEEDED'
      );
    }
  }

  const grNumber = await generateGRNumber();

  const gr = await prisma.$transaction(async (tx) => {
    // Create the goods receipt
    const receipt = await tx.goodsReceipt.create({
      data: {
        grNumber,
        purchaseOrderId: input.purchaseOrderId,
        receivedById: user.userId,
        receivedDate: input.receivedDate ? new Date(input.receivedDate) : new Date(),
        vehicleNumber: input.vehicleNumber,
        driverName: input.driverName,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate ? new Date(input.invoiceDate) : null,
        notes: input.notes,
        status: 'DRAFT',
        lineItems: {
          create: input.lineItems.map((item) => ({
            poLineItemId: item.poLineItemId,
            receivedQty: new Decimal(item.receivedQty),
            acceptedQty: new Decimal(item.acceptedQty),
            rejectedQty: new Decimal(item.rejectedQty),
            remarks: item.remarks,
          })),
        },
      },
      include: {
        lineItems: { include: { poLineItem: true } },
      },
    });

    // Update received quantities on PO line items
    for (const grItem of receipt.lineItems) {
      await tx.pOLineItem.update({
        where: { id: grItem.poLineItemId },
        data: {
          receivedQty: {
            increment: grItem.receivedQty,
          },
        },
      });
    }

    // Recalculate PO receipt status
    const updatedLineItems = await tx.pOLineItem.findMany({
      where: { purchaseOrderId: input.purchaseOrderId },
    });

    const allFullyReceived = updatedLineItems.every(
      (li) => Number(li.receivedQty) >= Number(li.quantity)
    );
    const anyReceived = updatedLineItems.some((li) => Number(li.receivedQty) > 0);

    const newPOStatus = allFullyReceived
      ? 'FULLY_RECEIVED'
      : anyReceived
      ? 'PARTIALLY_RECEIVED'
      : po.status;

    await tx.purchaseOrder.update({
      where: { id: input.purchaseOrderId },
      data: { status: newPOStatus },
    });

    await tx.activityLog.create({
      data: {
        userId: user.userId,
        type: 'GR_CREATED',
        entityType: 'GoodsReceipt',
        entityId: receipt.id,
        entityLabel: receipt.grNumber,
        description: `Created goods receipt ${receipt.grNumber} for PO ${po.poNumber}`,
      },
    });

    return receipt;
  });

  logger.info('Goods receipt created', { grId: gr.id, grNumber: gr.grNumber, userId: user.userId });
  return gr;
}

export async function updateGoodsReceiptStatus(
  id: string,
  input: UpdateGRStatusInput,
  userId: string
) {
  const gr = await prisma.goodsReceipt.findUnique({ where: { id } });
  if (!gr) {
    throw new AppError(404, 'Goods receipt not found', 'NOT_FOUND');
  }

  const STATUS_TRANSITIONS: Record<string, string> = {
    confirm: 'CONFIRMED',
    inspect: 'INSPECTED',
    accept: 'ACCEPTED',
    reject: 'REJECTED',
  };

  const ALLOWED: Record<string, string[]> = {
    DRAFT: ['confirm'],
    CONFIRMED: ['inspect'],
    INSPECTED: ['accept', 'reject'],
    ACCEPTED: [],
    REJECTED: [],
  };

  if (!ALLOWED[gr.status]?.includes(input.action)) {
    throw new AppError(400, `Cannot ${input.action} a GR with status ${gr.status}`, 'INVALID_TRANSITION');
  }

  if (input.action === 'reject' && !input.rejectionReason) {
    throw new AppError(400, 'Rejection reason is required', 'VALIDATION_ERROR');
  }

  const updated = await prisma.goodsReceipt.update({
    where: { id },
    data: {
      status: STATUS_TRANSITIONS[input.action] as 'CONFIRMED' | 'INSPECTED' | 'ACCEPTED' | 'REJECTED',
      rejectionReason: input.rejectionReason,
    },
  });

  logger.info('GR status updated', { grId: id, action: input.action, userId });
  return updated;
}
