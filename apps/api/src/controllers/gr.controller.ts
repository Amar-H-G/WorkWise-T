import { Response, NextFunction } from 'express';
import * as grService from '../services/gr.service';
import { AuthRequest } from '../types';

export async function listGoodsReceipts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await grService.listGoodsReceipts(req.query as any);
    res.json({ success: true, data: result.receipts, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function getGoodsReceipt(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const gr = await grService.getGoodsReceiptById(req.params['id']!);
    res.json({ success: true, data: gr });
  } catch (err) {
    next(err);
  }
}

export async function createGoodsReceipt(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const gr = await grService.createGoodsReceipt(req.body, req.user!);
    res.status(201).json({ success: true, data: gr, message: 'Goods receipt created successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updateGoodsReceiptStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const gr = await grService.updateGoodsReceiptStatus(req.params['id']!, req.body, req.user!.userId);
    res.json({ success: true, data: gr, message: 'Goods receipt updated successfully' });
  } catch (err) {
    next(err);
  }
}
