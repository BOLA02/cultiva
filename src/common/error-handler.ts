import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { HttpStatus } from './http-status';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  logger.error('Unexpected error', {
    code: (err as any).code,
    message: err.message,
    meta: (err as any).meta,
    stack: err.stack,
  });

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
};