import { Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { AuthRequest } from '../types';

export async function getMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const metrics = await dashboardService.getDashboardMetrics();
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
}

export async function getActivity(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 50);
    const activities = await dashboardService.getRecentActivity(limit);
    res.json({ success: true, data: activities });
  } catch (err) {
    next(err);
  }
}
