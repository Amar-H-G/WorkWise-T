import { Response, NextFunction } from 'express';
import * as poService from '../services/po.service';
import { AuthRequest } from '../types';

export async function listPurchaseOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await poService.listPurchaseOrders(req.query as any);
    res.json({ success: true, data: result.orders, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function getPurchaseOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await poService.getPurchaseOrderById(req.params['id']!);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function createPurchaseOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await poService.createPurchaseOrder(req.body, req.user!);
    res.status(201).json({ success: true, data: order, message: 'Purchase order created successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updatePurchaseOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await poService.updatePurchaseOrder(req.params['id']!, req.body, req.user!.userId);
    res.json({ success: true, data: order, message: 'Purchase order updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updatePurchaseOrderStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await poService.updatePurchaseOrderStatus(req.params['id']!, req.body, req.user!);
    res.json({ success: true, data: order, message: `Purchase order ${req.body.action}d successfully` });
  } catch (err) {
    next(err);
  }
}
