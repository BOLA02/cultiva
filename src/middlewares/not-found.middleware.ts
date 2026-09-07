import { NextFunction, Request, Response } from 'express';
import { AppError } from '../common/AppError';
import { HttpStatus } from '../common/http-status';

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} was not found.`, HttpStatus.NOT_FOUND));
};
