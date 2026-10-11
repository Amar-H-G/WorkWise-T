import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import { AppError } from './errorHandler';
import { AuthRequest, AuthPayload } from '../types';

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required', 'AUTH_REQUIRED');
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required', 'AUTH_REQUIRED'));
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
      return;
    }

    next();
  };
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      req.user = payload;
    }

    next();
  } catch {
    // Token invalid/expired - continue without auth
    next();
  }
}
