import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/db';
import { AppError } from '../common/AppError';
import { HttpStatus } from '../common/http-status';
import { UserStatus } from '@prisma/client';

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError('Authentication failed. Please provide a valid session token.', HttpStatus.UNAUTHORIZED);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AppError('Access denied. Your authentication session is invalid or expired.', HttpStatus.UNAUTHORIZED);
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { status: true },
    });

    if (!currentUser) {
      throw new AppError('The account associated with this token no longer exists.', HttpStatus.UNAUTHORIZED);
    }

    if (currentUser.status === UserStatus.SUSPENDED || currentUser.status === UserStatus.INACTIVE) {
      throw new AppError('Your account no longer has access. Please contact platform support.', HttpStatus.FORBIDDEN);
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};