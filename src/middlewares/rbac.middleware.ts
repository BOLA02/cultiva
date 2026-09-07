import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../common/AppError';
import { HttpStatus } from '../common/http-status';

export const restrictTo = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return next(new AppError('You do not have permission to perform this action.', HttpStatus.FORBIDDEN));
    }

    next();
  };
};