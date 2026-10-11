import { Response, NextFunction } from 'express';
import * as vendorService from '../services/vendor.service';
import { AuthRequest } from '../types';

export async function listVendors(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await vendorService.listVendors(req.query as any);
    res.json({ success: true, data: result.vendors, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function getVendor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendor = await vendorService.getVendorById(req.params['id']!);
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
}

export async function createVendor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendor = await vendorService.createVendor(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: vendor, message: 'Vendor created successfully' });
  } catch (err) {
    next(err);
  }
}

export async function updateVendor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const vendor = await vendorService.updateVendor(req.params['id']!, req.body, req.user!.userId);
    res.json({ success: true, data: vendor, message: 'Vendor updated successfully' });
  } catch (err) {
    next(err);
  }
}

export async function deleteVendor(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await vendorService.deleteVendor(req.params['id']!);
    res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await vendorService.getVendorCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}
