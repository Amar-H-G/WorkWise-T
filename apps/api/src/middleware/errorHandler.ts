import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function createError(statusCode: number, message: string, code?: string): AppError {
  return new AppError(statusCode, message, code);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let errors: Record<string, string[]> | undefined;

  // Operational errors (AppError)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'APP_ERROR';
  }

  // Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    code = 'VALIDATION_ERROR';
    errors = {};
    err.errors.forEach((e) => {
      const field = e.path.join('.');
      if (!errors![field]) errors![field] = [];
      errors![field]!.push(e.message);
    });
  }

  // Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this value already exists';
        code = 'DUPLICATE_ERROR';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        code = 'NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Related record not found';
        code = 'FOREIGN_KEY_ERROR';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
        code = 'DATABASE_ERROR';
    }
  }

  // JWT errors
  else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = 'Token has expired';
    code = 'TOKEN_EXPIRED';
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error('Unhandled error', {
      error: err.message,
      stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
      statusCode,
    });
  } else {
    logger.warn('Request error', { error: err.message, statusCode, code });
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    message: code,
    ...(errors && { data: { errors } }),
  };

  // Never expose stack traces in production
  if (env.NODE_ENV !== 'production' && statusCode >= 500) {
    (response as ApiResponse & { stack?: string }).stack = err.stack;
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    message: 'NOT_FOUND',
  } as ApiResponse);
}
